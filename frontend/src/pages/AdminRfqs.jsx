import { useEffect, useState } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, ChevronLeft, ChevronRight, Settings, Trash2, AlertCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import SEO from '../components/SEO'

export default function AdminRfqs() {
  const navigate = useNavigate()
  const [rfqs, setRfqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1 })
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { loadRfqs() }, [page, search, statusFilter])

  const loadRfqs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/rfqs', { params: { search, status: statusFilter, page, limit: 20 } })
      setRfqs(res.data.rfqs)
      setPagination({ pages: res.data.pages })
    } catch {
      setError('Ошибка загрузки заявок')
    } finally {
      setLoading(false)
    }
  }

  const openStatusModal = (rfq) => setModal({ rfq, type: 'status' })
  const openDeleteModal = (rfq) => setModal({ rfq, type: 'delete' })

  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/admin/rfqs/${modal.rfq.id}`, { status })
      setModal(null)
      loadRfqs()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка изменения статуса')
    }
  }

  const [deleteReason, setDeleteReason] = useState('')

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/rfqs/${modal.rfq.id}`, { data: { reason: deleteReason } })
      setModal(null)
      setDeleteReason('')
      loadRfqs()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления')
    }
  }

  const statusVariant = (status) => {
    switch (status) {
      case 'open': return 'default'
      case 'in_progress': return 'secondary'
      case 'closed': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const statusLabel = (status) => {
    switch (status) {
      case 'open': return 'Открыта'
      case 'in_progress': return 'В работе'
      case 'closed': return 'Закрыта'
      case 'cancelled': return 'Отменена'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <SEO title="Заявки" description="Управление заявками на закупку в админ-панели NexaTrade." noindex nofollow />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Управление заявками</h1>
        <span className="text-sm text-muted-foreground">Всего: {rfqs.length}</span>
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
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px] border-border">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="open">Открытые</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="closed">Закрытые</SelectItem>
            <SelectItem value="cancelled">Отменённые</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Название</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Покупатель</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Статус</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Предложений</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Дата</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-[120px]">Действия</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((rfq) => (
                  <tr key={rfq.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{rfq.title}</div>
                      <div className="text-muted-foreground text-xs mt-0.5 truncate max-w-[200px]">
                        {rfq.description?.substring(0, 60)}...
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{rfq.buyer?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(rfq.status)} className="text-xs">
                        {statusLabel(rfq.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground">{rfq._count?.quotes || 0}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(rfq.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => openStatusModal(rfq)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => openDeleteModal(rfq)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rfqs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Заявок не найдено
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

      {/* Status Dialog */}
      <Dialog open={modal?.type === 'status'} onOpenChange={() => setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Изменить статус</DialogTitle>
            <DialogDescription>{modal?.rfq?.title}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {['open', 'in_progress', 'closed', 'cancelled'].map((s) => (
              <Button
                key={s}
                variant={modal?.rfq?.status === s ? 'default' : 'outline'}
                className={modal?.rfq?.status === s ? 'bg-primary text-white' : 'border-border'}
                onClick={() => handleStatusChange(s)}
                disabled={modal?.rfq?.status === s}
              >
                {statusLabel(s)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={modal?.type === 'delete'} onOpenChange={() => { setModal(null); setDeleteReason('') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить заявку</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить заявку «{modal?.rfq?.title}»? Владельцу будет отправлено уведомление.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="delete-reason">Причина удаления</Label>
            <Textarea
              id="delete-reason"
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="Укажите причину удаления заявки..."
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-border" onClick={() => { setModal(null); setDeleteReason('') }}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!deleteReason.trim()}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
