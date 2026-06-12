const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { companyUpdateSchema } = require('../schemas');

const router = express.Router();

// 🔹 Получить публичный профиль компании по ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, role: true, description: true,
        website: true, phone: true, avatarUrl: true, coverUrl: true,
        socialLinks: true, createdAt: true, city: true,
        isVerified: true, verificationStatus: true,
        deliveryMethods: true, paymentMethods: true,
        products: { select: { id: true, name: true, description: true, price: true, unit: true, stock: true, isOpt: true, isRetail: true, images: true, categoryId: true }, take: 6 },
        _count: { select: { rfqs: true, products: true } }
      }
    });

    if (!tenant) return res.status(404).json({ error: 'Компания не найдена' });
    res.json(tenant);
  } catch (err) {
    console.error('❌ GET /company/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Обновить профиль своей компании
router.put('/me', authenticate, validate(companyUpdateSchema), async (req, res) => {
  try {
    const body = req.validated.body;

    // Собираем только те поля, которые реально переданы (включая пустые строки!)
    const updateData = {};
    if (body.description !== undefined) updateData.description = body.description;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.coverUrl !== undefined) updateData.coverUrl = body.coverUrl;
    if (body.socialLinks !== undefined) updateData.socialLinks = body.socialLinks || null;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.deliveryMethods !== undefined) updateData.deliveryMethods = body.deliveryMethods;
    if (body.paymentMethods !== undefined) updateData.paymentMethods = body.paymentMethods;
    
    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: updateData,
      select: {
        id: true, name: true, role: true, description: true,
        website: true, phone: true, avatarUrl: true, coverUrl: true,
        socialLinks: true, city: true, deliveryMethods: true, paymentMethods: true
      }
    });
    
    res.json(tenant);
  } catch (err) {
    console.error('❌ PUT /company/me error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;