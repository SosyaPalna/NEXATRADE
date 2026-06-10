import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Send, AlertCircle, CheckCircle2, Users, Search, X } from 'lucide-react'
import SEO from '../components/SEO'

export default function AdminBroadcast() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [mode, setMode] = useState('all') // 'all' | 'selected'
  const [selectedIds, setSelectedIds] = useState([])
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadUsers()
  }, [userSearch])

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users', { params: { search: userSearch, limit: 50 } })
      setUsers(res.data.users)
    } catch {
      // silent
    }
  }

  const toggleUser = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        title,
        message,
        type: 'system',
        link: link || undefined,
        recipientIds: mode === 'selected' ? selectedIds : undefined,
      }
      const res = await api.post('/admin/notifications/send', payload)
      setSuccess(`Уведомление отправлено ${res.data.sent} пользователям`)
      setTitle('')
      setMessage('')
      setLink('')
      setSelectedIds([])
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SEO title="Рассылка уведомлений" description="Массовая рассылка уведомлений пользователям NexaTrade." noindex nofollow />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Рассылка уведомлений</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Новое уведомление</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Заголовок</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Например: Обновление платформы"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Текст уведомления</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Введите текст уведомления..."
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Ссылка (необязательно)</Label>
                <Input
                  id="link"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  placeholder="/dashboard или https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Получатели</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mode === 'all' ? 'default' : 'outline'}
                    className={mode === 'all' ? 'bg-primary text-white' : 'border-border'}
                    onClick={() => setMode('all')}
                  >
                    <Users className="h-4 w-4 mr-1.5" />
                    Все пользователи
                  </Button>
                  <Button
                    type="button"
                    variant={mode === 'selected' ? 'default' : 'outline'}
                    className={mode === 'selected' ? 'bg-primary text-white' : 'border-border'}
                    onClick={() => setMode('selected')}
                  >
                    Выбранные ({selectedIds.length})
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-white hover:bg-primary/90"
                disabled={loading || (mode === 'selected' && selectedIds.length === 0) || !title.trim() || !message.trim()}
              >
                <Send className="h-4 w-4 mr-1.5" />
                {loading ? 'Отправка...' : 'Отправить уведомление'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {mode === 'selected' && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Выбор получателей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Поиск по email или компании..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 border-border"
                />
              </div>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                      selectedIds.includes(user.id) ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleUser(user.id)}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {user.tenant?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.tenant?.name || '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {selectedIds.includes(user.id) && (
                      <Badge className="bg-primary text-white text-[10px]">Выбран</Badge>
                    )}
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Пользователи не найдены</p>
                )}
              </div>
              {selectedIds.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setSelectedIds([])}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Снять выделение
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
