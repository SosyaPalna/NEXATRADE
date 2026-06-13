import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Eye, Package, Star, FileText, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPreviewUrl } from '../lib/images'
import SEO from '../components/SEO'

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

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
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

  return (
    <div className="space-y-6">
      <SEO title="Аналитика" description="Аналитика вашего бизнеса на NexaTrade" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Аналитика</h1>
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
            <MetricCard icon={FileText} title="Ваших RFQ" value={formatNumber(data.summary.totalRfqs)} />
            <MetricCard icon={FileText} title="Откликов на RFQ" value={formatNumber(data.summary.totalQuotes)} />
            <MetricCard icon={Star} title="Средний рейтинг" value={data.summary.averageRating || '—'} subtitle={`${data.summary.reviewsCount} отзывов`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border">
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
                  <div className="space-y-2">
                    {data.viewsByDay.map(day => (
                      <div key={day.date} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-24">{new Date(day.date).toLocaleDateString('ru-RU')}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, (day.count / Math.max(...data.viewsByDay.map(d => d.count))) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{day.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <div className="space-y-3">
                    {data.topProducts.map(product => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img src={getPreviewUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Нет фото</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{Number(product.price).toLocaleString('ru-RU')} ₽ / {product.unit}</p>
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
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">Не удалось загрузить аналитику</div>
      )}
    </div>
  )
}
