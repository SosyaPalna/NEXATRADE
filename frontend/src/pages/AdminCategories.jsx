import { useEffect, useState } from 'react'
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

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
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
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Категории товаров</h1>
          <p className="text-sm text-[#64748b]">Управление категориями и подкатегориями</p>
        </div>
        <Button className="bg-[#005BAC] text-white hover:bg-[#004a8d] flex items-center gap-2 shrink-0" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Добавить категорию
        </Button>
      </div>

      <Separator className="bg-[#e2e8f0]" />

      {/* Фильтр */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
          <Input
            className="pl-9 border-[#e2e8f0]"
            placeholder="Поиск категории..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Badge variant="outline" className="border-[#e2e8f0]">
          {filteredCategories.length} категорий
        </Badge>
      </div>

      {/* Таблица категорий */}
      <Card className="border-[#e2e8f0] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#0f172a] flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-[#005BAC]" />
            Список категорий
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[#64748b]">Загрузка...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="h-10 w-10 text-[#cbd5e1] mb-3" />
              <p className="text-[#64748b]">Категории не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e2e8f0] hover:bg-transparent">
                    <TableHead className="text-[#64748b] font-medium">Название</TableHead>
                    <TableHead className="text-[#64748b] font-medium">Slug</TableHead>
                    <TableHead className="text-[#64748b] font-medium">Родительская</TableHead>
                    <TableHead className="text-[#64748b] font-medium w-[100px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map(cat => (
                    <TableRow key={cat.id} className="border-[#e2e8f0]">
                      <TableCell className="font-medium text-[#0f172a]">{cat.name}</TableCell>
                      <TableCell className="text-sm text-[#64748b]">{cat.slug}</TableCell>
                      <TableCell>
                        {cat.parentId ? (
                          <Badge variant="outline" className="border-[#e2e8f0] text-[#64748b]">
                            {getParentName(cat.parentId)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-[#94a3b8]">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#005BAC]" onClick={() => openEdit(cat)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#ef4444]" onClick={() => setDeleteId(cat.id)}>
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
        <Card className="border-[#e2e8f0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#0f172a] flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-[#005BAC]" />
              Дерево категорий
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map(root => (
                <div key={root.id} className="border border-[#e2e8f0] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[#0f172a]">{root.name}</div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#64748b] hover:text-[#005BAC]" onClick={() => openEdit(root)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#64748b] hover:text-[#ef4444]" onClick={() => setDeleteId(root.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {root.children && root.children.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 border-[#e2e8f0] space-y-1">
                      {root.children.map(child => (
                        <div key={child.id} className="flex items-center justify-between py-1">
                          <div className="text-sm text-[#64748b]">{child.name}</div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#64748b] hover:text-[#005BAC]" onClick={() => openEdit(child)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#64748b] hover:text-[#ef4444]" onClick={() => setDeleteId(child.id)}>
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
                className="border-[#e2e8f0]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-parent">Родительская категория</Label>
              <Select
                value={form.parentId}
                onValueChange={v => setForm({ ...form, parentId: v })}
              >
                <SelectTrigger className="border-[#e2e8f0]">
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
              <div className="bg-[#fee2e2] text-[#ef4444] border border-[#fecaca] rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" className="border-[#e2e8f0]" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button type="submit" className="bg-[#005BAC] text-white hover:bg-[#004a8d]" disabled={saving}>
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
            <AlertDialogAction onClick={handleDelete} className="bg-[#ef4444] text-white hover:bg-[#dc2626]">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
