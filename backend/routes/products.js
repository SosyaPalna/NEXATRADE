const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 🔹 Получить один товар
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tenant: { select: { id: true, name: true, role: true, avatarUrl: true, description: true, website: true, phone: true, city: true, isVerified: true, verificationStatus: true, deliveryMethods: true, paymentMethods: true } }
      }
    });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Получить товары (только свои, или все если передать ?all=true)
router.get('/', authenticate, async (req, res) => {
  try {
    const where = req.query.all === 'true' ? {} : { tenantId: req.tenantId };

    // Фильтры
    const { categoryId, minPrice, maxPrice, inStock, search } = req.query;
    if (categoryId) where.categoryId = categoryId;
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };
    if (inStock === 'true') where.stock = { gt: 0 };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } }, tenant: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Создать товар
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, price, stock, unit, categoryId, isOpt, isRetail, images } = req.body;
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: 'Название и цена обязательны' });
    }

    const data = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      unit: unit || 'шт.',
      isOpt: isOpt !== undefined ? isOpt : true,
      isRetail: isRetail !== undefined ? isRetail : false,
      images: Array.isArray(images) ? images : [],
      tenantId: req.tenantId
    };

    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (cat) data.categoryId = categoryId;
    }

    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Обновить товар (только владелец может)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.tenantId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа к этому товару' });

    const { name, description, price, stock, unit, categoryId, isOpt, isRetail, images } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = parseFloat(price);
    if (stock !== undefined) data.stock = parseInt(stock);
    if (unit !== undefined) data.unit = unit;
    if (isOpt !== undefined) data.isOpt = isOpt;
    if (isRetail !== undefined) data.isRetail = isRetail;
    if (images !== undefined) data.images = Array.isArray(images) ? images : [];
    if (categoryId !== undefined) data.categoryId = categoryId || null;

    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Удалить товар
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.tenantId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа' });
    
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Товар удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Загрузка изображения товара (base64)
router.post('/upload-image', authenticate, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Нет изображения' });
    // В реальном проекте здесь была бы загрузка на S3/Cloudinary
    res.json({ url: image });
  } catch (err) {
    console.error('❌ POST /products/upload-image error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
