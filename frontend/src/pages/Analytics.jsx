import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Eye,
  Package,
  Star,
  FileText,
  TrendingUp,
  Mail,
  Send,
  Inbox,
  Activity,
  Bell,
  MessageSquare,
  Quote,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPreviewUrl } from '../lib/images'
import SEO from '../components/SEO'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

function MetricCard({ icon: Icon, title, value, subtitle }) {
  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const activityIcons = {
  message: MessageSquare,
  rfq: FileText,
  quote: Quote,
  system: Bell,
  review: Star,
  default: Activity,
}

function activityIcon(type) {
  return activityIcons[type] || activityIcons.default
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/analytics/dashboard')
      setData(res.data)
    } catch (err) {
      console.error('Ошибка загрузки аналитики:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatNumber = (n) => n?.toLocaleString('ru-RU') || '0'

  const roleLabel = data?.role === 'seller' ? 'Продавец' : 'Покупатель'

  return (
    <div className="space-y-6">
      <SEO title="Аналитика" description="Аналитика вашего бизнеса на Торговый Хаб" />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Аналитика</h1>
            {data && <Badge variant="secondary">{roleLabel}</Badge>}
          </div>
          <p className="text-muted-foreground">Статистика ваших товаров и активности</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          Обновить
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={Eye} title="Всего просмотров" value={formatNumber(data.summary.totalViews)} />
            <MetricCard icon={TrendingUp} title="Просмотров сегодня" value={formatNumber(data.summary.todayViews)} />
            <MetricCard icon={Package} title="Товаров в каталоге" value={formatNumber(data.summary.totalProducts)} />
            <MetricCard icon={Mail} title="Непрочитанных сообщений" value={formatNumber(data.summary.unreadMessages)} />
            {data.role === 'seller' ? (
              <>
                <MetricCard icon={Send} title="Отправлено откликов" value={formatNumber(data.summary.quotesSubmitted)} />
                <MetricCard icon={Star} title="Средний рейтинг" value={data.summary.averageRating || '—'} subtitle={`${data.summary.reviewsCount} отзывов`} />
              </>
            ) : (
              <>
                <MetricCard icon={FileText} title="Ваших RFQ" value={formatNumber(data.summary.totalRfqs)} />
                <MetricCard icon={Inbox} title="Открытых RFQ" value={formatNumber(data.summary.openRfqs)} />
              </>
            )}
            {data.role !== 'seller' && (
              <MetricCard icon={FileText} title="Откликов на RFQ" value={formatNumber(data.summary.totalQuotes)} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Просмотры за 30 дней
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.viewsByDay.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Нет данных за последние 30 дней</p>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.viewsByDay} margin={{ top: 5, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) =>
                            new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                          }
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')}
                          formatter={(value) => [value, 'Просмотров']}
                          contentStyle={{ borderRadius: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Недавняя активность
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Нет недавней активности</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {data.recentActivity.map((item) => {
                      const Icon = activityIcon(item.type)
                      const Wrapper = item.link ? Link : 'div'
                      return (
                        <Wrapper
                          key={item.id}
                          to={item.link}
                          className={`flex gap-3 p-2 rounded-lg hover:bg-muted transition-colors ${item.link ? 'cursor-pointer' : ''}`}
                        >
                          <div className="mt-0.5">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${item.isRead ? 'text-muted-foreground' : 'font-medium'}`}>
                              {item.title || item.message || 'Событие'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {!item.isRead && <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />}
                        </Wrapper>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Топ товаров по просмотрам
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Нет товаров</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.topProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={getPreviewUrl(product.images[0])}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            Нет фото
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(product.price).toLocaleString('ru-RU')} ₽ / {product.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{product.viewCount}</p>
                        <p className="text-xs text-muted-foreground">просмотров</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">Не удалось загрузить аналитику</div>
      )}
    </div>
  )
}
