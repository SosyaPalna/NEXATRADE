import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Upload, CheckCircle2, XCircle, Clock, Loader2, FileText, FileImage } from 'lucide-react'

const STATUS_LABELS = {
  none: { text: 'Не верифицирована', variant: 'secondary', icon: Building2 },
  pending: { text: 'На проверке', variant: 'warning', icon: Clock },
  verified: { text: 'Верифицирована', variant: 'success', icon: CheckCircle2 },
  rejected: { text: 'Отклонена', variant: 'destructive', icon: XCircle },
}

export default function CompanyVerification() {
  const [status, setStatus] = useState('none')
  const [statusData, setStatusData] = useState(null)
  const [inn, setInn] = useState('')
  const [companyData, setCompanyData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: ввод ИНН, 2: подтверждение, 3: загрузка документов, 4: завершено
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get('/verification/status')
      setStatusData(res.data)
      setStatus(res.data?.verificationStatus || 'none')
      if (res.data?.inn) setInn(res.data.inn)
    } catch (err) {
      console.error('Ошибка загрузки статуса:', err)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleCheckInn = async () => {
    setError('')
    setSuccess('')
    if (!/^\d{10}$|^\d{12}$/.test(inn)) {
      setError('Введите корректный ИНН (10 или 12 цифр)')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/verification/check-inn', { inn })
      setCompanyData(res.data.data)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка проверки ИНН')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    setStep(3)
  }

  const handleUploadDoc = async (file) => {
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const res = await api.post('/products/upload-image', { image: reader.result })
        setDocs(prev => [...prev, res.data.url])
      } catch {
        setError('Ошибка загрузки документа')
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeDoc = (index) => {
    setDocs(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError('')
    if (docs.length === 0) {
      setError('Загрузите хотя бы один документ (выписку из ЕГРЮЛ/ЕГРИП)')
      return
    }
    setLoading(true)
    try {
      await api.post('/verification/submit', {
        inn: companyData.inn,
        ogrn: companyData.ogrn,
        kpp: companyData.kpp,
        companyType: companyData.type === 'LEGAL' ? 'ООО/АО' : 'ИП',
        legalAddress: companyData.address,
        directorName: companyData.director,
        verificationDocs: docs,
      })
      setSuccess('Заявка на верификацию отправлена! Ожидайте проверки администратора.')
      setStatus('pending')
      setStep(4)
      loadStatus()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки заявки')
    } finally {
      setLoading(false)
    }
  }

  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.none
  const StatusIcon = statusInfo.icon

  // Если уже подана заявка или верифицировано — показываем статус
  if (status !== 'none' && step < 4) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Верификация компании
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-lg border p-4 flex items-start gap-4 ${
            status === 'verified' ? 'bg-green-50 border-green-200' :
            status === 'rejected' ? 'bg-red-50 border-red-200' :
            status === 'pending' ? 'bg-amber-50 border-amber-200' : 'bg-muted/40'
          }`}>
            <div className={`mt-0.5 p-2 rounded-full ${
              status === 'verified' ? 'bg-green-100 text-green-600' :
              status === 'rejected' ? 'bg-red-100 text-red-600' :
              status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground'
            }`}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
              </div>
              {statusData?.inn && (
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">ИНН:</span> {statusData.inn}</p>
                  {statusData.ogrn && <p><span className="text-muted-foreground">ОГРН:</span> {statusData.ogrn}</p>}
                  {statusData.companyType && <p><span className="text-muted-foreground">Тип:</span> {statusData.companyType}</p>}
                  {statusData.legalAddress && <p><span className="text-muted-foreground">Адрес:</span> {statusData.legalAddress}</p>}
                </div>
              )}
            </div>
          </div>

          {status === 'rejected' && statusData?.rejectedReason && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>Причина отклонения: {statusData.rejectedReason}</AlertDescription>
            </Alert>
          )}

          {status === 'rejected' && (
            <Button onClick={() => { setStatus('none'); setStep(1); setDocs([]); setError(''); }}>
              Подать заявку повторно
            </Button>
          )}

          {status === 'verified' && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3 border border-green-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Ваша компания верифицирована. Вы получаете отметку подтверждённого участника на площадке.</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Верификация компании
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-500/10 text-green-600 border-green-500/20">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Введите ИНН вашей компании или ИП. Мы проверим его через базу ФНС и подтянем реквизиты.
            </p>
            <div className="space-y-2">
              <Label htmlFor="inn">ИНН организации</Label>
              <div className="flex gap-2">
                <Input
                  id="inn"
                  value={inn}
                  onChange={e => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="1234567890"
                  maxLength={12}
                  className="border-border"
                />
                <Button onClick={handleCheckInn} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Проверить'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && companyData && (
          <div className="space-y-4">
            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription>
                Компания найдена в базе ФНС. Проверьте данные и подтвердите.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Название:</span> {companyData.name}</p>
              <p><span className="text-muted-foreground">ИНН:</span> {companyData.inn}</p>
              <p><span className="text-muted-foreground">ОГРН:</span> {companyData.ogrn}</p>
              {companyData.kpp && <p><span className="text-muted-foreground">КПП:</span> {companyData.kpp}</p>}
              <p><span className="text-muted-foreground">Тип:</span> {companyData.type === 'LEGAL' ? 'Юридическое лицо (ООО/АО)' : 'Индивидуальный предприниматель'}</p>
              <p><span className="text-muted-foreground">Адрес:</span> {companyData.address}</p>
              {companyData.director && (
                <p><span className="text-muted-foreground">Руководитель:</span> {companyData.director} {companyData.directorPost && `(${companyData.directorPost})`}</p>
              )}
              <p><span className="text-muted-foreground">Статус:</span> {companyData.status === 'ACTIVE' ? 'Действующая' : companyData.status}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Назад</Button>
              <Button onClick={handleConfirm}>Да, это моя компания</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Загрузите выписку из ЕГРЮЛ (для ООО/АО) или ЕГРИП (для ИП), не старше 30 дней.
              Допустимые форматы: JPG, PNG, PDF.
            </p>

            <div className="space-y-2">
              <Label>Документы</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {docs.map((doc, i) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc)
                  const isPdf = /\.pdf$/i.test(doc)
                  return (
                    <div key={i} className="relative aspect-square rounded-lg border border-border overflow-hidden group bg-muted flex flex-col items-center justify-center">
                      {isImage ? (
                        <img src={doc} alt={`Документ ${i + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center">
                          {isPdf ? <FileText className="h-8 w-8 text-red-500 mb-1" /> : <FileText className="h-8 w-8 text-primary mb-1" />}
                          <span className="text-[10px] text-muted-foreground uppercase">{isPdf ? 'PDF' : 'Файл'}</span>
                          <a href={doc} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline mt-1">Открыть</a>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
                <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted cursor-pointer transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">{uploading ? 'Загрузка...' : 'Добавить'}</span>
                  <input type="file" accept="image/*,.pdf" onChange={e => handleUploadDoc(e.target.files[0])} disabled={uploading} hidden />
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Назад</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Отправить на проверку'}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Заявка отправлена!</h3>
            <p className="text-sm text-muted-foreground">
              Администратор проверит ваши документы и примет решение в ближайшее время.
            </p>
            <Button variant="outline" onClick={loadStatus}>Обновить статус</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
