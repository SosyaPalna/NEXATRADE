const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mime = require('mime-types');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const ALLOWED_MIMES = {
  'products': ['image/jpeg', 'image/png', 'image/webp'],
  'tenants': ['image/jpeg', 'image/png', 'image/webp'],
  'reports': ['image/jpeg', 'image/png', 'image/webp'],
  'verifications': ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateFilename(originalname) {
  const ext = mime.extension(mime.lookup(originalname) || 'application/octet-stream') || 'bin';
  const random = crypto.randomBytes(16).toString('hex');
  return `${random}.${ext}`;
}

function createUpload(type) {
  const dest = path.join(UPLOAD_ROOT, type);
  ensureDir(dest);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => cb(null, generateFilename(file.originalname)),
  });

  const fileFilter = (req, file, cb) => {
    const allowed = ALLOWED_MIMES[type] || [];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Недопустимый тип файла: ${file.mimetype}`), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
}

function getPublicPath(type, filename) {
  return `/uploads/${type}/${filename}`;
}

function getAbsolutePath(type, filename) {
  return path.join(UPLOAD_ROOT, type, filename);
}

module.exports = {
  UPLOAD_ROOT,
  createUpload,
  getPublicPath,
  getAbsolutePath,
  ALLOWED_MIMES,
  MAX_FILE_SIZE,
};
