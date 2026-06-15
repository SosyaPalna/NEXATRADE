// One-time script to fix corrupted category names and slugs.
// The names were saved with UTF-8 bytes interpreted as windows-1251.
// Usage: node scripts/repair-categories.js

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

function fixEncoding(name) {
  // The stored string's UTF-8 bytes were interpreted as windows-1251.
  return iconv.decode(Buffer.from(name, 'utf8'), 'win1251');
}

async function main() {
  const categories = await prisma.category.findMany();
  const usedSlugs = new Set();

  for (const cat of categories) {
    const fixedName = fixEncoding(cat.name);
    let baseSlug = slugify(fixedName) || `category-${cat.id.slice(0, 8)}`;
    let slug = baseSlug;
    let counter = 1;
    while (usedSlugs.has(slug) || await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);

    await prisma.category.update({
      where: { id: cat.id },
      data: { name: fixedName, slug },
    });

    console.log(`Fixed: "${cat.name}" -> "${fixedName}" (slug: ${slug})`);
  }

  console.log('Done.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
