const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mime = require('mime-types');
const FileType = require('file-type');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const ALLOWED_MIMES = {
  products: ['image/jpeg', 'image/png', 'image/webp'],
  tenants: ['image/jpeg', 'image/png', 'image/webp'],
  reports: ['image/jpeg', 'image/png', 'image/webp'],
  verifications: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

const ALLOWED_EXTENSIONS = {
  products: ['jpg', 'jpeg', 'png', 'webp'],
  tenants: ['jpg', 'jpeg', 'png', 'webp'],
  reports: ['jpg', 'jpeg', 'png', 'webp'],
  verifications: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ
const MAX_FILES_PER_REQUEST = 10;

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

function getExtension(filename) {
  return path.extname(filename).toLowerCase().replace('.', '');
}

function validateFileExtension(filename, type) {
  const ext = getExtension(filename);
  const allowed = ALLOWED_EXTENSIONS[type] || [];
  return allowed.includes(ext);
}

async function validateFileMagicBytes(filePath, type) {
  const allowedMimes = ALLOWED_MIMES[type] || [];
  const fileType = await FileType.fromFile(filePath);
  if (!fileType) {
    // PDF не определяется file-type как изображение, проверяем отдельно
    const buffer = fs.readFileSync(filePath);
    const isPdf = buffer.slice(0, 5).toString() === '%PDF-';
    if (allowedMimes.includes('application/pdf') && isPdf) return true;
    return false;
  }
  return allowedMimes.includes(fileType.mime);
}

function createUpload(type) {
  const dest = path.join(UPLOAD_ROOT, type);
  ensureDir(dest);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => cb(null, generateFilename(file.originalname)),
  });

  const fileFilter = (req, file, cb) => {
    const allowedMimes = ALLOWED_MIMES[type] || [];
    const allowedExts = ALLOWED_EXTENSIONS[type] || [];
    const ext = getExtension(file.originalname);

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error(`Недопустимый тип файла: ${file.mimetype}`), false);
    }
    if (!allowedExts.includes(ext)) {
      return cb(new Error(`Недопустимое расширение файла: .${ext}`), false);
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
}

/**
 * Middleware для множественной загрузки файлов с валидацией.
 */
function createUploadMultiple(type, fieldName, maxCount = MAX_FILES_PER_REQUEST) {
  const upload = createUpload(type).array(fieldName, maxCount);
  return [upload, validateUploadedFiles(type)];
}

function validateUploadedFiles(type) {
  return async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    for (const file of req.files) {
      const isValid = await validateFileMagicBytes(file.path, type);
      if (!isValid) {
        // Удаляем все загруженные файлы при ошибке
        req.files.forEach(f => {
          try { fs.unlinkSync(f.path); } catch {}
        });
        return res.status(400).json({ error: `Файл ${file.originalname} имеет недопустимое содержимое` });
      }
    }
    next();
  };
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
  createUploadMultiple,
  getPublicPath,
  getAbsolutePath,
  ALLOWED_MIMES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILES_PER_REQUEST,
  validateFileMagicBytes,
};
