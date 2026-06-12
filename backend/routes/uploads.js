const express = require('express');
const authenticate = require('../middleware/auth');
const { createUpload, createUploadMultiple, getPublicPath } = require('../lib/upload');

const router = express.Router();

function handleUpload(type, fieldName) {
  const handlers = createUploadMultiple(type, fieldName, 1);
  return [authenticate, ...handlers, (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    const file = req.files[0];
    res.json({ url: file.url, variants: file.variants });
  }];
}

// Одиночная загрузка (обратная совместимость)
router.post('/product-image', ...handleUpload('products', 'image'));
router.post('/tenant-avatar', ...handleUpload('tenants', 'image'));
router.post('/tenant-cover', ...handleUpload('tenants', 'image'));
router.post('/report-screenshot', ...handleUpload('reports', 'image'));
router.post('/verification-doc', ...createUploadMultiple('verifications', 'image'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  const file = req.files[0];
  res.json({ url: file.url, variants: file.variants });
});

// Множественная загрузка фото товаров
router.post(
  '/product-images',
  authenticate,
  ...createUploadMultiple('products', 'images'),
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не загружены' });
    }
    const urls = req.files.map(file => file.url);
    const variants = req.files.map(file => file.variants);
    res.json({ urls, variants });
  }
);

module.exports = router;
