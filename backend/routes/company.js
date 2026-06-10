const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

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
router.put('/me', authenticate, async (req, res) => {
  try {
    const { description, website, phone, avatarUrl, coverUrl, socialLinks, city, deliveryMethods, paymentMethods } = req.body;
    
    // Собираем только те поля, которые реально переданы (включая пустые строки!)
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (website !== undefined) updateData.website = website;
    if (phone !== undefined) updateData.phone = phone;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl; // ← Пустая строка тоже пройдёт
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;   // ← Пустая строка тоже пройдёт
    if (socialLinks !== undefined) {
      updateData.socialLinks = socialLinks ? JSON.parse(JSON.stringify(socialLinks)) : null;
    }
    if (city !== undefined) updateData.city = city;
    if (deliveryMethods !== undefined) updateData.deliveryMethods = Array.isArray(deliveryMethods) ? deliveryMethods : [];
    if (paymentMethods !== undefined) updateData.paymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
    
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

// 🔹 Загрузка изображения (base64)
router.post('/upload-image', authenticate, async (req, res) => {
  try {
    const { image, type } = req.body; // image: base64 string, type: 'avatar' | 'cover'
    
    if (!image || !['avatar', 'cover'].includes(type)) {
      return res.status(400).json({ error: 'Неверные данные' });
    }
    
    // В реальном проекте здесь была бы загрузка на S3/Cloudinary
    // Для диплома: просто возвращаем base64 как есть (или можно обрезать)
    res.json({ url: image });
  } catch (err) {
    console.error('❌ POST /company/upload-image error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;