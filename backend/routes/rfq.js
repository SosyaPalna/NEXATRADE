const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');
const { getIo } = require('../utils/socket');

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

    const parsedQuantity = parseInt(quantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 2147483647) {
      return res.status(400).json({ error: 'Количество должно быть целым числом от 1 до 2 147 483 647' });
    }

    const parsedBudget = budget ? parseFloat(budget) : null;
    if (parsedBudget !== null && (!Number.isFinite(parsedBudget) || parsedBudget < 0 || parsedBudget > 99999999.99)) {
      return res.status(400).json({ error: 'Бюджет должен быть от 0 до 99 999 999.99 ₽' });
    }

    const data = {
      title,
      description,
      quantity: parsedQuantity,
      unit: unit || 'шт.',
      budget: parsedBudget,
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
      },
      include: { seller: { select: { name: true } } }
    });

    // Обновляем статус RFQ
    await prisma.rfq.update({
      where: { id: req.params.id },
      data: { status: 'in_progress' }
    });

    // Уведомляем покупателя о новом предложении
    try {
      const notification = await prisma.notification.create({
        data: {
          title: `Новое предложение по заявке «${rfq.title}»`,
          message: `Компания «${quote.seller.name}» предложила цену ${price} ₽${deliveryTime ? `, срок поставки: ${deliveryTime}` : ''}.`,
          type: 'rfq',
          link: `/rfq/${req.params.id}`,
          recipientId: rfq.buyerId,
          metadata: { rfqId: req.params.id, quoteId: quote.id, sellerId: req.tenantId },
        },
      });
      const io = getIo();
      if (io) {
        io.to(`tenant:${rfq.buyerId}`).emit('notification:new', notification);
      }
    } catch (notifyErr) {
      console.error('❌ Quote notification error:', notifyErr.message);
    }

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
