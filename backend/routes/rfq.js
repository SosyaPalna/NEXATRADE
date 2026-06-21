const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const validate = require('../middleware/validate');
const { rfqSchema, quoteSchema } = require('../schemas');
const { getIo } = require('../utils/socket');

const router = express.Router();


router.get('/', optionalAuth, async (req, res) => {
  try {
    // Раздел заявок доступен всем ролям и гостям: показываем открытые RFQ
    const where = { status: 'open' };

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
router.get('/:id', optionalAuth, async (req, res) => {
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

    // Публичный доступ только к открытым RFQ
    if (!req.tenantId && rfq.status !== 'open') {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    res.json(rfq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Создать RFQ (только buyer)
router.post('/', authenticate, validate(rfqSchema), async (req, res) => {
  try {
    const { role } = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { role: true }
    });

    if (role !== 'buyer') {
      return res.status(403).json({ error: 'Только покупатели могут создавать RFQ' });
    }

    const body = req.validated.body;

    const data = {
      title: body.title,
      description: body.description,
      quantity: body.quantity,
      unit: body.unit || 'шт.',
      budget: body.budget ?? null,
      deadline: body.deadline ? new Date(body.deadline) : null,
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
router.post('/:id/quotes', authenticate, validate(quoteSchema), async (req, res) => {
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

    const body = req.validated.body;

    // Проверка, не отправлял ли уже
    const existing = await prisma.quote.findFirst({
      where: { rfqId: req.params.id, sellerId: req.tenantId }
    });
    if (existing) return res.status(400).json({ error: 'Вы уже отправили предложение' });

    const quote = await prisma.quote.create({
      data: {
        price: body.price,
        deliveryTime: body.deliveryTime,
        message: body.message,
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
