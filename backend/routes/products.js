const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { productSchema, productUpdateSchema, paginationSchema } = require('../schemas');

const router = express.Router();

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
router.get('/', authenticate, validate(paginationSchema), async (req, res) => {
  try {
    const where = req.query.all === 'true' ? {} : { tenantId: req.tenantId };

    // Фильтры
    const { categoryId, minPrice, maxPrice, inStock, search, city } = req.query;
    if (categoryId) where.categoryId = categoryId;
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };
    if (inStock === 'true') where.stock = { gt: 0 };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (city && city !== 'Все города') {
      where.tenant = { city: { contains: city, mode: 'insensitive' } };
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
router.post('/', authenticate, validate(productSchema), async (req, res) => {
  try {
    const body = req.validated.body;
    const data = {
      name: body.name,
      description: body.description,
      price: body.price,
      stock: body.stock ?? 0,
      unit: body.unit || 'шт.',
      isOpt: body.isOpt ?? true,
      isRetail: body.isRetail ?? false,
      images: body.images || [],
      tenantId: req.tenantId
    };

    if (body.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (cat) data.categoryId = body.categoryId;
    }

    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Обновить товар (только владелец может)
router.put('/:id', authenticate, validate(productUpdateSchema), async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.tenantId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа к этому товару' });

    const body = req.validated.body;
    const data = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.price !== undefined) data.price = body.price;
    if (body.stock !== undefined) data.stock = body.stock;
    if (body.unit !== undefined) data.unit = body.unit;
    if (body.isOpt !== undefined) data.isOpt = body.isOpt;
    if (body.isRetail !== undefined) data.isRetail = body.isRetail;
    if (body.images !== undefined) data.images = body.images;
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;

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

module.exports = router;
