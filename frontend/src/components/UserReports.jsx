import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Flag, MessageCircle, Send, Archive, AlertCircle, CheckCircle2, Clock, XCircle, Inbox } from 'lucide-react'
import ImageLightbox from './ImageLightbox'

export default function UserReports() {
  const [activeReports, setActiveReports] = useState([])
  const [archivedReports, setArchivedReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ type: 'user', targetId: '', reason: '', description: '' })
  const [createError, setCreateError] = useState('')
  const [sending, setSending] = useState(false)

  const loadReports = useCallback(async () => {
    try {
      const [activeRes, archiveRes] = await Promise.all([
        api.get('/reports/my', { params: { status: 'all' } }),
        api.get('/reports/my', { params: { status: 'all' } }) // загрузим все и разделим
      ])
      const all = activeRes.data.reports || []
      setActiveReports(all.filter(r => ['pending', 'in_progress'].includes(r.status)))
      setArchivedReports(all.filter(r => ['resolved', 'dismissed', 'closed'].includes(r.status)))
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadReports() }, [loadReports])

  useEffect(() => {
    if (!selectedReport) return
    loadMessages()
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [selectedReport])

  const loadMessages = async () => {
    if (!selectedReport) return
    try {
      const res = await api.get(`/reports/${selectedReport.id}/messages`)
      setMessages(res.data || [])
    } catch {}
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedReport) return
    setSending(true)
    try {
      await api.post(`/reports/${selectedReport.id}/messages`, { content: newMessage.trim() })
      setNewMessage('')
      loadMessages()
    } catch {}
    finally { setSending(false) }
  }

  const createReport = async (e) => {
    e.preventDefault()
    setCreateError('')
    if (!createForm.type || !createForm.targetId || !createForm.reason) {
      setCreateError('Заполните обязательные поля')
      return
    }
    try {
      await api.post('/reports', createForm)
      setShowCreate(false)
      setCreateForm({ type: 'user', targetId: '', reason: '', description: '' })
      loadReports()
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Ошибка создания')
    }
  }

  const statusMap = {
    pending: { label: 'В ожидании', icon: Clock, color: 'bg-amber-500' },
    in_progress: { label: 'В работе', icon: AlertCircle, color: 'bg-primary' },
    resolved: { label: 'Решена', icon: CheckCircle2, color: 'bg-green-500' },
    dismissed: { label: 'Отклонена', icon: XCircle, color: 'bg-destructive' },
    closed: { label: 'Закрыта', icon: Archive, color: 'bg-muted-foreground' }
  }

  const isArchived = (r) => r && ['resolved', 'dismissed', 'closed'].includes(r.status)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Мои обращения</h2>
        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 gap-1" onClick={() => setShowCreate(true)}>
          <Flag className="h-4 w-4" />
          Создать обращение
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="bg-muted">
          <TabsTrigger value="active" className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Активные ({activeReports.length})
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center gap-1">
            <Archive className="h-4 w-4" />
            Архив ({archivedReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-3">
          {activeReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Нет активных обращений</p>
            </div>
          ) : (
            activeReports.map(report => {
              const s = statusMap[report.status] || statusMap.pending
              return (
                <Card key={report.id} className="border-border shadow-sm hover:bg-muted transition-colors cursor-pointer" onClick={() => setSelectedReport(report)}>
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${s.color} text-white hover:${s.color}`}>
                          <s.icon className="h-3 w-3 mr-1" />
                          {s.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">#{report.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm text-foreground font-medium">{report.reason}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{report.description || 'Нет описания'}</p>
                    </div>
                    <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="archive" className="space-y-3 mt-3">
          {archivedReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Архив пуст</p>
            </div>
          ) : (
            archivedReports.map(report => {
              const s = statusMap[report.status] || statusMap.pending
              return (
                <Card key={report.id} className="border-border shadow-sm hover:bg-muted transition-colors cursor-pointer" onClick={() => setSelectedReport(report)}>
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-muted-foreground">
                          <s.icon className="h-3 w-3 mr-1" />
                          {s.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">#{report.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm text-foreground font-medium">{report.reason}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{report.description || 'Нет описания'}</p>
                    </div>
                    <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Детальное окно жалобы с чатом */}
      <Dialog open={!!selectedReport} onOpenChange={() => { setSelectedReport(null); setMessages([]) }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              Обращение #{selectedReport?.id.slice(0, 8)}
            </DialogTitle>
            <DialogDescription>
              {selectedReport && (() => {
                const s = statusMap[selectedReport.status] || statusMap.pending
                return (
                  <span className="flex items-center gap-1">
                    <s.icon className={`h-3 w-3 ${s.color.replace('bg-', 'text-')}`} />
                    {s.label}
                  </span>
                )
              })()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            {selectedReport?.targetName && (
              <p><span className="text-muted-foreground">На что жаловались:</span> {selectedReport.targetName}</p>
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
                        className="h-16 w-16 object-cover rounded-md border border-border hover:border-primary transition-colors"
                      />
                    </ImageLightbox>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          <div className="flex-1 min-h-0">
            <h4 className="text-sm font-medium mb-2">Переписка</h4>
            <ScrollArea className="h-48 border rounded-lg p-3">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Пока нет сообщений</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.senderType === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}>
                        <div>{msg.content}</div>
                        <div className={`text-xs mt-1 opacity-70 ${msg.senderType === 'user' ? 'text-right' : ''}`}>
                          {msg.sender?.name || 'Администратор'} • {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {selectedReport && !isArchived(selectedReport) && (
            <form onSubmit={sendMessage} className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Напишите сообщение..."
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
          {selectedReport && isArchived(selectedReport) && (
            <div className="text-center text-xs text-muted-foreground py-2 bg-muted rounded-lg">
              Обращение закрыто, отправка сообщений недоступна
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Создание жалобы */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новое обращение</DialogTitle>
            <DialogDescription>Опишите проблему, и администратор свяжется с вами</DialogDescription>
          </DialogHeader>
          <form onSubmit={createReport} className="space-y-4">
            {createError && <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-3 text-sm">{createError}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium">Тип</label>
              <select className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm" value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value })}>
                <option value="user">Пользователь</option>
                <option value="product">Товар</option>
                <option value="rfq">Заявка</option>
                <option value="message">Сообщение</option>
                <option value="other">Другое</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID объекта</label>
              <Input placeholder="Например: ID товара или пользователя" value={createForm.targetId} onChange={e => setCreateForm({ ...createForm, targetId: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Причина</label>
              <Input placeholder="Кратко опишите проблему" value={createForm.reason} onChange={e => setCreateForm({ ...createForm, reason: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Описание</label>
              <Textarea placeholder="Подробное описание ситуации..." value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="border-border" onClick={() => setShowCreate(false)}>Отмена</Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/90">Отправить</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
