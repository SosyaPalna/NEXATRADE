const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');
const { deleteProductChatHistory } = require('../services/productCleanup');
const validate = require('../middleware/validate');
const { productSchema, productUpdateSchema, paginationSchema } = require('../schemas');
const { sanitizeText, sanitizeHtmlContent } = require('../lib/sanitize');

const router = express.Router();

// 🔹 Получить один товар (публично)
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tenant: { select: { id: true, name: true, role: true, avatarUrl: true, description: true, website: true, phone: true, city: true, isVerified: true, verificationStatus: true, deliveryMethods: true, paymentMethods: true } }
      }
    });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });

    // Засчитываем просмотр (не чаще раза в день с одного IP)
    if (product.tenantId !== req.tenantId) {
      const today = new Date().toISOString().slice(0, 10);
      try {
        await prisma.productView.upsert({
          where: { productId_ip_date: { productId: product.id, ip: req.ip, date: today } },
          update: {},
          create: {
            productId: product.id,
            tenantId: product.tenantId,
            ip: req.ip,
            date: today,
          }
        });
        await prisma.product.update({
          where: { id: product.id },
          data: { viewCount: { increment: 1 } }
        });
      } catch (viewErr) {
        console.error('Failed to track product view:', viewErr.message);
      }
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Получить товары (публично при ?all=true, иначе требуется авторизация)
router.get('/', validate(paginationSchema), async (req, res) => {
  try {
    const where = req.query.all === 'true'
      ? { deletedAt: null }
      : { tenantId: req.tenantId, deletedAt: null };

    // Фильтры
    const { categoryId, minPrice, maxPrice, inStock, search, city, sortBy, order } = req.query;
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

    // Сортировка
    const allowedSort = ['createdAt', 'updatedAt', 'price', 'viewCount', 'name'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';
    const orderBy = sortField === 'name' ? { name: sortOrder } : { [sortField]: sortOrder };

    // Пагинация
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } }, tenant: { select: { name: true, city: true, phone: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[products/list] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Создать товар
router.post('/', authenticate, validate(productSchema), async (req, res) => {
  try {
    const body = req.validated.body;
    const data = {
      name: sanitizeText(body.name),
      description: sanitizeHtmlContent(body.description),
      price: body.price,
      stock: body.stock ?? 0,
      unit: sanitizeText(body.unit) || 'шт.',
      isOpt: body.isOpt ?? true,
      isRetail: body.isRetail ?? false,
      images: Array.isArray(body.images) ? body.images.filter(url => typeof url === 'string' && url.startsWith('/uploads/')) : [],
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
    if (body.name !== undefined) data.name = sanitizeText(body.name);
    if (body.description !== undefined) data.description = sanitizeHtmlContent(body.description);
    if (body.price !== undefined) data.price = body.price;
    if (body.stock !== undefined) data.stock = body.stock;
    if (body.unit !== undefined) data.unit = sanitizeText(body.unit);
    if (body.isOpt !== undefined) data.isOpt = body.isOpt;
    if (body.isRetail !== undefined) data.isRetail = body.isRetail;
    if (body.images !== undefined) {
      data.images = Array.isArray(body.images)
        ? body.images.filter(url => typeof url === 'string' && url.startsWith('/uploads/'))
        : [];
    }
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;

    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Удалить товар (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.tenantId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа' });

    await deleteProductChatHistory(prisma, req.params.id);
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Товар удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
