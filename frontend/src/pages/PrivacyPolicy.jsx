import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <SEO
        title="Политика конфиденциальности"
        description="Политика конфиденциальности Торговый Хуб — B2B-платформы для оптовых закупок и продаж."
      />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Политика конфиденциальности</h1>
        <p className="text-sm text-muted-foreground">Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</p>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        Настоящая Политика конфиденциальности регулирует порядок сбора, хранения, обработки и защиты
        персональных данных пользователей платформы «Торговый Хаб» (далее — Платформа, Сайт),
        доступной по адресу <a href="https://nexatrade.ru" className="text-primary hover:underline">nexatrade.ru</a>.
        Используя Сайт, вы подтверждаете свое согласие с условиями настоящей Политики.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">1. Оператор персональных данных</h2>
        <p className="text-muted-foreground leading-relaxed">
          Оператором персональных данных, размещенных на Сайте, является администрация Платформы.
          По всем вопросам, связанным с обработкой персональных данных, можно обратиться по электронной почте:
          {' '}<a href="mailto:sofya_timokhina@inbox.ru" className="text-primary hover:underline">sofya_timokhina@inbox.ru</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">2. Какие данные мы обрабатываем</h2>
        <p className="text-muted-foreground leading-relaxed">
          Для предоставления функционала Платформы мы можем обрабатывать следующие категории данных:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
          <li>Идентификационные данные: адрес электронной почты, название компании, ИНН, ОГРН, КПП и иные реквизиты, указанные в профиле.</li>
          <li>Контактные данные: номер телефона, адрес, ссылки на сайт и социальные сети.</li>
          <li>Содержательные данные: информация о товарах, заявках на закупку, коммерческих предложениях, сообщениях и переписках.</li>
          <li>Технические данные: IP-адрес, файлы cookie, данные об используемом браузере и устройстве (User-Agent), сведения о посещенных страницах.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">3. Цели обработки персональных данных</h2>
        <p className="text-muted-foreground leading-relaxed">
          Персональные данные обрабатываются исключительно в следующих целях:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
          <li>Регистрация и аутентификация пользователей, предоставление доступа к личному кабинету.</li>
          <li>Обеспечение взаимодействия между покупателями и поставщиками в рамках B2B-торговли.</li>
          <li>Проведение верификации компаний и повышение доверия участников.</li>
          <li>Техническая поддержка пользователей, уведомления о статусах заявок, сообщениях и действиях на Платформе.</li>
          <li>Обеспечение безопасности Сайта, предотвращение мошенничества и злоупотреблений.</li>
          <li>Анализ посещаемости и улучшение работы Платформы с применением обезличенных данных.</li>
          <li>Выполнение обязательств, предусмотренных действующим законодательством Российской Федерации.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">4. Правовые основания обработки</h2>
        <p className="text-muted-foreground leading-relaxed">
          Обработка персональных данных осуществляется на основании:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
          <li>Согласия субъекта персональных данных, выраженного при регистрации и принятии настоящей Политики.</li>
          <li>Необходимости заключения и исполнения пользовательского соглашения (договора об оказании услуг).</li>
          <li>Законных интересов Оператора, в том числе обеспечения безопасности и корректной работы Платформы.</li>
          <li>Требований законодательства Российской Федерации.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">5. Порядок и сроки обработки</h2>
        <p className="text-muted-foreground leading-relaxed">
          Обработка персональных данных осуществляется с момента регистрации пользователя на Сайте
          и в течение всего срока использования Платформы. После удаления учетной записи персональные
          данные подлежат удалению или обезличиванию, за исключением случаев, когда законодательство
          требует их дальнейшего хранения. Технические логи и файлы cookie могут храниться ограниченное
          время, необходимое для обеспечения безопасности и аналитики.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">6. Передача данных третьим лицам</h2>
        <p className="text-muted-foreground leading-relaxed">
          Оператор не передает персональные данные пользователей третьим лицам без согласия субъекта,
          за исключением случаев, предусмотренных законодательством, а также когда передача необходима
          для технического обеспечения работы Платформы (например, хостинг-провайдеру). Все привлеченные
          подрядчики обязуются соблюдать конфиденциальность и обеспечивать защиту персональных данных.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">7. Меры защиты информации</h2>
        <p className="text-muted-foreground leading-relaxed">
          Для защиты персональных данных применяются следующие организационные и технические меры:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
          <li>Использование защищенного протокола HTTPS для передачи данных.</li>
          <li>Хеширование паролей с применением современных криптографических алгоритмов.</li>
          <li>Ограничение доступа к персональным данным только уполномоченным лицам.</li>
          <li>Регулярное резервное копирование данных и обновление программного обеспечения.</li>
          <li>Мониторинг попыток несанкционированного доступа и защита от DDoS-атак.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">8. Использование файлов cookie и аналитики</h2>
        <p className="text-muted-foreground leading-relaxed">
          Сайт использует файлы cookie для обеспечения корректной работы, сохранения пользовательских
          настроек и сбора обезличенной статистики посещаемости. При необходимости могут применяться
          сторонние сервисы веб-аналитики. Пользователь может ограничить или отключить использование
          cookie в настройках своего браузера, однако это может повлиять на функциональность Сайта.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">9. Права пользователя</h2>
        <p className="text-muted-foreground leading-relaxed">
          В соответствии с законодательством о персональных данных пользователь имеет право:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
          <li>Получать информацию о том, какие персональные данные обрабатываются.</li>
          <li>Требовать уточнения, исправления или удаления своих персональных данных.</li>
          <li>Отозвать согласие на обработку данных путем удаления учетной записи.</li>
          <li>Обжаловать действия Оператора в уполномоченном органе по защите прав субъектов персональных данных.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">10. Изменения в Политике</h2>
        <p className="text-muted-foreground leading-relaxed">
          Оператор оставляет за собой право вносить изменения в настоящую Политику. Актуальная версия
          всегда размещается на странице <Link to="/privacy" className="text-primary hover:underline">/privacy</Link>.
          Продолжение использования Платформы после внесения изменений означает принятие обновленной Политики.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">11. Контактная информация</h2>
        <p className="text-muted-foreground leading-relaxed">
          По вопросам обработки персональных данных, реализации своих прав или удаления учетной записи
          обращайтесь по адресу электронной почты:{' '}
          <a href="mailto:sofya_timokhina@inbox.ru" className="text-primary hover:underline">sofya_timokhina@inbox.ru</a>.
        </p>
      </section>
    </div>
  )
}
