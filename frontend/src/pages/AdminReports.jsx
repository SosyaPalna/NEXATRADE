import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Flag } from 'lucide-react'
import SEO from '../components/SEO'

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1 })
  const [error, setError] = useState('')

  useEffect(() => { loadReports() }, [page, statusFilter, typeFilter])

  const loadReports = async () => {
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
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/reports/${id}`, { status })
      loadReports()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка')
    }
  }

  const statusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="border-amber-500 text-amber-500">В ожидании</Badge>
      case 'resolved': return <Badge className="bg-green-500 text-white hover:bg-green-500">Решена</Badge>
      case 'dismissed': return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Отклонена</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const typeLabel = (type) => {
    switch (type) {
      case 'message': return 'Сообщение'
      case 'user': return 'Пользователь'
      case 'product': return 'Товар'
      case 'rfq': return 'Заявка'
      default: return type
    }
  }

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
            <SelectItem value="resolved">Решены</SelectItem>
            <SelectItem value="dismissed">Отклонены</SelectItem>
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
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-[140px]">Действия</th>
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
                    <td className="px-4 py-3 text-foreground font-mono text-xs">{report.targetId.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-foreground">{report.reason}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{report.description || '—'}</td>
                    <td className="px-4 py-3">{statusBadge(report.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      {report.status === 'pending' && (
                        <div className="flex items-center gap-1">
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
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                            title="Отклонить"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
    </div>
  )
}
