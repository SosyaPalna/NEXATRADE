const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');

const router = express.Router();

// 🔹 Дашборд аналитики для текущего пользователя
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { role: true }
    });

    // Общие метрики
    const [
      productsStats,
      rfqStats,
      quoteStats,
      reviewStats,
      topProducts,
      viewsByDay,
      recentViews,
      unreadMessages,
      quotesSubmitted,
      openRfqs,
      recentActivity,
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

      // Непрочитанные сообщения
      prisma.message.count({
        where: {
          senderId: { not: tenantId },
          readAt: null,
          OR: [
            { product: { tenantId } },
            { rfq: { buyerId: tenantId } },
            { rfq: { quotes: { some: { sellerId: tenantId } } } },
          ],
        },
      }),

      // Отклики, отправленные компанией (для продавца)
      prisma.quote.count({
        where: { sellerId: tenantId, deletedAt: null },
      }),

      // Открытые RFQ (для покупателя)
      prisma.rfq.count({
        where: { buyerId: tenantId, status: 'open', deletedAt: null },
      }),

      // Последняя активность
      prisma.notification.findMany({
        where: { recipientId: tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, message: true, type: true, link: true, createdAt: true, isRead: true },
      }),
    ]);

    res.json({
      role: tenant?.role || 'buyer',
      summary: {
        totalProducts: productsStats._count.id,
        totalViews: productsStats._sum.viewCount || 0,
        todayViews: recentViews,
        totalRfqs: rfqStats._count.id,
        totalQuotes: quoteStats,
        unreadMessages,
        quotesSubmitted,
        openRfqs,
        averageRating: reviewStats._avg.rating ? Number(reviewStats._avg.rating.toFixed(1)) : 0,
        reviewsCount: reviewStats._count.rating,
      },
      topProducts,
      viewsByDay: viewsByDay.map(day => ({
        date: day.date,
        count: day._count.id,
      })),
      recentActivity,
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
