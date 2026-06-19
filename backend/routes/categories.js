const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');

const router = express.Router();

// 🔐 Middleware: проверка на админа
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Неавторизован' });
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true }
    });
    if (!user?.isAdmin) return res.status(403).json({ error: 'Доступ только для администраторов' });
    next();
  } catch (err) {
    res.status(401).json({ error: 'Неавторизован' });
  }
};

// Хелперы для генерации slug
function transliterate(text) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya',
  };
  return text
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] || ch)
    .join('');
}

const slugify = (text) => {
  return transliterate(text)
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// 🔹 Дерево категорий (для сайдбара MarketLayout)
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      select: {
        id: true, name: true, slug: true,
        children: {
          select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
          orderBy: { name: 'asc' }
        },
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (err) {
    console.error('❌ GET /categories error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Плоский список всех категорий (для форм и фильтров)
router.get('/flat', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, parentId: true }
    });
    res.json(categories);
  } catch (err) {
    console.error('❌ GET /categories/flat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Конкретная категория + товары с пагинацией
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: { orderBy: { name: 'asc' } },
        products: {
          include: {
            tenant: { select: { id: true, name: true, role: true, avatarUrl: true, city: true, phone: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        },
        _count: { select: { products: true } }
      }
    });

    if (!category) return res.status(404).json({ error: 'Категория не найдена' });

    const total = category._count.products;
    res.json({ category, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('GET /categories/:slug error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Создать категорию (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    let slug = slugify(name);
    let existing = await prisma.category.findUnique({ where: { slug } });
    let counter = 1;
    while (existing) {
      slug = `${slugify(name)}-${counter}`;
      existing = await prisma.category.findUnique({ where: { slug } });
      counter++;
    }

    const data = { name: name.trim(), slug };
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) return res.status(400).json({ error: 'Родительская категория не найдена' });
      data.parentId = parentId;
    }

    const category = await prisma.category.create({ data });
    res.status(201).json(category);
  } catch (err) {
    console.error('❌ POST /categories error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Обновить категорию (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const { id } = req.params;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Категория не найдена' });

    const data = {};
    if (name !== undefined) {
      if (name.trim().length === 0) return res.status(400).json({ error: 'Название не может быть пустым' });
      data.name = name.trim();
      // Перегенерируем slug если изменилось название
      if (name.trim() !== existing.name) {
        let slug = slugify(name.trim());
        let slugExists = await prisma.category.findUnique({ where: { slug } });
        let counter = 1;
        while (slugExists && slugExists.id !== id) {
          slug = `${slugify(name.trim())}-${counter}`;
          slugExists = await prisma.category.findUnique({ where: { slug } });
          counter++;
        }
        data.slug = slug;
      }
    }
    if (parentId !== undefined) {
      if (parentId === null || parentId === '') {
        data.parentId = null;
      } else {
        const parent = await prisma.category.findUnique({ where: { id: parentId } });
        if (!parent) return res.status(400).json({ error: 'Родительская категория не найдена' });
        if (parentId === id) return res.status(400).json({ error: 'Категория не может быть родителем самой себя' });
        data.parentId = parentId;
      }
    }

    const category = await prisma.category.update({ where: { id }, data });
    res.json(category);
  } catch (err) {
    console.error('❌ PUT /categories/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Удалить категорию (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Категория не найдена' });

    // Проверяем, есть ли дочерние категории
    const children = await prisma.category.count({ where: { parentId: id } });
    if (children > 0) {
      return res.status(400).json({ error: 'Нельзя удалить категорию с подкатегориями. Сначала удалите подкатегории.' });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Категория удалена' });
  } catch (err) {
    console.error('❌ DELETE /categories/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
