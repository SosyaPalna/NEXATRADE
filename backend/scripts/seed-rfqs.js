const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')

const BUYER = {
  email: 'demo-buyer1@nexatrade.local',
  password: 'DemoBuyer1!',
  tenant: {
    name: 'ООО «ПрогрессСтрой»',
    role: 'buyer',
    city: 'Москва',
    phone: '+7 (495) 123-45-67',
    description: 'Строительно-монтажная компания. Регулярно закупаем стройматериалы, электроинструмент и офисное оборудование.',
  },
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(23, 59, 0, 0)
  return d
}

const RFQS = [
  {
    title: 'Закупка цемента М500 для строительного объекта',
    categorySlug: 'stroitel-nye-materialy',
    quantity: 500,
    unit: 'шт.',
    budget: 250000,
    deadlineDays: 14,
    description: 'Требуется портландцемент М500 в мешках по 50 кг. Нужна доставка на объект в Московской области. Оплата по безналичному расчёту с отсрочкой 30 дней.',
  },
  {
    title: 'Закупка ноутбуков для сотрудников (15 шт.)',
    categorySlug: 'komp-yutery-i-noutbuki',
    quantity: 15,
    unit: 'шт.',
    budget: 900000,
    deadlineDays: 21,
    description: 'Ищем поставщика офисных ноутбуков (14-15", Core i5, 16 ГБ ОЗУ, SSD 512 ГБ). Необходима гарантия производителя и доставка в офис в Москве.',
  },
  {
    title: 'Офисные столы и стулья для нового офиса',
    categorySlug: 'ofisnaya-mebel',
    quantity: 20,
    unit: 'шт.',
    budget: 300000,
    deadlineDays: 30,
    description: 'Закупаем комплекты офисной мебели: столы 140×70 см и эргономичные кресла. Предпочтительны поставщики с доставкой и сборкой в Москве.',
  },
  {
    title: 'Кабель ВВГнг 3x1,5 для электромонтажных работ',
    categorySlug: 'kabel-i-provod',
    quantity: 2000,
    unit: 'м',
    budget: 180000,
    deadlineDays: 10,
    description: 'Требуется медный кабель ВВГнг 3×1,5 ГОСТ, две тысячи метров. Срочная поставка на объект в течение недели.',
  },
  {
    title: 'Картонные коробки для упаковки продукции',
    categorySlug: 'kartonnaya-upakovka',
    quantity: 5000,
    unit: 'шт.',
    budget: 120000,
    deadlineDays: 20,
    description: 'Нужны четырёхклапанные картонные коробки 400×300×250 мм с возможностью нанесения логотипа. Регулярные закупки.',
  },
  {
    title: 'Электроинструмент для монтажной бригады',
    categorySlug: 'elektroinstrument',
    quantity: 10,
    unit: 'шт.',
    budget: 150000,
    deadlineDays: 14,
    description: 'Закупаем перфораторы, дрели-шуруповёрты и болгарки для бригады. Важно наличие гарантии и сервисного обслуживания.',
  },
]

async function main() {
  // 1. Создаём демо-покупателя
  const hashedPassword = await bcrypt.hash(BUYER.password, 10)

  const tenant = await prisma.tenant.upsert({
    where: { name: BUYER.tenant.name },
    update: {},
    create: BUYER.tenant,
  })

  await prisma.user.upsert({
    where: { email: BUYER.email },
    update: {},
    create: {
      email: BUYER.email,
      password: hashedPassword,
      tenantId: tenant.id,
    },
  })

  console.log(`✅ Демо-покупатель: ${tenant.name} (${BUYER.email})`)

  // 2. Проверяем, не созданы ли уже RFQ от этого покупателя
  const existingCount = await prisma.rfq.count({ where: { buyerId: tenant.id } })
  if (existingCount > 0) {
    console.log(`ℹ️ RFQ для ${tenant.name} уже существуют (${existingCount} шт.), пропускаем создание`)
    return
  }

  // 3. Создаём RFQ
  for (const r of RFQS) {
    const category = await prisma.category.findUnique({ where: { slug: r.categorySlug } })
    if (!category) {
      console.warn(`⚠️ Категория ${r.categorySlug} не найдена, пропускаем RFQ «${r.title}»`)
      continue
    }

    await prisma.rfq.create({
      data: {
        title: r.title,
        description: r.description,
        quantity: r.quantity,
        unit: r.unit,
        budget: r.budget,
        deadline: daysFromNow(r.deadlineDays),
        status: 'open',
        buyerId: tenant.id,
        categoryId: category.id,
      },
    })

    console.log(`✅ Создана заявка: ${r.title}`)
  }
}

main()
  .catch((err) => {
    console.error('❌ Ошибка:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
