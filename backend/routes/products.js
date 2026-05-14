const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 🔹 Получить товары (только свои, или все если передать ?tenantId=)
router.get('/', authenticate, async (req, res) => {
  try {
    const where = req.query.all === 'true' ? {} : { tenantId: req.tenantId };
    const products = await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Создать товар
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Название и цена обязательны' });
    
    const product = await prisma.product.create({
      data: { name, description, price: parseFloat(price), stock: parseInt(stock) || 0, category, tenantId: req.tenantId }
    });
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
    
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        stock: req.body.stock ? parseInt(req.body.stock) : undefined
      }
    });
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