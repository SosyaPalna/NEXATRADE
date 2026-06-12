const express = require('express');
const authenticate = require('../middleware/auth');
const { createUpload, getPublicPath } = require('../lib/upload');

const router = express.Router();

function handleUpload(type, fieldName) {
  const upload = createUpload(type).single(fieldName);
  return [authenticate, (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        console.error(`Upload error (${type}):`, err.message);
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
      }
      const url = getPublicPath(type, req.file.filename);
      res.json({ url });
    });
  }];
}

router.post('/product-image', ...handleUpload('products', 'image'));
router.post('/tenant-avatar', ...handleUpload('tenants', 'image'));
router.post('/tenant-cover', ...handleUpload('tenants', 'image'));
router.post('/report-screenshot', ...handleUpload('reports', 'image'));
router.post('/verification-doc', ...handleUpload('verifications', 'image'));

module.exports = router;
