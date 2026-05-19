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
      case 'pending': return <Badge variant="outline" className="border-[#f59e0b] text-[#f59e0b]">В ожидании</Badge>
      case 'resolved': return <Badge className="bg-[#22c55e] text-white hover:bg-[#22c55e]">Решена</Badge>
      case 'dismissed': return <Badge variant="outline" className="border-[#64748b] text-[#64748b]">Отклонена</Badge>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#0f172a]">Жалобы</h2>
        <span className="text-sm text-[#64748b]">Всего: {reports.length}</span>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-[#fee2e2] text-[#ef4444] border-[#fecaca]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px] border-[#e2e8f0]">
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
          <SelectTrigger className="w-[180px] border-[#e2e8f0]">
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

      <Card className="border border-[#e2e8f0] bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="text-left px-4 py-3 font-semibold text-[#64748b]">Тип</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#64748b]">Цель</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#64748b]">Причина</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#64748b]">Описание</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#64748b]">Статус</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#64748b]">Дата</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#64748b] w-[140px]">Действия</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-[#e2e8f0] text-[#0f172a]">
                        {typeLabel(report.type)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#0f172a] font-mono text-xs">{report.targetId.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-[#0f172a]">{report.reason}</td>
                    <td className="px-4 py-3 text-[#64748b] max-w-[200px] truncate">{report.description || '—'}</td>
                    <td className="px-4 py-3">{statusBadge(report.status)}</td>
                    <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      {report.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#22c55e] hover:text-[#16a34a]"
                            onClick={() => handleUpdateStatus(report.id, 'resolved')}
                            title="Решить"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#64748b] hover:text-[#ef4444]"
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
                    <td colSpan={7} className="px-4 py-12 text-center text-[#64748b]">
                      <Flag className="h-8 w-8 mx-auto mb-2 text-[#e2e8f0]" />
                      Жалоб не найдено
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#64748b]">Загрузка...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="border-[#e2e8f0]" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-[#64748b]">Стр. {page} из {pagination.pages}</span>
          <Button variant="outline" size="sm" className="border-[#e2e8f0]" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
