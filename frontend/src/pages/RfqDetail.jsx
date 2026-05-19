import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import Chat from '../components/Chat'
import {
  ArrowLeft, Package, Banknote, CalendarDays, Truck,
  CheckCircle2, XCircle, Building2, Send, MessageSquare, Tag
} from 'lucide-react'

export default function RfqDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq, setRfq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quoteForm, setQuoteForm] = useState({ price: '', deliveryTime: '', message: '' })
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState(null)
  const [currentTenantId, setCurrentTenantId] = useState(null)

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    try {
      const [rfqRes, meRes] = await Promise.all([
        api.get(`/rfq/${id}`),
        api.get('/auth/me')
      ])
      setRfq(rfqRes.data)
      setUserRole(meRes.data.tenant?.role)
      setCurrentTenantId(meRes.data.tenant?.id || meRes.data.tenantId)
    } catch {
      setError('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuote = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/rfq/${id}/quotes`, quoteForm)
      setQuoteForm({ price: '', deliveryTime: '', message: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки предложения')
    }
  }

  const handleQuoteAction = async (quoteId, status) => {
    try {
      await api.patch(`/rfq/quotes/${quoteId}`, { status })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка')
    }
  }

  const handleCloseRfq = async (status) => {
    try {
      await api.patch(`/rfq/${id}`, { status })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-[#64748b]">Загрузка...</div>
  if (!rfq) return <div className="flex items-center justify-center h-64 text-[#64748b]">Заявка не найдена</div>

  const isBuyer = rfq.buyerId === currentTenantId || userRole === 'buyer'
  const statusLabel = { open: 'Открыт', in_progress: 'В работе', closed: 'Закрыт', cancelled: 'Отменён' }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/requests')} className="flex items-center gap-1 text-[#64748b] hover:text-[#0f172a]">
        <ArrowLeft className="h-4 w-4" />
        Назад к заявкам
      </Button>

      <Card className="border-[#e2e8f0] shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl text-[#0f172a]">{rfq.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-[#64748b]">
                <Building2 className="h-3.5 w-3.5" />
                {rfq.buyer?.name} • {new Date(rfq.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
            <Badge className={
              rfq.status === 'open' ? 'bg-[#005BAC] text-white hover:bg-[#005BAC]' :
              rfq.status === 'in_progress' ? 'bg-[#f59e0b] text-white hover:bg-[#f59e0b]' :
              rfq.status === 'closed' ? 'bg-[#22c55e] text-white hover:bg-[#22c55e]' :
              'bg-[#ef4444] text-white hover:bg-[#ef4444]'
            }>
              {statusLabel[rfq.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#0f172a]">{rfq.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#f8fafc] rounded-lg p-3 flex items-center gap-3">
              <Package className="h-5 w-5 text-[#005BAC]" />
              <div>
                <div className="text-xs text-[#64748b]">Количество</div>
                <div className="font-semibold text-[#0f172a]">{rfq.quantity} {rfq.unit || 'шт.'}</div>
              </div>
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3 flex items-center gap-3">
              <Banknote className="h-5 w-5 text-[#005BAC]" />
              <div>
                <div className="text-xs text-[#64748b]">Бюджет</div>
                <div className="font-semibold text-[#0f172a]">
                  {rfq.budget ? `${Number(rfq.budget).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                </div>
              </div>
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-[#005BAC]" />
              <div>
                <div className="text-xs text-[#64748b]">Дедлайн</div>
                <div className="font-semibold text-[#0f172a]">
                  {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('ru-RU') : 'Не указан'}
                </div>
              </div>
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3 flex items-center gap-3">
              <Tag className="h-5 w-5 text-[#005BAC]" />
              <div>
                <div className="text-xs text-[#64748b]">Категория</div>
                <div className="font-semibold text-[#0f172a]">
                  {rfq.category?.name || 'Не указана'}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-[#fee2e2] text-[#ef4444] border border-[#fecaca] rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {isBuyer && rfq.status === 'open' && (
            <div className="flex gap-2">
              <Button variant="outline" className="border-[#e2e8f0] hover:bg-[#f1f5f9]" onClick={() => handleCloseRfq('closed')}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Закрыть заявку
              </Button>
              <Button variant="destructive" className="bg-[#ef4444] text-white hover:bg-[#dc2626]" onClick={() => handleCloseRfq('cancelled')}>
                <XCircle className="h-4 w-4 mr-1" />
                Отменить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-[#0f172a]">
            <MessageSquare className="h-5 w-5 text-[#005BAC]" />
            Предложения поставщиков ({rfq.quotes?.length || 0})
          </h2>

          {rfq.quotes?.length === 0 ? (
            <Card className="border-[#e2e8f0] shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Send className="h-10 w-10 text-[#cbd5e1] mb-3" />
                <p className="text-[#64748b]">Пока нет предложений от поставщиков</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rfq.quotes.map(quote => (
                <Card key={quote.id} className="border-[#e2e8f0] shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#0f172a]">{quote.seller?.name}</div>
                        {quote.deliveryTime && (
                          <div className="text-sm text-[#64748b] flex items-center gap-1 mt-0.5">
                            <Truck className="h-3.5 w-3.5" />
                            Срок поставки: {quote.deliveryTime}
                          </div>
                        )}
                        {quote.message && (
                          <p className="text-sm text-[#0f172a] mt-2 bg-[#f8fafc] p-2 rounded-md">{quote.message}</p>
                        )}
                        <div className="mt-2">
                          <Badge variant={quote.status === 'pending' ? 'secondary' : quote.status === 'accepted' ? 'default' : 'destructive'}>
                            {quote.status === 'pending' ? 'На рассмотрении' : quote.status === 'accepted' ? 'Принято' : 'Отклонено'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-[#005BAC]">
                          {Number(quote.price).toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                    </div>

                    {isBuyer && quote.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-[#e2e8f0]">
                        <Button size="sm" className="bg-[#22c55e] text-white hover:bg-[#16a34a]" onClick={() => handleQuoteAction(quote.id, 'accepted')}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Принять
                        </Button>
                        <Button size="sm" variant="outline" className="border-[#e2e8f0] hover:bg-[#f1f5f9]" onClick={() => handleQuoteAction(quote.id, 'rejected')}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Отклонить
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {rfq.status !== 'cancelled' && (
            <Chat rfqId={rfq.id} currentTenantId={currentTenantId} />
          )}

          {!isBuyer && rfq.status === 'open' && (
            <Card className="border-[#e2e8f0] shadow-sm">
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-[#0f172a]">Отправить предложение</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitQuote} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="q-price" className="text-xs">Цена (₽) *</Label>
                    <Input id="q-price" type="number" step="0.01" value={quoteForm.price} onChange={e => setQuoteForm({ ...quoteForm, price: e.target.value })} required className="border-[#e2e8f0]" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="q-time" className="text-xs">Срок доставки</Label>
                    <Input id="q-time" value={quoteForm.deliveryTime} onChange={e => setQuoteForm({ ...quoteForm, deliveryTime: e.target.value })} placeholder="Например: 5 дней" className="border-[#e2e8f0]" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="q-msg" className="text-xs">Комментарий</Label>
                    <Textarea id="q-msg" rows={3} value={quoteForm.message} onChange={e => setQuoteForm({ ...quoteForm, message: e.target.value })} className="border-[#e2e8f0]" />
                  </div>
                  <Button type="submit" className="w-full bg-[#005BAC] text-white hover:bg-[#004a8d]" size="sm">
                    <Send className="h-4 w-4 mr-1" />
                    Отправить
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
