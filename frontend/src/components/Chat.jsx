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
  Search,
  Reply,
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
  const [typingUsers, setTypingUsers] = useState({})
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [blocks, setBlocks] = useState({ iBlocked: null, blockedMe: null })
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [counterpartId, setCounterpartId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeoutRef = useRef(null)
  const messagesEndRef = useRef(null)
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  const messageRefs = useRef({})
  const dragCounterRef = useRef(0)
  const { addNotification } = useNotification()
  const isTabActiveRef = useRef(!document.hidden)
  const typingTimeoutRef = useRef(null)

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

    api.get('/chat/blocks', { params: { roomType, roomId } })
      .then(res => setBlocks(res.data || { iBlocked: null, blockedMe: null }))
      .catch(() => {})

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

    newSocket.on('typing', ({ tenantId, typing }) => {
      setTypingUsers(prev => {
        const next = { ...prev }
        if (typing) {
          next[tenantId] = true
        } else {
          delete next[tenantId]
        }
        return next
      })
    })

    newSocket.on('user:online', ({ tenantId }) => {
      setOnlineUsers(prev => new Set(prev).add(tenantId))
    })

    newSocket.on('user:offline', ({ tenantId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        next.delete(tenantId)
        return next
      })
    })

    newSocket.on('presence:list', ({ online }) => {
      setOnlineUsers(prev => new Set([...prev, ...online]))
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
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      newSocket.disconnect()
    }
  }, [roomType, roomId, currentTenantId, addNotification])

  // Автопрокрутка к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Определяем собеседника для статуса онлайн
  useEffect(() => {
    const other = messages.find(m => m.senderId !== currentTenantId)
    if (other?.senderId && other.senderId !== counterpartId) {
      setCounterpartId(other.senderId)
    }
  }, [messages, currentTenantId, counterpartId])

  // Запрашиваем статус собеседника при смене комнаты/собеседника
  useEffect(() => {
    if (!socket || !counterpartId) return
    socket.emit('presence:query', { tenantIds: [counterpartId] })
  }, [socket, counterpartId])

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
      // ошибку показывает глобальный axios-интерцептор
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
      replyToId: replyTo?.id,
    })
    setNewMessage('')
    setAttachments([])
    setReplyTo(null)
    socket.emit('typing:stop', { roomType, roomId })
  }

  const isBlockedByCounterpart = !!blocks.blockedMe

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    if (!socket) return
    socket.emit('typing:start', { roomType, roomId })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { roomType, roomId })
    }, 2000)
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

  const handleFiles = (files) => {
    if (files.length === 0) return
    if (files.length + attachments.length > 5) {
      addNotification('Максимум 5 файлов', 'error')
      return
    }
    setAttachments(prev => [...prev, ...files].slice(0, 5))
  }

  const handleFileSelect = (e) => {
    handleFiles(Array.from(e.target.files || []))
    e.target.value = ''
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    dragCounterRef.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragging(false)
    handleFiles(Array.from(e.dataTransfer.files || []))
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

  const renderReplyPreview = (msg, compact = false) => {
    if (!msg) return null
    const isDeleted = msg.isDeleted
    const text = isDeleted ? 'Сообщение удалено' : msg.content?.slice(0, 80) || 'Файл'
    return (
      <div className={`border-l-2 pl-2 opacity-80 ${compact ? 'mb-1 text-xs' : 'mb-2 text-sm'}`}>
        <div className="font-medium truncate">{msg.sender?.name || 'Неизвестный'}</div>
        <div className="truncate">{text}{!isDeleted && msg.content?.length > 80 ? '...' : ''}</div>
      </div>
    )
  }

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m =>
        !m.isDeleted &&
        m.content.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : messages

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    const query = searchQuery.trim()
    if (!query || query.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    searchTimeoutRef.current = setTimeout(() => {
      api.get('/chat/search', { params: { query, roomType, roomId, limit: 20 } })
        .then(res => setSearchResults(res.data.messages || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery, roomType, roomId])

  const loadMessageContext = async (messageId) => {
    try {
      const res = await api.get(`/chat/messages/${messageId}/context`)
      const { before, target, after, hasMoreBefore } = res.data
      const contextMessages = [...before, target, ...after]
      setMessages(contextMessages)
      setHasMore(hasMoreBefore)
      setOldestCursor(before[0]?.createdAt || target.createdAt)
      setSearchQuery('')
      setSearchResults([])
      setTimeout(() => {
        const el = messageRefs.current[target.id]
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    } catch (err) {
      // ошибку показывает глобальный axios-интерцептор
    }
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

  const getChatFileUrl = (url) => {
    if (!url || typeof url !== 'string') return url
    if (url.startsWith('/uploads/chat/')) {
      return `/api/chat/files/${url.split('/').pop()}`
    }
    return url
  }

  const renderAttachments = (attachments = []) => {
    if (!attachments.length) return null
    return (
      <div className="space-y-2 mt-2">
        {attachments.map((url, idx) => {
          const fileUrl = getChatFileUrl(url)
          return (
            <div key={`${url}-${idx}`}>
              {isImage(fileUrl) ? (
                <button
                  type="button"
                  onClick={() => setLightboxUrl(fileUrl)}
                  className="block p-0 border-0 bg-transparent cursor-zoom-in"
                >
                  <img
                    src={fileUrl}
                    alt="attachment"
                    className="max-w-50 max-h-40 rounded-md object-cover border"
                  />
                </button>
              ) : (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs underline opacity-90 hover:opacity-100"
                >
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-45">{url.split('/').pop()}</span>
                  <Download className="h-3 w-3" />
                </a>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <Card
        className={`overflow-hidden ${isDragging ? 'ring-2 ring-primary bg-primary/5' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardHeader className="py-3 px-4 bg-muted/50 border-b">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 flex-wrap min-w-0">
              <MessageCircle className="h-4 w-4 text-primary" />
              {title}
              {counterpartId && (
                <span
                  className={`ml-2 inline-flex items-center gap-1 text-xs ${
                    onlineUsers.has(counterpartId) ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      onlineUsers.has(counterpartId) ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  {onlineUsers.has(counterpartId) ? 'онлайн' : 'оффлайн'}
                </span>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setSearchOpen(prev => !prev)
                setSearchQuery('')
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isBlockedByCounterpart && (
            <div className="px-4 py-2 text-xs text-center text-destructive bg-destructive/10 border-b">
              Вы заблокированы собеседником и не можете отправлять сообщения
            </div>
          )}

          {blocks.iBlocked && (
            <div className="px-4 py-2 text-xs text-center text-amber-600 bg-amber-50 border-b">
              Вы заблокировали этого собеседника
            </div>
          )}

          {searchOpen && (
            <div className="px-3 pt-2 border-b bg-background">
              <Input
                type="text"
                placeholder="Поиск по сообщениям..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
              {searchQuery.trim() && (
                <div className="py-2 max-h-48 overflow-y-auto">
                  {searchLoading ? (
                    <div className="text-xs text-muted-foreground">Поиск...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Ничего не найдено</div>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.map(msg => (
                        <button
                          key={msg.id}
                          type="button"
                          onClick={() => loadMessageContext(msg.id)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-xs"
                        >
                          <div className="text-muted-foreground">{formatTime(msg.createdAt)}</div>
                          <div className="truncate text-foreground">{msg.content}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {filteredMessages.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      В загруженных сообщениях: {filteredMessages.length}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <ScrollArea className="h-64 sm:h-80 p-4" ref={scrollRef}>
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
              {(searchQuery.trim() ? filteredMessages : messages).map(msg => (
                <div
                  key={msg.id}
                  ref={el => { messageRefs.current[msg.id] = el }}
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
                        {msg.replyTo && renderReplyPreview(msg.replyTo)}
                        {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
                        {renderAttachments(msg.attachments)}
                        <div className={`text-xs mt-1 opacity-70 flex flex-wrap items-center gap-1 ${msg.senderId === currentTenantId ? 'justify-end' : ''}`}>
                          <span>{msg.sender?.name}</span>
                          {msg.isEdited && <span className="text-[10px]">(изм.)</span>}
                          <span>•</span>
                          <span>{formatTime(msg.createdAt)}</span>
                          {renderReadStatus(msg)}
                        </div>
                      </>
                    )}

                    {!msg.isDeleted && editingId !== msg.id && (
                      <div className={`flex flex-wrap items-center gap-1 mt-1 ${msg.senderId === currentTenantId ? 'justify-end' : 'justify-start'}`}>
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-100 text-muted-foreground hover:text-foreground" onClick={() => setReplyTo(msg)}>
                          <Reply className="h-3 w-3" />
                        </Button>
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

          {Object.keys(typingUsers).length > 0 && (
            <div className="px-4 py-1 text-xs text-muted-foreground">
              Печатает{Object.keys(typingUsers).length > 1 ? 'ут' : ''}...
            </div>
          )}

          {attachments.length > 0 && (
            <div className="px-3 pt-2 border-t bg-background">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-1">
                    <FileText className="h-3 w-3" />
                    <span className="max-w-30 truncate">{file.name}</span>
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

          {replyTo && (
            <div className="px-3 pt-2 border-t bg-background">
              <div className="flex items-start gap-2 text-sm bg-muted rounded px-3 py-2">
                <div className="flex-1 min-w-0">
                  {renderReplyPreview(replyTo, true)}
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
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
              onChange={handleInputChange}
              disabled={!socket || uploading || isBlockedByCounterpart}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={(!newMessage.trim() && attachments.length === 0) || !socket || uploading || isBlockedByCounterpart}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Image lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto p-0 border-0 bg-black/90">
          <img
            src={lightboxUrl}
            alt="attachment preview"
            className="max-h-[85vh] w-auto mx-auto object-contain"
          />
        </DialogContent>
      </Dialog>

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
              className="w-full rounded-md border border-border bg-card p-3 text-sm min-h-20"
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
