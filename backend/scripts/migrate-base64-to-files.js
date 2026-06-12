/**
 * One-time migration: convert base64 strings in DB to local files.
 * Run on server: cd /var/www/NEXATRADE/backend && node scripts/migrate-base64-to-files.js
 */
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { UPLOAD_ROOT, getPublicPath } = require('../lib/upload');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseBase64(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.match(/^data:([a-zA-Z0-9+/\-]+);base64,(.*)$/);
  if (match) {
    return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
  }
  // Plain base64 without data URI
  try {
    const buffer = Buffer.from(str, 'base64');
    if (buffer.length > 0) return { mime: null, buffer };
  } catch {}
  return null;
}

function getExtFromMime(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
  };
  return map[mime] || 'bin';
}

function detectMime(buffer) {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg';
  if (buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png';
  if (buffer.slice(0, 4).toString('hex') === '52494646') return 'image/webp';
  if (buffer.slice(0, 4).toString('hex') === '25504446') return 'application/pdf';
  return 'application/octet-stream';
}

function saveFile(type, buffer, mime) {
  const dir = path.join(UPLOAD_ROOT, type);
  ensureDir(dir);
  const ext = getExtFromMime(mime || detectMime(buffer));
  const filename = `${require('crypto').randomBytes(16).toString('hex')}.${ext}`;
  const absolute = path.join(dir, filename);
  fs.writeFileSync(absolute, buffer);
  return getPublicPath(type, filename);
}

async function migrateField(records, type, field, isArray) {
  let converted = 0;
  for (const record of records) {
    const values = isArray ? (record[field] || []) : [record[field]];
    const newValues = [];
    let changed = false;

    for (const value of values) {
      const parsed = parseBase64(value);
      if (parsed) {
        const url = saveFile(type, parsed.buffer, parsed.mime);
        newValues.push(url);
        converted++;
        changed = true;
      } else {
        newValues.push(value);
      }
    }

    if (changed) {
      await prisma[record.$modelName].update({
        where: { id: record.id },
        data: { [field]: isArray ? newValues : newValues[0] }
      });
    }
  }
  return converted;
}

async function main() {
  console.log('Starting base64 → files migration...');

  // Products
  const products = await prisma.product.findMany({ select: { id: true, images: true } });
  const productCount = await migrateField(products, 'products', 'images', true);
  console.log(`Products: ${productCount} images migrated`);

  // Tenants
  const tenants = await prisma.tenant.findMany({ select: { id: true, avatarUrl: true, coverUrl: true, verificationDocs: true } });
  let tenantCount = 0;
  for (const tenant of tenants) {
    const updates = {};
    if (tenant.avatarUrl) {
      const parsed = parseBase64(tenant.avatarUrl);
      if (parsed) { updates.avatarUrl = saveFile('tenants', parsed.buffer, parsed.mime); tenantCount++; }
    }
    if (tenant.coverUrl) {
      const parsed = parseBase64(tenant.coverUrl);
      if (parsed) { updates.coverUrl = saveFile('tenants', parsed.buffer, parsed.mime); tenantCount++; }
    }
    if (tenant.verificationDocs?.length) {
      const newDocs = [];
      for (const doc of tenant.verificationDocs) {
        const parsed = parseBase64(doc);
        if (parsed) { newDocs.push(saveFile('verifications', parsed.buffer, parsed.mime)); tenantCount++; }
        else newDocs.push(doc);
      }
      updates.verificationDocs = newDocs;
    }
    if (Object.keys(updates).length) {
      await prisma.tenant.update({ where: { id: tenant.id }, data: updates });
    }
  }
  console.log(`Tenants: ${tenantCount} files migrated`);

  // Reports
  const reports = await prisma.report.findMany({ select: { id: true, screenshots: true } });
  const reportCount = await migrateField(reports, 'reports', 'screenshots', true);
  console.log(`Reports: ${reportCount} screenshots migrated`);

  console.log('Migration completed.');
}

main()
  .catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
