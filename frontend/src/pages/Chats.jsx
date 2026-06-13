import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { MessageSquare, Loader2, Search } from 'lucide-react'
import SEO from '../components/SEO'

export default function Chats() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    api.get('/chat/rooms')
      .then(res => setRooms(res.data.rooms || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    const query = searchQuery.trim()
    if (!query) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    searchTimeoutRef.current = setTimeout(() => {
      api.get('/chat/search', { params: { query, limit: 20 } })
        .then(res => setSearchResults(res.data.messages || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery])

  const getRoomLink = (room) => {
    if (room.roomType === 'product') return `/product/${room.roomId}`
    return `/rfq/${room.roomId}`
  }

  const getMessageLink = (msg) => {
    if (msg.productId) return `/product/${msg.productId}`
    if (msg.rfqId) return `/rfq/${msg.rfqId}`
    return '#'
  }

  const getMessageTitle = (msg) => {
    if (msg.product?.name) return msg.product.name
    if (msg.rfq?.title) return msg.rfq.title
    return 'Чат'
  }

  const formatTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Загрузка...
      </div>
    )
  }

  const query = searchQuery.trim()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SEO title="Сообщения" description="Ваши переписки на NexaTrade." noindex />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Сообщения</h1>
      </div>

      <Card>
        <CardHeader className="bg-muted/50 border-b space-y-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Чаты
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск по сообщениям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {query ? (
              <div className="divide-y">
                {searchLoading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Поиск...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Ничего не найдено
                  </div>
                ) : (
                  searchResults.map(msg => (
                    <Link
                      key={msg.id}
                      to={getMessageLink(msg)}
                      className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {msg.sender?.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground truncate">
                            {msg.sender?.name || 'Неизвестный'}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {getMessageTitle(msg)}
                        </div>
                        <div className="text-sm text-foreground truncate">
                          {msg.isDeleted ? 'Сообщение удалено' : msg.content}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Нет активных чатов
              </div>
            ) : (
              <div className="divide-y">
                {rooms.map(room => (
                  <Link
                    key={`${room.roomType}:${room.roomId}`}
                    to={getRoomLink(room)}
                    className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={room.counterpart?.avatarUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {room.counterpart?.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground truncate">
                          {room.counterpart?.name || 'Неизвестный'}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(room.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {room.title}
                      </div>
                      <div className="text-sm text-foreground truncate">
                        {room.lastMessage?.isDeleted
                          ? 'Сообщение удалено'
                          : room.lastMessage?.content || 'Файл'}
                      </div>
                    </div>
                    {room.unreadCount > 0 && (
                      <Badge className="bg-primary text-white shrink-0">
                        {room.unreadCount}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
