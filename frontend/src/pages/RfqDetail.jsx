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
import SEO from '../components/SEO'

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

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>
  if (!rfq) return <div className="flex items-center justify-center h-64 text-muted-foreground">Заявка не найдена</div>

  const isBuyer = rfq.buyerId === currentTenantId || userRole === 'buyer'
  const statusLabel = { open: 'Открыт', in_progress: 'В работе', closed: 'Закрыт', cancelled: 'Отменён' }

  return (
    <div className="space-y-6">
      <SEO
        title={rfq.title}
        description={rfq.description || `Заявка на закупку: ${rfq.title}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Demand',
          name: rfq.title,
          description: rfq.description,
          url: `https://nexatrade.ru/rfq/${rfq.id}`,
          seller: rfq.buyer?.name ? {
            '@type': 'Organization',
            name: rfq.buyer.name,
          } : undefined,
          priceSpecification: rfq.budget ? {
            '@type': 'PriceSpecification',
            price: rfq.budget,
            priceCurrency: 'RUB',
          } : undefined,
        }}
      />
      <Button variant="ghost" size="sm" onClick={() => navigate('/requests')} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Назад к заявкам
      </Button>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-foreground">{rfq.title}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                {rfq.buyer?.name} • {new Date(rfq.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
            <Badge className={
              rfq.status === 'open' ? 'bg-primary text-white hover:bg-primary' :
              rfq.status === 'in_progress' ? 'bg-amber-500 text-white hover:bg-amber-500' :
              rfq.status === 'closed' ? 'bg-green-500 text-white hover:bg-green-500' :
              'bg-destructive text-white hover:bg-destructive'
            }>
              {statusLabel[rfq.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground">{rfq.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Количество</div>
                <div className="font-semibold text-foreground">{rfq.quantity} {rfq.unit || 'шт.'}</div>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
              <Banknote className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Бюджет</div>
                <div className="font-semibold text-foreground">
                  {rfq.budget ? `${Number(rfq.budget).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                </div>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Дедлайн</div>
                <div className="font-semibold text-foreground">
                  {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('ru-RU') : 'Не указан'}
                </div>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
              <Tag className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Категория</div>
                <div className="font-semibold text-foreground">
                  {rfq.category?.name || 'Не указана'}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {isBuyer && rfq.status === 'open' && (
            <div className="flex gap-2">
              <Button variant="outline" className="border-border hover:bg-muted" onClick={() => handleCloseRfq('closed')}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Закрыть заявку
              </Button>
              <Button variant="destructive" className="bg-destructive text-white hover:bg-destructive/90" onClick={() => handleCloseRfq('cancelled')}>
                <XCircle className="h-4 w-4 mr-1" />
                Отменить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <MessageSquare className="h-5 w-5 text-primary" />
            Предложения поставщиков ({rfq.quotes?.length || 0})
          </h2>

          {rfq.quotes?.length === 0 ? (
            <Card className="border-border shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Send className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Пока нет предложений от поставщиков</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rfq.quotes.map(quote => (
                <Card key={quote.id} className="border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground">{quote.seller?.name}</div>
                        {quote.deliveryTime && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Truck className="h-3.5 w-3.5" />
                            Срок поставки: {quote.deliveryTime}
                          </div>
                        )}
                        {quote.message && (
                          <p className="text-sm text-foreground mt-2 bg-muted p-2 rounded-md">{quote.message}</p>
                        )}
                        <div className="mt-2">
                          <Badge variant={quote.status === 'pending' ? 'secondary' : quote.status === 'accepted' ? 'default' : 'destructive'}>
                            {quote.status === 'pending' ? 'На рассмотрении' : quote.status === 'accepted' ? 'Принято' : 'Отклонено'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-primary">
                          {Number(quote.price).toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                    </div>

                    {isBuyer && quote.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        <Button size="sm" className="bg-green-500 text-white hover:bg-green-600" onClick={() => handleQuoteAction(quote.id, 'accepted')}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Принять
                        </Button>
                        <Button size="sm" variant="outline" className="border-border hover:bg-muted" onClick={() => handleQuoteAction(quote.id, 'rejected')}>
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
            <Card className="border-border shadow-sm">
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-foreground">Отправить предложение</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitQuote} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="q-price" className="text-xs">Цена (₽) *</Label>
                    <Input id="q-price" type="number" step="0.01" value={quoteForm.price} onChange={e => setQuoteForm({ ...quoteForm, price: e.target.value })} required className="border-border" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="q-time" className="text-xs">Срок доставки</Label>
                    <Input id="q-time" value={quoteForm.deliveryTime} onChange={e => setQuoteForm({ ...quoteForm, deliveryTime: e.target.value })} placeholder="Например: 5 дней" className="border-border" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="q-msg" className="text-xs">Комментарий</Label>
                    <Textarea id="q-msg" rows={3} value={quoteForm.message} onChange={e => setQuoteForm({ ...quoteForm, message: e.target.value })} className="border-border" />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90" size="sm">
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
