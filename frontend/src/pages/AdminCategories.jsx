import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, FolderTree, Tag, Search, X } from 'lucide-react'
import SEO from '../components/SEO'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [flatCategories, setFlatCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', parentId: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get('/categories'),
        api.get('/categories/flat')
      ])
      setCategories(treeRes.data)
      setFlatCategories(flatRes.data)
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const openCreate = () => {
    setEditingCategory(null)
    setForm({ name: '', parentId: '' })
    setError('')
    setDialogOpen(true)
  }

  const openEdit = (cat) => {
    setEditingCategory(cat)
    setForm({ name: cat.name, parentId: cat.parentId || '' })
    setError('')
    setDialogOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        parentId: form.parentId || null
      }
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload)
      } else {
        await api.post('/categories', payload)
      }
      setDialogOpen(false)
      loadCategories()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/categories/${deleteId}`)
      setDeleteId(null)
      loadCategories()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления')
      setDeleteId(null)
    }
  }

  const filteredCategories = search.trim()
    ? flatCategories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : flatCategories

  const getParentName = (parentId) => {
    const parent = flatCategories.find(c => c.id === parentId)
    return parent ? parent.name : null
  }

  return (
    <div className="space-y-6">
      <SEO title="Категории" description="Управление категориями товаров в админ-панели Торговый Хаб." noindex nofollow />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Категории товаров</h1>
          <p className="text-sm text-muted-foreground">Управление категориями и подкатегориями</p>
        </div>
        <Button className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2 shrink-0" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Добавить категорию
        </Button>
      </div>

      <Separator className="bg-border" />

      {/* Фильтр */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 border-border"
            placeholder="Поиск категории..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Badge variant="outline" className="border-border">
          {filteredCategories.length} категорий
        </Badge>
      </div>

      {/* Таблица категорий */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            Список категорий
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">Загрузка...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Категории не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">Название</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Slug</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Родительская</TableHead>
                    <TableHead className="text-muted-foreground font-medium w-25">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map(cat => (
                    <TableRow key={cat.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{cat.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell>
                        {cat.parentId ? (
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            {getParentName(cat.parentId)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(cat)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(cat.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Дерево категорий */}
      {!search.trim() && categories.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" />
              Дерево категорий
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map(root => (
                <div key={root.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-foreground">{root.name}</div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(root)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(root.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {root.children && root.children.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 border-border space-y-1">
                      {root.children.map(child => (
                        <div key={child.id} className="flex items-center justify-between py-1">
                          <div className="text-sm text-muted-foreground">{child.name}</div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(child)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(child.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog create/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Редактировать категорию' : 'Новая категория'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Измените название и родительскую категорию' : 'Создайте новую категорию товаров'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Название *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Например: Строительные материалы"
                required
                className="border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-parent">Родительская категория</Label>
              <Select
                value={form.parentId}
                onValueChange={v => setForm({ ...form, parentId: v })}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Без родительской (корневая)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Без родительской (корневая)</SelectItem>
                  {flatCategories
                    .filter(c => c.id !== editingCategory?.id)
                    .map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" className="border-border" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/90" disabled={saving}>
                {saving ? 'Сохранение...' : (editingCategory ? 'Сохранить' : 'Создать')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Продукты, связанные с этой категорией, останутся без категории.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
