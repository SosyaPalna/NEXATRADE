const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');

const router = express.Router();

// 🔹 Дашборд аналитики для текущего продавца
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Общие метрики
    const [
      productsStats,
      rfqStats,
      quoteStats,
      reviewStats,
      topProducts,
      viewsByDay,
      recentViews,
    ] = await Promise.all([
      // Товары
      prisma.product.aggregate({
        where: { tenantId, deletedAt: null },
        _count: { id: true },
        _sum: { viewCount: true },
      }),

      // RFQ (созданные компанией)
      prisma.rfq.aggregate({
        where: { buyerId: tenantId, deletedAt: null },
        _count: { id: true },
      }),

      // Отклики на свои RFQ
      prisma.quote.count({
        where: {
          rfq: { buyerId: tenantId },
          deletedAt: null,
        },
      }),

      // Отзывы
      prisma.review.aggregate({
        where: { tenantId },
        _avg: { rating: true },
        _count: { rating: true },
      }),

      // Топ-5 товаров по просмотрам
      prisma.product.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { id: true, name: true, viewCount: true, images: true, price: true, unit: true },
      }),

      // Просмотры по дням за 30 дней
      prisma.productView.groupBy({
        by: ['date'],
        where: { tenantId, date: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { date: 'asc' },
      }),

      // Просмотры сегодня
      prisma.productView.count({
        where: { tenantId, date: today },
      }),
    ]);

    res.json({
      summary: {
        totalProducts: productsStats._count.id,
        totalViews: productsStats._sum.viewCount || 0,
        todayViews: recentViews,
        totalRfqs: rfqStats._count.id,
        totalQuotes: quoteStats,
        averageRating: reviewStats._avg.rating ? Number(reviewStats._avg.rating.toFixed(1)) : 0,
        reviewsCount: reviewStats._count.rating,
      },
      topProducts,
      viewsByDay: viewsByDay.map(day => ({
        date: day.date,
        count: day._count.id,
      })),
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
