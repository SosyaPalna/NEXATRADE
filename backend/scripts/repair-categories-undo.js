// Reverses the previous repair-categories.js corruption.
// The previous script encoded correct UTF-8 names as windows-1251.
// This script restores them by decoding windows-1251 bytes back to UTF-8.

const iconv = require('iconv-lite');
const prisma = require('../lib/prisma');

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

function slugify(text) {
  return transliterate(text)
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function restoreName(garbled) {
  // garbled chars were produced by interpreting UTF-8 bytes as windows-1251.
  // Encode those chars back to windows-1251 bytes and decode as UTF-8.
  return iconv.decode(iconv.encode(garbled, 'win1251'), 'utf8');
}

async function main() {
  const categories = await prisma.category.findMany();
  const usedSlugs = new Set();

  for (const cat of categories) {
    const fixedName = restoreName(cat.name);
    // Если имя уже корректное (нет эффекта мажорной перекодировки), оставляем как есть.
    const needsFix = fixedName !== cat.name && /[а-яё]/i.test(fixedName);
    const finalName = needsFix ? fixedName : cat.name;
    let baseSlug = slugify(finalName) || `category-${cat.id.slice(0, 8)}`;
    let slug = baseSlug;
    let counter = 1;
    while (usedSlugs.has(slug) || await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);

    await prisma.category.update({
      where: { id: cat.id },
      data: { name: finalName, slug },
    });

    console.log(`${needsFix ? 'Restored' : 'Kept'}: "${cat.name}" -> "${finalName}" (slug: ${slug})`);
  }

  console.log('Done.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
