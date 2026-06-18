import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Pencil,
} from 'lucide-react'
import SEO from '../components/SEO'

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1 })

  const [selectedUser, setSelectedUser] = useState(null)
  const [userRfqs, setUserRfqs] = useState([])

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users', { params: { search, page, limit: 20 } })
      setUsers(res.data.users)
      setPagination({ pages: res.data.pages })
    } catch {
      setError('Ошибка загрузки списка пользователей')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { loadUsers() }, [loadUsers])

  const openUserDetail = async (userId) => {
    setError('')
    try {
      const res = await api.get(`/admin/users/${userId}`)
      setSelectedUser(res.data.user)
      setUserRfqs(res.data.rfqs)
      setEditForm({
        email: res.data.user.email,
        isActive: res.data.user.isActive,
        isAdmin: res.data.user.isAdmin,
        companyName: res.data.user.tenant?.name || '',
        password: '',
      })
      setIsEditing(false)
    } catch {
      setError('Не удалось загрузить данные пользователя')
    } finally {
      // silent
    }
  }

  const closeUserDetail = () => {
    setSelectedUser(null)
    setUserRfqs([])
    setIsEditing(false)
    setError('')
  }

  const handleSaveUser = async () => {
    setSaving(true)
    setError('')
    try {
      await api.put(`/admin/users/${selectedUser.id}`, editForm)
      setIsEditing(false)
      const res = await api.get(`/admin/users/${selectedUser.id}`)
      setSelectedUser(res.data.user)
      setUserRfqs(res.data.rfqs)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const openRfqDetail = (rfqId) => {
    navigate(`/rfq/${rfqId}`)
  }

  if (selectedUser) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={closeUserDetail}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl text-foreground">Карточка пользователя</CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Редактировать
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {!isEditing ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="text-foreground font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Компания</Label>
                    <p className="text-foreground font-medium">{selectedUser.tenant?.name || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Роль</Label>
                    <p className="text-foreground font-medium">{selectedUser.tenant?.role || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Администратор</Label>
                    <p className="text-foreground font-medium">{selectedUser.isAdmin ? 'Да' : 'Нет'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Активен</Label>
                    <p className="text-foreground font-medium">{selectedUser.isActive ? 'Да' : 'Нет'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Дата регистрации</Label>
                    <p className="text-foreground font-medium">
                      {new Date(selectedUser.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>

                <Separator className="bg-border" />

                <div>
                  <h4 className="text-foreground font-semibold mb-3">
                    Последние заявки ({userRfqs.length})
                  </h4>
                  {userRfqs.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Заявок пока нет</p>
                  ) : (
                    <div className="space-y-2">
                      {userRfqs.map((rfq) => (
                        <div
                          key={rfq.id}
                          onClick={() => openRfqDetail(rfq.id)}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted hover:bg-muted cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="font-medium text-foreground text-sm">{rfq.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Создана: {new Date(rfq.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={rfq.status === 'open' ? 'default' : rfq.status === 'in_progress' ? 'secondary' : 'outline'} className="text-xs">
                              {rfq.status}
                            </Badge>
                            <span className="text-sm font-semibold text-primary">
                              {rfq.budget ? `${rfq.budget} ₽` : '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="text-foreground font-semibold">Редактирование</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Название компании</Label>
                    <Input
                      value={editForm.companyName}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      className="border-border"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Новый пароль (оставьте пустым, чтобы не менять)</Label>
                    <Input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="border-border"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <Checkbox
                      checked={editForm.isActive}
                      onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })}
                    />
                    Активен
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <Checkbox
                      checked={editForm.isAdmin}
                      onCheckedChange={(v) => setEditForm({ ...editForm, isAdmin: v })}
                    />
                    Права администратора
                  </label>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" className="border-border" onClick={() => setIsEditing(false)} disabled={saving}>
                    <X className="h-4 w-4 mr-1" />
                    Отмена
                  </Button>
                  <Button className="bg-primary text-white hover:bg-primary/90" onClick={handleSaveUser} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SEO title="Пользователи" description="Управление пользователями Торговый Хаб." noindex nofollow />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Управление пользователями</h1>
        <span className="text-sm text-muted-foreground">Найдено: {users.length}</span>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Поиск по email или компании..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 border-border"
          />
        </div>
      </div>

      <Card className="border border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Компания</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Админ</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Активен</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Дата</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-[80px]">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => openUserDetail(user.id)}
                    className="border-b border-border hover:bg-muted cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-foreground">{user.tenant?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isAdmin ? 'default' : 'outline'} className={user.isAdmin ? 'bg-primary text-white' : 'text-muted-foreground'}>
                        {user.isAdmin ? 'Да' : 'Нет'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? 'default' : 'destructive'} className={user.isActive ? 'bg-green-500 text-white' : ''}>
                        {user.isActive ? 'Да' : 'Нет'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); openUserDetail(user.id) }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Пользователи не найдены
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Загрузка...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Стр. {page} из {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
