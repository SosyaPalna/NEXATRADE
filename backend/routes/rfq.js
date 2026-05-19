const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();


router.get('/', authenticate, async (req, res) => {
  try {
    const { role } = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { role: true }
    });

    let where = {};
    if (role === 'buyer') {
      where = { buyerId: req.tenantId };
    } else if (role === 'seller') {
      where = { status: 'open' };
    }

    // Фильтр по категории
    const { categoryId } = req.query;
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const rfqs = await prisma.rfq.findMany({
      where,
      include: {
        buyer: { select: { name: true, role: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { quotes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(rfqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Получить один RFQ с предложениями
router.get('/:id', authenticate, async (req, res) => {
  try {
    const rfq = await prisma.rfq.findUnique({
      where: { id: req.params.id },
      include: {
        buyer: { select: { name: true, role: true } },
        category: { select: { id: true, name: true, slug: true } },
        quotes: {
          include: {
            seller: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!rfq) return res.status(404).json({ error: 'RFQ не найден' });

    // Проверка доступа
    const { role } = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { role: true }
    });

    if (role === 'buyer' && rfq.buyerId !== req.tenantId) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    res.json(rfq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Создать RFQ (только buyer)
router.post('/', authenticate, async (req, res) => {
  try {
    const { role } = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { role: true }
    });

    if (role !== 'buyer') {
      return res.status(403).json({ error: 'Только покупатели могут создавать RFQ' });
    }

    const { title, description, quantity, unit, budget, deadline, categoryId } = req.body;
    if (!title || !description || !quantity) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const data = {
      title,
      description,
      quantity: parseInt(quantity),
      unit: unit || 'шт.',
      budget: budget ? parseFloat(budget) : null,
      deadline: deadline ? new Date(deadline) : null,
      buyerId: req.tenantId
    };

    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (cat) data.categoryId = categoryId;
    }

    const rfq = await prisma.rfq.create({ data });
    res.status(201).json(rfq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Отправить предложение (только seller)
router.post('/:id/quotes', authenticate, async (req, res) => {
  try {
    const { role } = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { role: true }
    });

    if (role !== 'seller') {
      return res.status(403).json({ error: 'Только поставщики могут отправлять предложения' });
    }

    const rfq = await prisma.rfq.findUnique({ where: { id: req.params.id } });
    if (!rfq) return res.status(404).json({ error: 'RFQ не найден' });
    if (rfq.status !== 'open') return res.status(400).json({ error: 'RFQ закрыт' });
    if (rfq.buyerId === req.tenantId) return res.status(400).json({ error: 'Нельзя отправить предложение самому себе' });

    const { price, deliveryTime, message } = req.body;
    if (!price) return res.status(400).json({ error: 'Цена обязательна' });

    // Проверка, не отправлял ли уже
    const existing = await prisma.quote.findFirst({
      where: { rfqId: req.params.id, sellerId: req.tenantId }
    });
    if (existing) return res.status(400).json({ error: 'Вы уже отправили предложение' });

    const quote = await prisma.quote.create({
      data: {
        price: parseFloat(price),
        deliveryTime,
        message,
        rfqId: req.params.id,
        sellerId: req.tenantId
      }
    });

    // Обновляем статус RFQ
    await prisma.rfq.update({
      where: { id: req.params.id },
      data: { status: 'in_progress' }
    });

    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Принять/отклонить предложение (только buyer)
router.patch('/quotes/:id', authenticate, async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: { rfq: true }
    });

    if (!quote) return res.status(404).json({ error: 'Предложение не найдено' });
    if (quote.rfq.buyerId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа' });

    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    await prisma.quote.update({
      where: { id: req.params.id },
      data: { status }
    });

    // Если приняли предложение — закрываем RFQ
    if (status === 'accepted') {
      await prisma.rfq.update({
        where: { id: quote.rfqId },
        data: { status: 'closed' }
      });
    }

    res.json({ message: `Предложение ${status === 'accepted' ? 'принято' : 'отклонено'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Закрыть RFQ
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const rfq = await prisma.rfq.findUnique({ where: { id: req.params.id } });
    if (!rfq || rfq.buyerId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа' });

    const { status } = req.body;
    if (!['open', 'closed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const updated = await prisma.rfq.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
