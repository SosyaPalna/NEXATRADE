const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mime = require('mime-types');
const FileType = require('file-type');
const sharp = require('sharp');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const ALLOWED_MIMES = {
  products: ['image/jpeg', 'image/png', 'image/webp'],
  tenants: ['image/jpeg', 'image/png', 'image/webp'],
  reports: ['image/jpeg', 'image/png', 'image/webp'],
  verifications: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  chat: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'],
};

const ALLOWED_EXTENSIONS = {
  products: ['jpg', 'jpeg', 'png', 'webp'],
  tenants: ['jpg', 'jpeg', 'png', 'webp'],
  reports: ['jpg', 'jpeg', 'png', 'webp'],
  verifications: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  chat: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'xlsx', 'txt'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ
const MAX_FILES_PER_REQUEST = 10;

const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, fit: 'cover' },
  preview: { width: 400, height: 400, fit: 'inside' },
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateFilename() {
  return crypto.randomBytes(16).toString('hex');
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
    // txt без BOM часто не определяется file-type — проверяем по расширению
    const ext = getExtension(filePath);
    if (allowedMimes.includes('text/plain') && ext === 'txt') return true;
    return false;
  }

  if (allowedMimes.includes(fileType.mime)) return true;

  // docx/xlsx — ZIP-архивы; file-type возвращает application/zip
  if (fileType.mime === 'application/zip') {
    const ext = getExtension(filePath);
    if (ext === 'docx' && allowedMimes.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return true;
    if (ext === 'xlsx' && allowedMimes.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return true;
  }

  return false;
}

/**
 * Обрабатывает изображение: конвертирует в WebP и создаёт превью.
 * Возвращает базовое имя файла (без расширения).
 */
async function processImage(filePath, type) {
  const baseName = generateFilename();
  const destDir = path.join(UPLOAD_ROOT, type);
  ensureDir(destDir);

  const originalPath = path.join(destDir, `${baseName}.webp`);
  const previewPath = path.join(destDir, `${baseName}-preview.webp`);
  const thumbnailPath = path.join(destDir, `${baseName}-thumbnail.webp`);

  await sharp(filePath)
    .webp({ quality: 85 })
    .toFile(originalPath);

  await sharp(filePath)
    .resize(IMAGE_SIZES.preview.width, IMAGE_SIZES.preview.height, { fit: IMAGE_SIZES.preview.fit })
    .webp({ quality: 75 })
    .toFile(previewPath);

  await sharp(filePath)
    .resize(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, { fit: IMAGE_SIZES.thumbnail.fit })
    .webp({ quality: 70 })
    .toFile(thumbnailPath);

  // Удаляем оригинал
  fs.unlinkSync(filePath);

  return baseName;
}

function createUpload(type) {
  const dest = path.join(UPLOAD_ROOT, type);
  ensureDir(dest);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => cb(null, `${generateFilename()}-${getExtension(file.originalname)}`),
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
  return [upload, validateAndProcessUploadedFiles(type)];
}

function validateAndProcessUploadedFiles(type) {
  return async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const processedFiles = [];

    try {
      for (const file of req.files) {
        const isValid = await validateFileMagicBytes(file.path, type);
        if (!isValid) {
          throw new Error(`Файл ${file.originalname} имеет недопустимое содержимое`);
        }

        if (file.mimetype.startsWith('image/')) {
          const baseName = await processImage(file.path, type);
          file.filename = `${baseName}.webp`;
          file.variants = {
            original: getPublicPath(type, `${baseName}.webp`),
            preview: getPublicPath(type, `${baseName}-preview.webp`),
            thumbnail: getPublicPath(type, `${baseName}-thumbnail.webp`),
          };
          file.url = file.variants.original;
          processedFiles.push(file);
        } else {
          // PDF и другие не-изображения — оставляем как есть
          file.url = getPublicPath(type, file.filename);
          file.variants = { original: file.url };
          processedFiles.push(file);
        }
      }
      req.files = processedFiles;
      next();
    } catch (err) {
      // Удаляем все загруженные/обработанные файлы при ошибке
      processedFiles.forEach(f => {
        try {
          if (f.variants) {
            Object.values(f.variants).forEach(url => fs.unlinkSync(path.join(UPLOAD_ROOT, url.replace('/uploads/', ''))));
          }
          fs.unlinkSync(f.path);
        } catch {}
      });
      req.files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch {}
      });
      return res.status(400).json({ error: err.message });
    }
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
  processImage,
};
