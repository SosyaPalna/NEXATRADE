import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Package, Plus, SlidersHorizontal, Phone, X, Camera, Tag } from 'lucide-react'

const units = [
  { value: 'шт.', label: 'Штуки' },
  { value: 'кг', label: 'Килограммы' },
  { value: 'т', label: 'Тонны' },
  { value: 'м', label: 'Метры' },
  { value: 'м2', label: 'М²' },
  { value: 'м3', label: 'М³' },
  { value: 'л', label: 'Литры' },
  { value: 'упак', label: 'Упаковки' },
  { value: 'комплект', label: 'Комплекты' },
  { value: 'паллет', label: 'Паллеты' },
]

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '', category: '', minPrice: '', maxPrice: '', inStock: false
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', stock: '', unit: 'шт.',
    categoryId: '', isOpt: true, isRetail: false, images: []
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadProducts()
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {})
  }, [filters])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/products', { params: { ...filters, all: true } })
      setProducts(res.data)
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file) => {
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const res = await api.post('/products/upload-image', { image: reader.result })
        setNewProduct(prev => ({ ...prev, images: [...prev.images, res.data.url] }))
      } catch {
        alert('Ошибка загрузки изображения')
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index) => {
    setNewProduct(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      await api.post('/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0
      })
      setNewProduct({
        name: '', description: '', price: '', stock: '', unit: 'шт.',
        categoryId: '', isOpt: true, isRetail: false, images: []
      })
      setShowAddForm(false)
      loadProducts()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка добавления товара')
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Каталог товаров и услуг</h1>
          <p className="text-sm text-[#64748b] mt-1">Найдено: <strong>{products.length}</strong> предложений</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3 bg-[#005BAC] text-white hover:bg-[#004a8d] cursor-pointer shrink-0">
            <Plus className="h-4 w-4" />
            Добавить товар
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Новый товар</DialogTitle>
              <DialogDescription>Заполните информацию о товаре или услуге</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-5 py-2">
              {/* Основная информация */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[#0f172a]">Основная информация</h4>
                <div className="space-y-2">
                  <Label htmlFor="p-name">Название товара *</Label>
                  <Input id="p-name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Например: Бетон М300" required className="border-[#e2e8f0]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-desc">Описание</Label>
                  <Textarea id="p-desc" rows={3} value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Опишите характеристики, преимущества, условия поставки" className="border-[#e2e8f0]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-category">Категория</Label>
                  <Select value={newProduct.categoryId} onValueChange={v => setNewProduct({ ...newProduct, categoryId: v })}>
                    <SelectTrigger className="border-[#e2e8f0]"><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-[#e2e8f0]" />

              {/* Цены и наличие */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[#0f172a]">Цены и наличие</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="p-price">Цена (₽) *</Label>
                    <Input id="p-price" type="number" min="0" step="0.01" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0.00" required className="border-[#e2e8f0]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-unit">Единица измерения</Label>
                    <Select value={newProduct.unit} onValueChange={v => setNewProduct({ ...newProduct, unit: v })}>
                      <SelectTrigger className="border-[#e2e8f0]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {units.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-stock">Остаток на складе</Label>
                    <Input id="p-stock" type="number" min="0" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="0" className="border-[#e2e8f0]" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#0f172a] cursor-pointer">
                    <Checkbox checked={newProduct.isOpt} onCheckedChange={v => setNewProduct({ ...newProduct, isOpt: v === true })} />
                    Оптовые продажи
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#0f172a] cursor-pointer">
                    <Checkbox checked={newProduct.isRetail} onCheckedChange={v => setNewProduct({ ...newProduct, isRetail: v === true })} />
                    Розничные продажи
                  </label>
                </div>
              </div>

              <Separator className="bg-[#e2e8f0]" />

              {/* Фото */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[#0f172a]">Фотографии</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {newProduct.images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg border border-[#e2e8f0] overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-[#ef4444] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-[#e2e8f0] hover:border-[#005BAC] hover:bg-[#f8fafc] cursor-pointer transition-colors">
                    <Camera className="h-6 w-6 text-[#64748b] mb-1" />
                    <span className="text-xs text-[#64748b]">{uploading ? 'Загрузка...' : 'Добавить'}</span>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0])} disabled={uploading} hidden />
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" className="border-[#e2e8f0]" onClick={() => setShowAddForm(false)}>Отмена</Button>
                <Button type="submit" className="bg-[#005BAC] text-white hover:bg-[#004a8d]" disabled={uploading}>Добавить товар</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="bg-[#e2e8f0]" />

      {/* Фильтры */}
      <Card className="border-[#e2e8f0] shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
              <Input className="pl-9 border-[#e2e8f0]" placeholder="Название товара..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div className="w-full md:w-52">
              <Select value={filters.category} onValueChange={v => setFilters({ ...filters, category: v })}>
                <SelectTrigger className="border-[#e2e8f0]">
                  <Tag className="h-3.5 w-3.5 text-[#64748b] mr-1" />
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все категории</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-32">
              <Input className="border-[#e2e8f0]" type="number" placeholder="Цена от" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
            </div>
            <div className="w-full md:w-32">
              <Input className="border-[#e2e8f0]" type="number" placeholder="Цена до" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox id="in-stock" checked={filters.inStock} onCheckedChange={(checked) => setFilters({ ...filters, inStock: checked === true })} />
              <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">В наличии</Label>
            </div>
            <Button variant="outline" size="sm" className="border-[#e2e8f0] hover:bg-[#f1f5f9]" onClick={() => setFilters({ search: '', category: '', minPrice: '', maxPrice: '', inStock: false })}>
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Список товаров */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-[#64748b]">Загрузка товаров...</div>
      ) : products.length === 0 ? (
        <Card className="border-[#e2e8f0] shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-[#cbd5e1] mb-4" />
            <h3 className="text-lg font-semibold text-[#0f172a]">Товаров пока нет</h3>
            <p className="text-sm text-[#64748b] mt-1">Будьте первым — добавьте свой товар!</p>
            <Button className="mt-4 bg-[#005BAC] text-white hover:bg-[#004a8d]" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить товар
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <Card key={product.id} className="border-[#e2e8f0] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-32 h-32 bg-[#f1f5f9] flex items-center justify-center shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-[#cbd5e1]" />
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                      <Link to={`/company/${product.tenantId}`} className="text-sm text-[#005BAC] hover:underline font-medium">
                        {product.tenant?.name || 'Поставщик'}
                      </Link>
                      <h3 className="text-lg font-bold text-[#0f172a] mt-1">{product.name}</h3>
                      <p className="text-sm text-[#64748b] mt-1 line-clamp-2">{product.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={product.stock > 0 ? 'bg-[#22c55e] text-white hover:bg-[#22c55e]' : 'bg-[#f59e0b] text-white hover:bg-[#f59e0b]'}>
                          {product.stock > 0 ? 'В наличии' : 'Под заказ'}
                        </Badge>
                        {product.isOpt && <Badge variant="outline" className="border-[#e2e8f0]">Опт</Badge>}
                        {product.isRetail && <Badge variant="outline" className="border-[#e2e8f0]">Розница</Badge>}
                        {product.category?.name && <Badge variant="outline" className="border-[#e2e8f0]">{product.category.name}</Badge>}
                      </div>
                    </div>
                    <div className="sm:w-48 shrink-0 flex flex-col justify-between border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4">
                      <div>
                        <div className="text-2xl font-bold text-[#005BAC]">
                          {product.price ? `${Number(product.price).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                        </div>
                        <div className="text-xs text-[#64748b] mt-1">{product.unit || 'шт.'}</div>
                      </div>
                      <Button size="sm" className="w-full mt-3 bg-[#005BAC] text-white hover:bg-[#004a8d]" asChild>
                        <Link to={`/company/${product.tenantId}`}>
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          Связаться
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
