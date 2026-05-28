import { useState, useCallback } from 'react'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Flag, X, Upload, ImageIcon, AlertCircle } from 'lucide-react'

const REASONS = [
  { value: 'spam', label: 'Спам' },
  { value: 'fraud', label: 'Мошенничество' },
  { value: 'misleading', label: 'Недостоверная информация' },
  { value: 'inappropriate', label: 'Неприемлемый контент' },
  { value: 'rights', label: 'Нарушение прав' },
  { value: 'other', label: 'Другое' },
]

export default function ReportButton({ type, targetId, targetName, targetLink, variant = 'outline', size = 'sm' }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [screenshots, setScreenshots] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const reset = useCallback(() => {
    setReason('')
    setDescription('')
    setScreenshots([])
    setError('')
    setSuccess(false)
  }, [])

  const handleClose = () => {
    setOpen(false)
    setTimeout(reset, 200)
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')

    try {
      const newScreenshots = []
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const url = await fileToBase64(file)
        // Сжимаем перед отправкой
        const compressed = await compressImage(url, 1200, 0.7)
        const res = await api.post('/reports/upload-screenshot', { image: compressed })
        newScreenshots.push(res.data.url)
      }
      setScreenshots(prev => [...prev, ...newScreenshots])
    } catch (err) {
      setError('Ошибка загрузки скриншотов')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) {
      setError('Выберите причину жалобы')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.post('/reports', {
        type,
        targetId,
        targetName: targetName || targetId,
        targetLink: targetLink || window.location.href,
        reason: REASONS.find(r => r.value === reason)?.label || reason,
        description: description || null,
        screenshots,
      })
      setSuccess(true)
      setTimeout(handleClose, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки жалобы')
    } finally {
      setSubmitting(false)
    }
  }

  const removeScreenshot = (idx) => {
    setScreenshots(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Flag className="h-4 w-4" />
        Пожаловаться
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(v) }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-destructive" />
              Жалоба
            </DialogTitle>
            <DialogDescription>
              {targetName ? (
                <span className="line-clamp-1">На: <span className="font-medium text-foreground">{targetName}</span></span>
              ) : (
                'Опишите проблему, и мы её рассмотрим'
              )}
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-8 text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Flag className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-foreground">Жалоба отправлена</p>
              <p className="text-xs text-muted-foreground">Администратор рассмотрит её в ближайшее время</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-3 py-2 text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Причина</label>
                <div className="flex flex-wrap gap-2">
                  {REASONS.map(r => (
                    <Badge
                      key={r.value}
                      variant={reason === r.value ? 'default' : 'outline'}
                      className={`cursor-pointer select-none ${reason === r.value ? 'bg-primary text-white' : 'border-border hover:bg-muted'}`}
                      onClick={() => setReason(r.value)}
                    >
                      {r.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  placeholder="Опишите ситуацию подробнее..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="border-border resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Скриншоты ({screenshots.length})</label>
                <div className="flex flex-wrap gap-2">
                  {screenshots.map((src, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-border group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 rounded-md border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground mb-0.5" />
                    <span className="text-[10px] text-muted-foreground">{uploading ? '...' : 'Добавить'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      disabled={uploading}
                      hidden
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" className="border-border" onClick={handleClose}>
                  Отмена
                </Button>
                <Button type="submit" size="sm" className="bg-destructive text-white hover:bg-destructive/90" disabled={submitting || !reason}>
                  {submitting ? 'Отправка...' : 'Отправить жалобу'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function compressImage(base64, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = base64
  })
}
