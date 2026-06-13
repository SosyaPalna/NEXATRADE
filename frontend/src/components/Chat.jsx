import { useEffect, useState, useRef, useCallback } from 'react'
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
import {
  Send,
  MessageCircle,
  Pencil,
  Trash2,
  Flag,
  Check,
  X,
  Paperclip,
  Loader2,
  FileText,
  Download,
  ChevronUp,
} from 'lucide-react'

const MESSAGES_LIMIT = 30

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(url) {
  return /\.(webp|jpg|jpeg|png|gif)(\?.*)?$/i.test(url)
}

export default function Chat({ roomType, roomId, currentTenantId, title = 'Чат' }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [reportModal, setReportModal] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [oldestCursor, setOldestCursor] = useState(null)
  const messagesEndRef = useRef(null)
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  const { addNotification } = useNotification()
  const isTabActiveRef = useRef(!document.hidden)

  // Подключение к сокету
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
    newSocket.emit('messages:load', { roomType, roomId, limit: MESSAGES_LIMIT })

    newSocket.on('message:receive', (message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev
        return [...prev, message]
      })
      if (message.senderId !== currentTenantId && isTabActiveRef.current) {
        newSocket.emit('messages:mark-read', { roomType, roomId })
      }
      if (message.senderId !== currentTenantId) {
        addNotification(
          `Новое сообщение от ${message.sender?.name || 'партнёра'}`,
          'info'
        )
      }
    })

    newSocket.on('messages:loaded', ({ messages: history, hasMore: more }) => {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const unique = history.filter(m => !existingIds.has(m.id))
        return [...unique, ...prev]
      })
      setHasMore(more)
      if (history.length > 0) {
        setOldestCursor(history[0].createdAt)
      }
      setLoadingMore(false)
    })

    newSocket.on('message:edited', (updated) => {
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
    })

    newSocket.on('message:deleted', (updated) => {
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
    })

    newSocket.on('messages:read', ({ ids, readAt }) => {
      setMessages(prev => prev.map(m =>
        ids.includes(m.id) ? { ...m, readAt: readAt || new Date().toISOString() } : m
      ))
    })

    const handleVisibility = () => {
      isTabActiveRef.current = !document.hidden
      if (!document.hidden && newSocket.connected) {
        newSocket.emit('messages:mark-read', { roomType, roomId })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      newSocket.disconnect()
    }
  }, [roomType, roomId, currentTenantId, addNotification])

  // Автопрокрутка к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const uploadFiles = async (files) => {
    if (!files.length) return []
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      const res = await api.post('/uploads/chat-attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.files || []
    } catch (err) {
      addNotification(err.response?.data?.error || 'Ошибка загрузки файлов', 'error')
      return []
    } finally {
      setUploading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!socket) return
    const text = newMessage.trim()
    if (!text && attachments.length === 0) return

    let fileUrls = []
    if (attachments.length > 0) {
      const uploaded = await uploadFiles(attachments)
      fileUrls = uploaded.map(f => f.url)
      if (uploaded.length !== attachments.length && !text) return
    }

    socket.emit('message:send', {
      roomType,
      roomId,
      content: text,
      attachments: fileUrls,
    })
    setNewMessage('')
    setAttachments([])
  }

  const loadMore = useCallback(() => {
    if (!socket || loadingMore || !hasMore || !oldestCursor) return
    setLoadingMore(true)
    socket.emit('messages:load', {
      roomType,
      roomId,
      limit: MESSAGES_LIMIT,
      before: oldestCursor,
    })
  }, [socket, loadingMore, hasMore, oldestCursor, roomType, roomId])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length + attachments.length > 5) {
      addNotification('Максимум 5 файлов', 'error')
      return
    }
    setAttachments(prev => [...prev, ...files].slice(0, 5))
    e.target.value = ''
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
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

  const renderReadStatus = (msg) => {
    if (msg.senderId !== currentTenantId) return null
    if (msg.readAt) {
      return (
        <span title="Прочитано" className="text-[10px] opacity-80">
          <Check className="h-3 w-3 inline" />
          <Check className="h-3 w-3 inline -ml-1.5" />
        </span>
      )
    }
    return (
      <span title="Отправлено" className="text-[10px] opacity-60">
        <Check className="h-3 w-3 inline" />
      </span>
    )
  }

  const renderAttachments = (attachments = []) => {
    if (!attachments.length) return null
    return (
      <div className="space-y-2 mt-2">
        {attachments.map((url, idx) => (
          <div key={`${url}-${idx}`}>
            {isImage(url) ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={url}
                  alt="attachment"
                  className="max-w-[200px] max-h-[160px] rounded-md object-cover border"
                />
              </a>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs underline opacity-90 hover:opacity-100"
              >
                <FileText className="h-4 w-4" />
                <span className="truncate max-w-[180px]">{url.split('/').pop()}</span>
                <Download className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    )
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
          <ScrollArea className="h-80 p-4" ref={scrollRef}>
            <div className="space-y-3">
              {hasMore && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="h-7 text-xs"
                  >
                    {loadingMore ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <ChevronUp className="h-3 w-3 mr-1" />
                    )}
                    Загрузить историю
                  </Button>
                </div>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentTenantId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
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
                        {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
                        {renderAttachments(msg.attachments)}
                        <div className={`text-xs mt-1 opacity-70 flex items-center gap-1 ${msg.senderId === currentTenantId ? 'justify-end' : ''}`}>
                          <span>{msg.sender?.name}</span>
                          {msg.isEdited && <span className="text-[10px]">(изм.)</span>}
                          <span>•</span>
                          <span>{formatTime(msg.createdAt)}</span>
                          {renderReadStatus(msg)}
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

          {attachments.length > 0 && (
            <div className="px-3 pt-2 border-t bg-background">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-1">
                    <FileText className="h-3 w-3" />
                    <span className="max-w-[120px] truncate">{file.name}</span>
                    <span className="opacity-60">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t bg-background">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.txt,image/*,application/pdf"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={uploading || attachments.length >= 5}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              type="text"
              placeholder="Напишите сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!socket || uploading}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={(!newMessage.trim() && attachments.length === 0) || !socket || uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
