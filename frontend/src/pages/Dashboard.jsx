import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Package, FileText, Building2, TrendingUp, ArrowRight,
  PlusCircle, ShoppingCart, Users, Shield
} from 'lucide-react'
import RfqFeed from '../components/RfqFeed'
import SEO from '../components/SEO'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ products: 0, rfqs: 0 })

  useEffect(() => {
    api.get('/auth/me').then(res => {
      setUser(res.data)
      if (res.data.tenant?.id) {
        localStorage.setItem('tenantId', res.data.tenant.id)
      }
    })
    api.get('/products?all=true').then(res => {
      setStats(s => ({ ...s, products: res.data?.length || 0 }))
    }).catch(() => {})
    api.get('/rfq').then(res => {
      setStats(s => ({ ...s, rfqs: res.data?.length || 0 }))
    }).catch(() => {})
  }, [])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  const isSeller = user.tenant?.role === 'seller'

  return (
    <div className="space-y-8">
      <SEO
        title="Личный кабинет"
        description="Ваш персональный дашборд Торговый Хаб — управляйте заявками, товарами и предложениями."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Торговый Хаб',
          description: 'B2B-платформа для оптовых закупок',
          url: 'https://nexatrade.ru',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'RUB',
          },
        }}
      />
      {/* Приветствие */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Добро пожаловать, {user.tenant?.name || user.email}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isSeller
              ? 'Управляйте каталогом товаров и откликайтесь на заявки покупателей'
              : 'Размещайте заявки на закупку и находите надёжных поставщиков'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2" asChild>
            <Link to={isSeller ? '/products' : '/rfq/create'}>
              <PlusCircle className="h-4 w-4" />
              {isSeller ? 'Добавить товар' : 'Создать заявку'}
            </Link>
          </Button>
          {user.isAdmin && (
            <Button variant="outline" className="flex items-center gap-2 border-border hover:bg-muted" asChild>
              <Link to="/admin">
                <Shield className="h-4 w-4" />
                Админ-панель
              </Link>
            </Button>
          )}
          <Button variant="outline" className="flex items-center gap-2 border-border hover:bg-muted" asChild>
            <Link to={`/company/${user.tenant?.id || user.tenantId}`}>
              <Building2 className="h-4 w-4" />
              Моя компания
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm min-w-0">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">Товаров в каталоге</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{stats.products}</p>
                <p className="text-xs text-muted-foreground mt-1">Доступно для закупки</p>
              </div>
              <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm min-w-0">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">Активных заявок</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{stats.rfqs}</p>
                <p className="text-xs text-muted-foreground mt-1">На рассмотрении</p>
              </div>
              <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm min-w-0">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">Роль компании</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 truncate">
                  {isSeller ? 'Поставщик' : 'Покупатель'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
              </div>
              <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm min-w-0">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">Статус аккаунта</p>
                <div className="mt-1">
                  <Badge className={user.isActive ? 'bg-green-500 text-white hover:bg-green-500' : 'bg-amber-500 text-white hover:bg-amber-500'}>
                    {user.isActive ? 'Активен' : 'На проверке'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{user.tenant?.name}</p>
              </div>
              <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Быстрые действия */}
        <div className="w-full lg:w-72 shrink-0">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Быстрые действия
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Button variant="outline" className="w-full justify-between border-border hover:bg-muted" asChild>
                <Link to="/products">
                  <span className="flex items-center gap-2 min-w-0">
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">Перейти в каталог</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between border-border hover:bg-muted" asChild>
                <Link to="/requests">
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">Заявки</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between border-border hover:bg-muted" asChild>
                <Link to="/profile">
                  <span className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">Личный кабинет</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Активные заявки */}
        <div className="flex-1 min-w-0">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Активные запросы на закупку
              </CardTitle>
              <CardDescription>Последние заявки от покупателей</CardDescription>
            </CardHeader>
            <CardContent>
              <RfqFeed limit={3} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
