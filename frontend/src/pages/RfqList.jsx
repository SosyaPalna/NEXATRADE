import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, PlusCircle, MessageSquare, CalendarDays, Tag, Search, X } from 'lucide-react'
import SEO from '../components/SEO'

export default function RfqList() {
  const [rfqs, setRfqs] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (categoryFilter) params.categoryId = categoryFilter
      const res = await api.get('/rfq', { params })
      setRfqs(res.data)
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter])

  useEffect(() => {
    loadData()
    api.get('/categories/flat').then(res => setCategories(res.data)).catch(() => {})
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredRfqs = rfqs.filter(rfq => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return (
      rfq.title?.toLowerCase().includes(s) ||
      rfq.description?.toLowerCase().includes(s) ||
      rfq.buyer?.name?.toLowerCase().includes(s)
    )
  })

  return (
    <div className="space-y-6">
      <SEO
        title="Заявки на закупку"
        description="Актуальные заявки на закупку от покупателей. Найдите выгодные контракты и откликнитесь на RFQ."
        keywords="заявки на закупку, RFQ, закупки оптом, тендеры, B2B заявки, поиск поставщиков"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Заявки на закупку — Торговый Хаб',
          description: 'Актуальные заявки на закупку от покупателей. Найдите выгодные контракты и откликнитесь на RFQ.',
          url: typeof window !== 'undefined' ? window.location.href : 'https://nexatrade.ru/requests',
          isPartOf: { '@type': 'WebSite', name: 'Торговый Хаб', url: 'https://nexatrade.ru' },
        }}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Запросы на закупку</h1>
          <p className="text-sm text-muted-foreground">Найдено: {filteredRfqs.length} заявок</p>
        </div>
        <Button className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2 shrink-0" asChild>
          <Link to="/rfq/create">
            <PlusCircle className="h-4 w-4" />
            Создать заявку
          </Link>
        </Button>
      </div>

      <Separator className="bg-border" />

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 border-border"
            placeholder="Поиск по названию или описанию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-64">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="border-border">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все категории</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredRfqs.length === 0 && !loading ? (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Заявок пока нет</h2>
            <p className="text-sm text-muted-foreground mt-1">Создайте первый запрос на закупку</p>
            <Button className="mt-4 bg-primary text-white hover:bg-primary/90" asChild>
              <Link to="/rfq/create">Создать заявку</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">Загрузка заявок...</div>
          ) : (
            filteredRfqs.map(rfq => (
              <article key={rfq.id}>
                <Link to={`/rfq/${rfq.id}`}>
                  <Card className="border-border shadow-sm hover:shadow-md transition-colors cursor-pointer">
                    <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{rfq.title}</h3>
                          <Badge className={
                            rfq.status === 'open' ? 'bg-primary text-white hover:bg-primary' :
                            rfq.status === 'in_progress' ? 'bg-amber-500 text-white hover:bg-amber-500' :
                            rfq.status === 'closed' ? 'bg-green-500 text-white hover:bg-green-500' :
                            'bg-destructive text-white hover:bg-destructive'
                          }>
                            {rfq.status === 'open' ? 'Открыт' : rfq.status === 'in_progress' ? 'В работе' : rfq.status === 'closed' ? 'Закрыт' : 'Отменён'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(rfq.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                          <span>•</span>
                          <span>{rfq.buyer?.name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {rfq._count?.quotes || 0} предложений
                          </span>
                          {rfq.category?.name && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {rfq.category.name}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{rfq.description}</p>
                      </div>
                      <div className="text-right shrink-0 max-w-[45%] sm:max-w-none">
                        <div className="text-base sm:text-lg font-bold text-primary wrap-break-word">
                          {rfq.budget ? `${Number(rfq.budget).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{rfq.quantity} {rfq.unit || 'шт.'}</div>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                </Link>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  )
}
