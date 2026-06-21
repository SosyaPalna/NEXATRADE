const prisma = require('../lib/prisma')

const DEMO_DOCS = [
  'https://placehold.co/400x300/png?text=Demo+Verification+Doc+1',
  'https://placehold.co/400x300/png?text=Demo+Verification+Doc+2',
]

const VERIFICATIONS = [
  {
    email: 'demo-supplier1@nexatrade.local',
    inn: '7701234567',
    ogrn: '1177746123456',
    kpp: '770101001',
    companyType: 'ООО',
    legalAddress: 'г. Москва, ул. Строительная, д. 10, офис 101',
    directorName: 'Иванов Иван Иванович',
  },
  {
    email: 'demo-supplier2@nexatrade.local',
    inn: '7809876543',
    ogrn: '1187846987654',
    kpp: '780201001',
    companyType: 'ООО',
    legalAddress: 'г. Санкт-Петербург, ул. Технологическая, д. 25',
    directorName: 'Смирнов Алексей Петрович',
  },
  {
    email: 'demo-supplier3@nexatrade.local',
    inn: '667123456789',
    ogrn: '319667100123456',
    kpp: null,
    companyType: 'ИП',
    legalAddress: 'г. Екатеринбург, ул. Мебельная, д. 5',
    directorName: 'Петрова Мария Сергеевна',
  },
]

async function main() {
  for (const v of VERIFICATIONS) {
    const user = await prisma.user.findUnique({
      where: { email: v.email },
      select: { tenantId: true },
    })

    if (!user) {
      console.warn(`⚠️  Пользователь ${v.email} не найден, пропускаем`)
      continue
    }

    const tenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        inn: v.inn,
        ogrn: v.ogrn,
        kpp: v.kpp,
        companyType: v.companyType,
        legalAddress: v.legalAddress,
        directorName: v.directorName,
        verificationDocs: DEMO_DOCS,
        verificationStatus: 'pending',
        isVerified: false,
        submittedAt: new Date(),
        verifiedAt: null,
        rejectedReason: null,
      },
    })

    console.log(`✅ Заявка на верификацию создана: ${tenant.name} (ИНН ${v.inn})`)
  }
}

main()
  .catch((err) => {
    console.error('❌ Ошибка:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
