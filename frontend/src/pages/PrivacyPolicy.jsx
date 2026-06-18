import SEO from '../components/SEO'

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <SEO
        title="Политика конфиденциальности"
        description="Политика конфиденциальности Торговый Хаб — B2B-платформы для оптовых закупок и продаж."
      />

      <h1 className="text-3xl font-bold text-foreground">Политика конфиденциальности</h1>

      <p className="text-muted-foreground">
        Настоящая Политика конфиденциальности описывает, какие персональные данные собираются,
        обрабатываются и хранятся при использовании платформы Торговый Хаб.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">1. Общие положения</h2>
        <p className="text-muted-foreground">
          Используя Торговый Хаб, вы предоставляете согласие на обработку ваших персональных данных
          в соответствии с настоящей Политикой. Администрация обязуется защищать конфиденциальность
          пользователей и не передавать данные третьим лицам без согласия, за исключением случаев,
          предусмотренных законодательством.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">2. Собираемые данные</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Адрес электронной почты и контактные данные компании.</li>
          <li>Название компании, ИНН, ОГРН и другие реквизиты, указанные в профиле.</li>
          <li>Информация о товарах, заявках, сообщениях и действиях внутри платформы.</li>
          <li>Технические данные: IP-адрес, cookie, User-Agent.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">3. Цели обработки данных</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Предоставление доступа к функциям платформы.</li>
          <li>Обеспечение коммуникации между покупателями и поставщиками.</li>
          <li>Улучшение качества сервиса и технической поддержки.</li>
          <li>Выполнение требований законодательства.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">4. Хранение и защита данных</h2>
        <p className="text-muted-foreground">
          Персональные данные хранятся на защищённых серверах. Доступ к данным имеют только
          уполномоченные лица. Мы применяем современные меры защиты: шифрование паролей,
          защищённые соединения (HTTPS), регулярное резервное копирование.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">5. Права пользователя</h2>
        <p className="text-muted-foreground">
          Пользователь вправе запросить информацию о своих данных, потребовать их исправления
          или удаления. Для этого необходимо обратиться в службу поддержки через форму обратной
          связи или раздел «Сообщения».
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">6. Изменения политики</h2>
        <p className="text-muted-foreground">
          Администрация оставляет за собой право вносить изменения в настоящую Политику.
          Актуальная версия всегда доступна по адресу /privacy.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        По всем вопросам, связанным с обработкой персональных данных, можно связаться с
        администрацией платформы через раздел «Сообщения» или по контактам, указанным в футере.
      </p>
    </div>
  )
}
