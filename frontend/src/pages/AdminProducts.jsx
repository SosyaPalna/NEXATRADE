import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, ChevronLeft, ChevronRight, Trash2, AlertCircle, ExternalLink } from 'lucide-react'
import SEO from '../components/SEO'
import { Textarea } from '@/components/ui/textarea'

export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1 })
  const [modal, setModal] = useState(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [error, setError] = useState('')

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/products', { params: { search, page, limit: 20 } })
      setProducts(res.data.products)
      setPagination({ pages: res.data.pages })
    } catch {
      setError('Ошибка загрузки товаров')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { loadProducts() }, [loadProducts])

  const openDeleteModal = (product) => { setModal(product); setDeleteReason('') }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/products/${modal.id}`, { data: { reason: deleteReason } })
      setModal(null)
      setDeleteReason('')
      loadProducts()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления')
    }
  }

  return (
    <div className="space-y-6">
      <SEO title="Товары" description="Управление товарами в админ-панели Торговый Хаб." noindex nofollow />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Управление товарами</h1>
        <span className="text-sm text-muted-foreground">Всего: {products.length}</span>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder="Поиск по названию или поставщику..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="pl-9 border-border"
        />
      </div>

      <Card className="border border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Товар</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Поставщик</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Цена</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Наличие</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Дата</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-30">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">Нет</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground">{product.name}</div>
                          <div className="text-muted-foreground text-xs">{product.category?.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{product.tenant?.name || '—'}</td>
                    <td className="px-4 py-3 text-foreground">
                      {product.price ? `${Number(product.price).toLocaleString('ru-RU')} ₽` : '—'}
                      <span className="text-muted-foreground text-xs"> / {product.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={product.stock > 0 ? 'bg-green-500/10 text-green-600 border-0 text-xs' : 'bg-amber-500/10 text-amber-600 border-0 text-xs'}>
                        {product.stock > 0 ? 'В наличии' : 'Под заказ'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(product.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => openDeleteModal(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Товаров не найдено
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
          <Button variant="outline" size="sm" className="border-border" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Стр. {page} из {pagination.pages}</span>
          <Button variant="outline" size="sm" className="border-border" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={!!modal} onOpenChange={() => { setModal(null); setDeleteReason('') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить товар</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить товар «{modal?.name}»? Владельцу будет отправлено уведомление.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="delete-reason">Причина удаления</Label>
            <Textarea
              id="delete-reason"
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="Укажите причину удаления товара..."
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
