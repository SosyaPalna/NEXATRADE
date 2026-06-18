import { useEffect, useState } from 'react'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Building2, CheckCircle2, XCircle, Loader2, Eye
} from 'lucide-react'
import SEO from '../components/SEO'

const STATUS_MAP = {
  pending: { label: 'На проверке', className: 'bg-amber-500 text-white' },
  verified: { label: 'Верифицирована', className: 'bg-green-500 text-white' },
  rejected: { label: 'Отклонена', className: 'bg-red-500 text-white' },
}

export default function AdminVerifications() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await api.get('/verification/admin/list')
      setRequests(res.data)
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      await api.patch(`/verification/admin/${id}/approve`)
      setModalOpen(false)
      loadRequests()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      setRejectMode(true)
      return
    }
    setActionLoading(true)
    try {
      await api.patch(`/verification/admin/${id}/reject`, { reason: rejectReason.trim() })
      setModalOpen(false)
      setRejectMode(false)
      setRejectReason('')
      loadRequests()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const openModal = (req) => {
    setSelected(req)
    setRejectMode(false)
    setRejectReason('')
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <SEO title="Верификации" description="Управление заявками на верификацию компаний в админ-панели Торговый Хаб." noindex nofollow />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Верификации компаний</h1>
        <Badge variant="outline" className="border-border">{requests.length} заявок</Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Загрузка...
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-border mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Заявок пока нет</h3>
            <p className="text-sm text-muted-foreground mt-1">Когда компании подадут заявки на верификацию, они появятся здесь.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const status = STATUS_MAP[req.verificationStatus] || STATUS_MAP.pending
            return (
              <Card key={req.id} className="border-border hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{req.name}</h3>
                        <Badge className={status.className}>{status.label}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                        <p>ИНН: {req.inn} | ОГРН: {req.ogrn}</p>
                        {req.companyType && <p>Тип: {req.companyType}</p>}
                        {req.legalAddress && <p>Адрес: {req.legalAddress}</p>}
                        {req.directorName && <p>Руководитель: {req.directorName}</p>}
                      </div>
                      {req.rejectedReason && (
                        <p className="text-sm text-red-500 mt-1">Причина: {req.rejectedReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openModal(req)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Просмотр
                      </Button>
                      {req.verificationStatus === 'pending' && (
                        <>
                          <Button size="sm" className="bg-green-500 text-white hover:bg-green-600" onClick={() => handleApprove(req.id)} disabled={actionLoading}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Одобрить
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)} disabled={actionLoading}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Отклонить
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Заявка на верификацию</DialogTitle>
            <DialogDescription>{selected?.name}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground">ИНН:</div>
                <div>{selected.inn}</div>
                <div className="text-muted-foreground">ОГРН:</div>
                <div>{selected.ogrn}</div>
                {selected.kpp && <><div className="text-muted-foreground">КПП:</div><div>{selected.kpp}</div></>}
                <div className="text-muted-foreground">Тип:</div>
                <div>{selected.companyType || '—'}</div>
                <div className="text-muted-foreground">Адрес:</div>
                <div>{selected.legalAddress || '—'}</div>
                <div className="text-muted-foreground">Руководитель:</div>
                <div>{selected.directorName || '—'}</div>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-2">Документы:</p>
                <div className="grid grid-cols-3 gap-2">
                  {selected.verificationDocs?.map((doc, i) => (
                    <a key={i} href={doc} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={doc} alt={`Документ ${i + 1}`} className="w-full h-24 object-cover rounded border border-border hover:border-primary transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
              {selected.rejectedReason && (
                <div className="text-red-500">Причина отклонения: {selected.rejectedReason}</div>
              )}

              {selected?.verificationStatus === 'pending' && rejectMode && (
                <div className="space-y-2">
                  <Label htmlFor="reject-reason">Причина отклонения</Label>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Укажите причину отклонения заявки..."
                    rows={3}
                  />
                  {rejectReason.trim().length === 0 && (
                    <p className="text-xs text-red-500">Введите причину отклонения</p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selected?.verificationStatus === 'pending' && !rejectMode && (
              <>
                <Button variant="outline" onClick={() => setModalOpen(false)}>Закрыть</Button>
                <Button className="bg-green-500 text-white hover:bg-green-600" onClick={() => handleApprove(selected.id)} disabled={actionLoading}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Одобрить
                </Button>
                <Button variant="destructive" onClick={() => handleReject(selected.id)} disabled={actionLoading}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Отклонить
                </Button>
              </>
            )}
            {selected?.verificationStatus === 'pending' && rejectMode && (
              <>
                <Button variant="outline" onClick={() => setRejectMode(false)}>Отмена</Button>
                <Button variant="destructive" onClick={() => handleReject(selected.id)} disabled={actionLoading || !rejectReason.trim()}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Подтвердить отклонение
                </Button>
              </>
            )}
            {selected?.verificationStatus !== 'pending' && (
              <Button variant="outline" onClick={() => setModalOpen(false)}>Закрыть</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
