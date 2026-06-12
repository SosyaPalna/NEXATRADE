import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useNotification } from '../context/NotificationContext'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, MessageCircle, Pencil, Trash2, Flag, Check, X } from 'lucide-react'

export default function Chat({ roomType, roomId, currentTenantId, title = 'Чат' }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [reportModal, setReportModal] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const messagesEndRef = useRef(null)
  const { addNotification } = useNotification()

  useEffect(() => {
    const socketUrl = window.location.origin
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    setSocket(newSocket)
    newSocket.emit('join:room', { type: roomType, id: roomId })
    newSocket.emit('messages:load', { roomType, roomId })

    newSocket.on('message:receive', (message) => {
      setMessages(prev => [...prev, message])
      if (message.senderId !== currentTenantId) {
        addNotification(
          `Новое сообщение от ${message.sender?.name || 'партнёра'}`,
          'info'
        )
      }
    })

    newSocket.on('messages:loaded', (history) => {
      setMessages(history)
    })

    newSocket.on('message:edited', (updated) => {
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
    })

    newSocket.on('message:deleted', (updated) => {
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
    })

    return () => {
      newSocket.disconnect()
    }
  }, [roomType, roomId, currentTenantId, addNotification])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return
    socket.emit('message:send', { roomType, roomId, content: newMessage.trim() })
    setNewMessage('')
  }

  const startEdit = (msg) => {
    setEditingId(msg.id)
    setEditContent(msg.isDeleted ? '' : msg.content)
  }

  const saveEdit = () => {
    if (!editContent.trim() || !socket) return
    socket.emit('message:edit', { messageId: editingId, content: editContent.trim() })
    setEditingId(null)
    setEditContent('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const deleteMessage = (msgId) => {
    if (!socket) return
    socket.emit('message:delete', { messageId: msgId })
  }

  const submitReport = async () => {
    if (!reportReason) return
    try {
      const res = await api.post('/reports', {
        type: 'message',
        targetId: reportModal.id,
        reason: reportReason,
        description: reportDescription
      })
      if (res.status >= 200 && res.status < 300) {
        addNotification('Жалоба отправлена', 'success')
        setReportModal(null)
        setReportReason('')
        setReportDescription('')
      } else {
        addNotification('Ошибка отправки жалобы', 'error')
      }
    } catch {
      addNotification('Ошибка отправки жалобы', 'error')
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-4 bg-muted/50 border-b">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64 p-4">
            <div className="space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentTenantId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.senderId === currentTenantId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}>
                    {msg.isDeleted ? (
                      <div className="italic opacity-60">Сообщение удалено</div>
                    ) : editingId === msg.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="h-7 text-sm bg-card/20 border-0 text-inherit placeholder:text-inherit/50"
                          autoFocus
                        />
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEdit}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>{msg.content}</div>
                        <div className={`text-xs mt-1 opacity-70 flex items-center gap-1 ${msg.senderId === currentTenantId ? 'justify-end' : ''}`}>
                          <span>{msg.sender?.name}</span>
                          {msg.isEdited && <span className="text-[10px]">(изм.)</span>}
                          <span>•</span>
                          <span>{formatTime(msg.createdAt)}</span>
                        </div>
                      </>
                    )}

                    {!msg.isDeleted && editingId !== msg.id && (
                      <div className={`flex items-center gap-1 mt-1 ${msg.senderId === currentTenantId ? 'justify-end' : 'justify-start'}`}>
                        {msg.senderId === currentTenantId && (
                          <>
                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-100 text-muted-foreground hover:text-foreground" onClick={() => startEdit(msg)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-100 text-muted-foreground hover:text-foreground" onClick={() => deleteMessage(msg.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-100 text-muted-foreground hover:text-foreground" onClick={() => setReportModal(msg)}>
                          <Flag className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t bg-background">
            <Input
              type="text"
              placeholder="Напишите сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!socket}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || !socket}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <Dialog open={!!reportModal} onOpenChange={() => setReportModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Пожаловаться на сообщение</DialogTitle>
            <DialogDescription>{reportModal?.content?.slice(0, 60)}...</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger className="border-border">
                <SelectValue placeholder="Причина жалобы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Спам</SelectItem>
                <SelectItem value="insult">Оскорбление</SelectItem>
                <SelectItem value="fraud">Мошенничество</SelectItem>
                <SelectItem value="offtopic">Оффтоп</SelectItem>
                <SelectItem value="other">Другое</SelectItem>
              </SelectContent>
            </Select>
            <textarea
              className="w-full rounded-md border border-border bg-card p-3 text-sm min-h-[80px]"
              placeholder="Дополнительное описание (необязательно)"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-border" onClick={() => setReportModal(null)}>Отмена</Button>
            <Button className="bg-primary text-white hover:bg-primary/90" onClick={submitReport} disabled={!reportReason}>
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
