import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Building2, Mail, FileText, Save, LogOut,
  ChevronLeft, ChevronRight, Search, User
} from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [rfqs, setRfqs] = useState([])
  const [rfqStats, setRfqStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [rfqFilters, setRfqFilters] = useState({ search: '', status: 'all', sortBy: 'createdAt', page: 1 })
  const [pagination, setPagination] = useState({ pages: 1 })
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadProfile() }, [])
  useEffect(() => { loadRfqs() }, [rfqFilters.page, rfqFilters.search, rfqFilters.status, rfqFilters.sortBy])

  const loadProfile = async () => {
    try {
      const res = await api.get('/profile/me')
      setUser(res.data.user)
      setRfqStats(res.data.rfqStats)
      setEditForm({ email: res.data.user.email, companyName: res.data.user.tenant?.name || '', password: '' })
    } catch { setError('Ошибка загрузки профиля') }
    finally { setLoading(false) }
  }

  const loadRfqs = async () => {
    try {
      const res = await api.get('/profile/rfqs', { params: rfqFilters })
      setRfqs(res.data.rfqs)
      setPagination({ pages: res.data.pages })
    } catch { setError('Ошибка загрузки заявок') }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = { ...editForm }
      if (!payload.password) delete payload.password
      await api.put('/profile/me', payload)
      setSuccess('Данные обновлены')
      setEditForm(prev => ({ ...prev, password: '' }))
      loadProfile()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  if (loading) return <div className="flex items-center justify-center h-64 text-[#64748b]">Загрузка...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Личный кабинет</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card className="border-[#e2e8f0] shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-[#005BAC] text-white text-lg">
                    {getInitials(user?.tenant?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg text-[#0f172a]">{user?.tenant?.name}</h3>
                  <p className="text-sm text-[#64748b]">{user?.email}</p>
                  <Badge className={user?.isActive ? 'bg-[#22c55e] text-white hover:bg-[#22c55e] mt-1' : 'bg-[#f59e0b] text-white hover:bg-[#f59e0b] mt-1'}>
                    {user?.isActive ? 'Активен' : 'На проверке'}
                  </Badge>
                </div>
              </div>
              <Separator className="my-4 bg-[#e2e8f0]" />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f8fafc] rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-[#0f172a]">{rfqStats.open?._count?.status || 0}</div>
                  <div className="text-xs text-[#64748b]">Открытых</div>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-[#0f172a]">{rfqStats.in_progress?._count?.status || 0}</div>
                  <div className="text-xs text-[#64748b]">В работе</div>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-[#0f172a]">{rfqStats.closed?._count?.status || 0}</div>
                  <div className="text-xs text-[#64748b]">Закрытых</div>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-[#0f172a]">{rfqStats.cancelled?._count?.status || 0}</div>
                  <div className="text-xs text-[#64748b]">Отменённых</div>
                </div>
              </div>
              <Separator className="my-4 bg-[#e2e8f0]" />
              <Button variant="outline" className="w-full border-[#e2e8f0] hover:bg-[#f1f5f9]" asChild>
                <Link to={`/company/${user?.tenant?.id || user?.tenantId}`} className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Страница компании
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="bg-[#f8fafc]">
              <TabsTrigger value="profile" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Мои данные
              </TabsTrigger>
              <TabsTrigger value="rfqs" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Мои заявки
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card className="border-[#e2e8f0] shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#0f172a]">Редактирование профиля</CardTitle>
                  <CardDescription>Обновите данные вашей компании</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && <div className="bg-[#fee2e2] text-[#ef4444] border border-[#fecaca] rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}
                  {success && <div className="bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] rounded-lg px-4 py-3 text-sm mb-4">{success}</div>}
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email для входа</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                        <Input id="email" type="email" className="pl-9 border-[#e2e8f0]" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Название компании</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                        <Input id="company" className="pl-9 border-[#e2e8f0]" value={editForm.companyName || ''} onChange={e => setEditForm({ ...editForm, companyName: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Новый пароль</Label>
                      <Input id="password" type="password" className="border-[#e2e8f0]" value={editForm.password || ''} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder="Оставьте пустым, чтобы не менять" />
                      <p className="text-xs text-[#64748b]">Минимум 6 символов</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button type="submit" disabled={saving} className="bg-[#005BAC] text-white hover:bg-[#004a8d] flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Сохранение...' : 'Сохранить изменения'}
                      </Button>
                      <Button type="button" variant="destructive" className="bg-[#ef4444] text-white hover:bg-[#dc2626] flex items-center gap-2" onClick={() => {
                        localStorage.removeItem('token')
                        localStorage.removeItem('isAdmin')
                        navigate('/login')
                      }}>
                        <LogOut className="h-4 w-4" />
                        Выйти из аккаунта
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rfqs" className="space-y-4">
              <Card className="border-[#e2e8f0] shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                      <Input className="pl-9 border-[#e2e8f0]" placeholder="Поиск по названию..." value={rfqFilters.search} onChange={e => setRfqFilters({ ...rfqFilters, search: e.target.value, page: 1 })} />
                    </div>
                    <select className="h-10 rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm" value={rfqFilters.status} onChange={e => setRfqFilters({ ...rfqFilters, status: e.target.value, page: 1 })}>
                      <option value="all">Все статусы</option>
                      <option value="open">Открытые</option>
                      <option value="in_progress">В работе</option>
                      <option value="closed">Закрытые</option>
                      <option value="cancelled">Отменённые</option>
                    </select>
                    <select className="h-10 rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm" value={rfqFilters.sortBy} onChange={e => setRfqFilters({ ...rfqFilters, sortBy: e.target.value, page: 1 })}>
                      <option value="createdAt">Сначала новые</option>
                      <option value="title">По названию</option>
                      <option value="budget">По бюджету</option>
                    </select>
                  </div>

                  {rfqs.length === 0 ? (
                    <div className="text-center py-8 text-[#64748b]">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-[#cbd5e1]" />
                      <p>У вас пока нет заявок</p>
                      <Button className="mt-3 bg-[#005BAC] text-white hover:bg-[#004a8d]" size="sm" asChild>
                        <Link to="/rfq/create">Создать заявку</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rfqs.map(rfq => (
                        <Link to={`/rfq/${rfq.id}`} key={rfq.id}>
                          <Card className="border-[#e2e8f0] shadow-sm hover:bg-[#f8fafc] transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-[#0f172a] truncate">{rfq.title}</h4>
                                  <p className="text-sm text-[#64748b] line-clamp-2 mt-1">{rfq.description}</p>
                                  <div className="flex items-center gap-2 mt-2 text-xs text-[#64748b]">
                                    <span>{new Date(rfq.createdAt).toLocaleDateString('ru-RU')}</span>
                                    <span>•</span>
                                    <span>{rfq._count?.quotes || 0} предложений</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <Badge className={
                                    rfq.status === 'open' ? 'bg-[#005BAC] text-white hover:bg-[#005BAC]' :
                                    rfq.status === 'in_progress' ? 'bg-[#f59e0b] text-white hover:bg-[#f59e0b]' :
                                    rfq.status === 'closed' ? 'bg-[#22c55e] text-white hover:bg-[#22c55e]' :
                                    'bg-[#ef4444] text-white hover:bg-[#ef4444]'
                                  }>
                                    {rfq.status === 'open' ? 'Открыт' : rfq.status === 'in_progress' ? 'В работе' : rfq.status === 'closed' ? 'Закрыт' : 'Отменён'}
                                  </Badge>
                                  <div className="text-sm font-bold text-[#005BAC] mt-1">
                                    {rfq.budget ? `${Number(rfq.budget).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}

                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" className="border-[#e2e8f0] hover:bg-[#f1f5f9]" onClick={() => setRfqFilters(p => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={rfqFilters.page === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-[#64748b]">Стр. {rfqFilters.page} из {pagination.pages}</span>
                      <Button variant="outline" size="sm" className="border-[#e2e8f0] hover:bg-[#f1f5f9]" onClick={() => setRfqFilters(p => ({ ...p, page: Math.min(pagination.pages, p.page + 1) }))} disabled={rfqFilters.page === pagination.pages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
