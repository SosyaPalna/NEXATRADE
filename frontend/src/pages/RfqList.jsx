import { useEffect, useState } from 'react'
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

export default function RfqList() {
  const [rfqs, setRfqs] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
    api.get('/categories/flat').then(res => setCategories(res.data)).catch(() => {})
  }, [])

  const loadData = async () => {
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
  }

  useEffect(() => {
    loadData()
  }, [categoryFilter])

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Запросы на закупку</h1>
          <p className="text-sm text-[#64748b]">Найдено: {filteredRfqs.length} заявок</p>
        </div>
        <Button className="bg-[#005BAC] text-white hover:bg-[#004a8d] flex items-center gap-2 shrink-0" asChild>
          <Link to="/rfq/create">
            <PlusCircle className="h-4 w-4" />
            Создать заявку
          </Link>
        </Button>
      </div>

      <Separator className="bg-[#e2e8f0]" />

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
          <Input
            className="pl-9 border-[#e2e8f0]"
            placeholder="Поиск по названию или описанию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-64">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="border-[#e2e8f0]">
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
        <Card className="border-[#e2e8f0] shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-[#cbd5e1] mb-4" />
            <h3 className="text-lg font-semibold text-[#0f172a]">Заявок пока нет</h3>
            <p className="text-sm text-[#64748b] mt-1">Создайте первый запрос на закупку</p>
            <Button className="mt-4 bg-[#005BAC] text-white hover:bg-[#004a8d]" asChild>
              <Link to="/rfq/create">Создать заявку</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[#64748b]">Загрузка заявок...</div>
          ) : (
            filteredRfqs.map(rfq => (
              <Link to={`/rfq/${rfq.id}`} key={rfq.id}>
                <Card className="border-[#e2e8f0] shadow-sm hover:shadow-md transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-[#0f172a] truncate">{rfq.title}</h3>
                          <Badge className={
                            rfq.status === 'open' ? 'bg-[#005BAC] text-white hover:bg-[#005BAC]' :
                            rfq.status === 'in_progress' ? 'bg-[#f59e0b] text-white hover:bg-[#f59e0b]' :
                            rfq.status === 'closed' ? 'bg-[#22c55e] text-white hover:bg-[#22c55e]' :
                            'bg-[#ef4444] text-white hover:bg-[#ef4444]'
                          }>
                            {rfq.status === 'open' ? 'Открыт' : rfq.status === 'in_progress' ? 'В работе' : rfq.status === 'closed' ? 'Закрыт' : 'Отменён'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#64748b] flex-wrap">
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
                        <p className="text-sm text-[#64748b] mt-2 line-clamp-2">{rfq.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-[#005BAC]">
                          {rfq.budget ? `${Number(rfq.budget).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                        </div>
                        <div className="text-xs text-[#64748b] mt-1">{rfq.quantity} {rfq.unit || 'шт.'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
