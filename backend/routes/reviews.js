const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { reviewSchema } = require('../schemas');
const { sanitizeHtmlContent } = require('../lib/sanitize');

const router = express.Router();

// 🔹 Получить отзывы о компании
router.get('/tenant/:tenantId', authenticate, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { tenantId: req.params.tenantId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, city: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Считаем средний рейтинг
    const avg = await prisma.review.aggregate({
      where: { tenantId: req.params.tenantId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    res.json({
      reviews,
      summary: {
        average: avg._avg.rating ? Number(avg._avg.rating.toFixed(1)) : 0,
        count: avg._count.rating
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Создать отзыв
router.post('/', authenticate, validate(reviewSchema), async (req, res) => {
  try {
    const { tenantId, rating, text } = req.validated.body;

    // Нельзя оставить отзыв самому себе
    if (tenantId === req.tenantId) {
      return res.status(400).json({ error: 'Нельзя оставить отзыв своей компании' });
    }

    // Проверяем, существует ли компания
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Компания не найдена' });

    const review = await prisma.review.upsert({
      where: { tenantId_authorId: { tenantId, authorId: req.tenantId } },
      update: {
        rating,
        text: sanitizeHtmlContent(text),
      },
      create: {
        tenantId,
        authorId: req.tenantId,
        rating,
        text: sanitizeHtmlContent(text),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, city: true } }
      }
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Удалить свой отзыв
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ error: 'Отзыв не найден' });
    if (review.authorId !== req.tenantId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ message: 'Отзыв удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
