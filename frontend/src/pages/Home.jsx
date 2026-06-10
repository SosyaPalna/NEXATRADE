import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight, ShieldCheck, Zap, Search, FileText,
  Users, TrendingUp, Truck, Building2, CheckCircle2,
  Package, MessageSquare
} from 'lucide-react'
import SEO from '../components/SEO'

export default function Home() {
  return (
    <div className="space-y-20 pb-12">
      <SEO
        title="B2B-платформа для оптовых закупок и продаж"
        description="Находите надёжных поставщиков и покупателей без посредников. Размещайте заявки на закупку, получайте предложения и заключайте прямые контракты."
        keywords="B2B маркетплейс, оптовые закупки, поставщики, заявки на закупку, RFQ, торговая площадка, B2B платформа, оптовые продажи, закупки для бизнеса"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              name: 'NexaTrade',
              url: 'https://nexatrade.ru',
              description: 'Современная B2B-платформа для оптовых закупок и продаж',
              inLanguage: 'ru-RU',
            },
            {
              '@type': 'Organization',
              name: 'NexaTrade',
              url: 'https://nexatrade.ru',
              logo: 'https://nexatrade.ru/favicon.svg',
              description: 'B2B маркетплейс для оптовых закупок и прямых контрактов между компаниями',
            },
          ],
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/10 via-primary/5 to-background border border-border">
        <div className="px-6 py-16 sm:px-12 sm:py-24 lg:px-16 text-center space-y-8">
          <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm border-primary/30 text-primary">
            B2B-маркетплейс нового поколения
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto">
            Оптовые закупки и продажи <span className="text-primary">без посредников</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Размещайте заявки на закупку, получайте выгодные предложения от проверенных поставщиков и заключайте прямые контракты — всё в одной экосистеме.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90 gap-2" asChild>
              <Link to="/register">
                Начать торговлю <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border hover:bg-muted gap-2" asChild>
              <Link to="/register">
                <FileText className="h-4 w-4" />
                Разместить заявку
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Бесплатная регистрация</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Верификация компаний</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Прямые контракты</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { value: '10 000+', label: 'Компаний на платформе', icon: Building2 },
          { value: '50 000+', label: 'Активных заявок', icon: FileText },
          { value: '24 часа', label: 'Средний срок отклика', icon: Zap },
        ].map((stat) => (
          <Card key={stat.label} className="border-border shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Преимущества */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Почему NexaTrade?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Платформа создана специально для B2B-рынка: мы убрали лишнее и оставили только инструменты, которые нужны для крупных сделок.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Search, title: 'Умный поиск', desc: 'Находите поставщиков и товары по категориям, регионам и условиям поставки.' },
            { icon: FileText, title: 'Система RFQ', desc: 'Разместите заявку на закупку и получите конкурентные предложения от поставщиков.' },
            { icon: ShieldCheck, title: 'Верификация', desc: 'Все компании проходят проверку — вы работаете только с реальным бизнесом.' },
            { icon: MessageSquare, title: 'Прямой контакт', desc: 'Общайтесь с контрагентами напрямую, без скрытых комиссий платформы.' },
            { icon: TrendingUp, title: 'Рост продаж', desc: 'Поставщики получают доступ к постоянному потоку целевых заявок от покупателей.' },
            { icon: Truck, title: 'Логистика', desc: 'Указывайте условия доставки, сроки и адреса — всё прозрачно с самого начала.' },
          ].map((f) => (
            <Card key={f.title} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="p-2.5 rounded-lg bg-primary/10 w-fit">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Как это работает */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Как это работает?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Простой процесс от заявки до сделки — всего три шага.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Создайте заявку', desc: 'Укажите, что вам нужно, количество, бюджет и сроки. Это бесплатно и занимает 2 минуты.', cta: 'Создать заявку', link: '/register' },
            { step: '02', title: 'Получите предложения', desc: 'Проверенные поставщики из вашей отрасли отправят свои цены и условия поставки.', cta: 'Смотреть каталог', link: '/register' },
            { step: '03', title: 'Заключите сделку', desc: 'Выберите лучшее предложение, свяжитесь напрямую и оформите контракт.', cta: 'Зарегистрироваться', link: '/register' },
          ].map((item) => (
            <div key={item.step} className="relative space-y-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              <Button variant="link" className="text-primary gap-1" asChild>
                <Link to={item.link}>{item.cta} <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <Separator className="bg-border" />

      {/* Роли */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border shadow-sm">
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">Для поставщиков</h3>
            </div>
            <p className="text-muted-foreground">
              Размещайте товары в каталоге, откликайтесь на заявки покупателей и наращивайте оптовые продажи без затрат на маркетинг.
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Доступ к тысячам заявок</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Прямые переговоры с заказчиком</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Нет комиссии за отклики</li>
            </ul>
            <Button className="bg-primary text-white hover:bg-primary/90 gap-2" asChild>
              <Link to="/register">Стать поставщиком <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">Для покупателей</h3>
            </div>
            <p className="text-muted-foreground">
              Размещайте заявки на закупку, сравнивайте предложения и выбирайте лучших поставщиков по цене и условиям.
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Экономия до 30% на закупках</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Проверенные поставщики</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Конкурентные цены по RFQ</li>
            </ul>
            <Button className="bg-primary text-white hover:bg-primary/90 gap-2" asChild>
              <Link to="/register">Найти поставщиков <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold">Начните торговать сегодня</h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto text-lg">
          Присоединяйтесь к тысячам компаний, которые уже используют NexaTrade для роста своего бизнеса.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" variant="secondary" className="gap-2" asChild>
            <Link to="/register">
              Бесплатная регистрация <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2" asChild>
            <Link to="/register">
              <FileText className="h-4 w-4" />
              Разместить заявку
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
