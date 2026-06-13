import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Flag, MessageCircle, Send, Archive, Play, Eye } from 'lucide-react'
import SEO from '../components/SEO'
import ImageLightbox from '../components/ImageLightbox'

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1 })
  const [error, setError] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const loadMessages = useCallback(async () => {
    if (!selectedReport) return
    try {
      const res = await api.get(`/reports/${selectedReport.id}/messages`)
      setMessages(res.data || [])
    } catch {
      // silent
    }
  }, [selectedReport])

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports', {
        params: { status: statusFilter, type: typeFilter, page, limit: 20 }
      })
      setReports(res.data.reports)
      setPagination({ pages: res.data.pages })
    } catch {
      setError('Ошибка загрузки жалоб')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, typeFilter])

  useEffect(() => { loadReports() }, [loadReports])

  useEffect(() => {
    if (!selectedReport) return
    loadMessages()
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [selectedReport, loadMessages])

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/reports/${id}`, { status })
      loadReports()
      if (selectedReport?.id === id) {
        setSelectedReport(prev => ({ ...prev, status }))
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка')
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedReport) return
    setSending(true)
    try {
      await api.post(`/reports/${selectedReport.id}/messages`, { content: newMessage.trim() })
      setNewMessage('')
      loadMessages()
    } catch {
      // silent
    }
    finally { setSending(false) }
  }

  const statusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="border-amber-500 text-amber-500">В ожидании</Badge>
      case 'in_progress': return <Badge className="bg-primary text-white hover:bg-primary">В работе</Badge>
      case 'resolved': return <Badge className="bg-green-500 text-white hover:bg-green-500">Решена</Badge>
      case 'dismissed': return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Отклонена</Badge>
      case 'closed': return <Badge variant="outline" className="border-border text-muted-foreground">Закрыта</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const typeLabel = (type) => {
    switch (type) {
      case 'message': return 'Сообщение'
      case 'user': return 'Компания'
      case 'product': return 'Товар'
      case 'rfq': return 'Заявка'
      case 'company': return 'Компания'
      default: return type
    }
  }

  const isClosed = (status) => ['resolved', 'dismissed', 'closed'].includes(status)

  return (
    <div className="space-y-6">
      <SEO title="Жалобы" description="Управление жалобами пользователей в админ-панели NexaTrade." noindex nofollow />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Жалобы</h1>
        <span className="text-sm text-muted-foreground">Всего: {reports.length}</span>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px] border-border">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">В ожидании</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="resolved">Решены</SelectItem>
            <SelectItem value="dismissed">Отклонены</SelectItem>
            <SelectItem value="closed">Закрыты</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px] border-border">
            <SelectValue placeholder="Все типы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            <SelectItem value="message">Сообщение</SelectItem>
            <SelectItem value="user">Пользователь</SelectItem>
            <SelectItem value="product">Товар</SelectItem>
            <SelectItem value="rfq">Заявка</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Тип</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Цель</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Причина</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Описание</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Статус</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Дата</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-[180px]">Действия</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-border text-foreground">
                        {typeLabel(report.type)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {report.targetName ? (
                        report.targetLink ? (
                          <a
                            href={report.targetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline line-clamp-1"
                            title={report.targetName}
                          >
                            {report.targetName}
                          </a>
                        ) : (
                          <span className="text-sm text-foreground line-clamp-1">{report.targetName}</span>
                        )
                      ) : (
                        <span className="text-foreground font-mono text-xs">{report.targetId.slice(0, 8)}...</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">{report.reason}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{report.description || '—'}</td>
                    <td className="px-4 py-3">{statusBadge(report.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary/80"
                          onClick={() => setSelectedReport(report)}
                          title="Открыть чат"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {report.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary/80"
                            onClick={() => handleUpdateStatus(report.id, 'in_progress')}
                            title="Взять в работу"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {report.status === 'in_progress' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-500 hover:text-green-600"
                              onClick={() => handleUpdateStatus(report.id, 'resolved')}
                              title="Решить"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive/80"
                              onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                              title="Отклонить"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {!isClosed(report.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleUpdateStatus(report.id, 'closed')}
                            title="Закрыть"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <Flag className="h-8 w-8 mx-auto mb-2 text-border" />
                      Жалоб не найдено
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Загрузка...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="border-border" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Стр. {page} из {pagination.pages}</span>
          <Button variant="outline" size="sm" className="border-border" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Детальное окно жалобы с чатом */}
      <Dialog open={!!selectedReport} onOpenChange={() => { setSelectedReport(null); setMessages([]) }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              Жалоба #{selectedReport?.id.slice(0, 8)}
            </DialogTitle>
            <DialogDescription>
              {selectedReport && (() => {
                const s = selectedReport.status
                const labels = {
                  pending: 'В ожидании',
                  in_progress: 'В работе',
                  resolved: 'Решена',
                  dismissed: 'Отклонена',
                  closed: 'Закрыта'
                }
                return <span>Тип: {typeLabel(selectedReport.type)} • Статус: {labels[s] || s}</span>
              })()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Reporter ID:</span> {selectedReport?.reporterId}</p>
            <p><span className="text-muted-foreground">Target ID:</span> {selectedReport?.targetId}</p>
            {selectedReport?.targetName && (
              <p>
                <span className="text-muted-foreground">Объект:</span>{' '}
                {selectedReport.targetLink ? (
                  <a href={selectedReport.targetLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {selectedReport.targetName}
                  </a>
                ) : (
                  selectedReport.targetName
                )}
              </p>
            )}
            <p><span className="text-muted-foreground">Причина:</span> {selectedReport?.reason}</p>
            {selectedReport?.description && <p><span className="text-muted-foreground">Описание:</span> {selectedReport.description}</p>}
            {selectedReport?.screenshots?.length > 0 && (
              <div className="pt-1">
                <p className="text-muted-foreground mb-2">Скриншоты:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.screenshots.map((src, idx) => (
                    <ImageLightbox key={idx} images={selectedReport.screenshots}>
                      <img
                        src={src}
                        alt={`Скриншот ${idx + 1}`}
                        className="h-20 w-20 object-cover rounded-md border border-border hover:border-primary transition-colors"
                      />
                    </ImageLightbox>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          <div className="flex-1 min-h-0">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <MessageCircle className="h-4 w-4 text-primary" />
              Переписка с пользователем
            </h4>
            <ScrollArea className="h-52 border rounded-lg p-3">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Пока нет сообщений</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.senderType === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}>
                        <div>{msg.content}</div>
                        <div className={`text-xs mt-1 opacity-70 ${msg.senderType === 'admin' ? 'text-right' : ''}`}>
                          {msg.sender?.name || 'Пользователь'} • {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {!isClosed(selectedReport?.status) && (
            <form onSubmit={sendMessage} className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Напишите ответ пользователю..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
          {isClosed(selectedReport?.status) && (
            <div className="text-center text-xs text-muted-foreground py-2 bg-muted rounded-lg">
              Жалоба закрыта, отправка сообщений недоступна
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
