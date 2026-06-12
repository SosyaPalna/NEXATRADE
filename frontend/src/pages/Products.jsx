import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, uploadFile } from '../api'
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
import { Search, Package, Plus, SlidersHorizontal, X, Camera, Tag } from 'lucide-react'
import SEO from '../components/SEO'

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
    search: '', category: '', minPrice: '', maxPrice: '', inStock: false, city: localStorage.getItem('selectedCity') || ''
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

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'selectedCity') {
        setFilters(prev => ({ ...prev, city: e.newValue === 'Все города' ? '' : e.newValue }))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

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
    try {
      const url = await uploadFile('/uploads/product-image', file)
      setNewProduct(prev => ({ ...prev, images: [...prev.images, url] }))
    } catch {
      alert('Ошибка загрузки изображения')
    } finally {
      setUploading(false)
    }
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
      <SEO
        title="Каталог товаров"
        description="Каталог товаров и услуг от проверенных B2B-поставщиков на NexaTrade."
        keywords="каталог товаров, B2B каталог, оптовые товары, поставщики, закупки оптом, торговая площадка"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Каталог товаров — NexaTrade',
          description: 'Каталог товаров и услуг от проверенных B2B-поставщиков на NexaTrade.',
          url: typeof window !== 'undefined' ? window.location.href : 'https://nexatrade.ru/products',
          isPartOf: { '@type': 'WebSite', name: 'NexaTrade', url: 'https://nexatrade.ru' },
        }}
      />
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Каталог товаров и услуг</h1>
          <p className="text-sm text-muted-foreground mt-1">Найдено: <strong>{products.length}</strong> предложений</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3 bg-primary text-white hover:bg-primary/90 cursor-pointer shrink-0">
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
                <h3 className="text-sm font-semibold text-foreground">Основная информация</h3>
                <div className="space-y-2">
                  <Label htmlFor="p-name">Название товара *</Label>
                  <Input id="p-name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Например: Бетон М300" required className="border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-desc">Описание</Label>
                  <Textarea id="p-desc" rows={3} value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Опишите характеристики, преимущества, условия поставки" className="border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-category">Категория</Label>
                  <Select value={newProduct.categoryId} onValueChange={v => setNewProduct({ ...newProduct, categoryId: v })}>
                    <SelectTrigger className="border-border"><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Цены и наличие */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Цены и наличие</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="p-price">Цена (₽) *</Label>
                    <Input id="p-price" type="number" min="0" step="0.01" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0.00" required className="border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-unit">Единица измерения</Label>
                    <Select value={newProduct.unit} onValueChange={v => setNewProduct({ ...newProduct, unit: v })}>
                      <SelectTrigger className="border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {units.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-stock">Остаток на складе</Label>
                    <Input id="p-stock" type="number" min="0" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="0" className="border-border" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <Checkbox checked={newProduct.isOpt} onCheckedChange={v => setNewProduct({ ...newProduct, isOpt: v === true })} />
                    Оптовые продажи
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <Checkbox checked={newProduct.isRetail} onCheckedChange={v => setNewProduct({ ...newProduct, isRetail: v === true })} />
                    Розничные продажи
                  </label>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Фото */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Фотографии</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {newProduct.images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg border border-border overflow-hidden group">
                      <img src={img} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted cursor-pointer transition-colors">
                    <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">{uploading ? 'Загрузка...' : 'Добавить'}</span>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0])} disabled={uploading} hidden />
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" className="border-border" onClick={() => setShowAddForm(false)}>Отмена</Button>
                <Button type="submit" className="bg-primary text-white hover:bg-primary/90" disabled={uploading}>Добавить товар</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="bg-border" />

      {/* Фильтры */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 border-border" placeholder="Название товара..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div className="w-full md:w-52">
              <Select value={filters.category} onValueChange={v => setFilters({ ...filters, category: v })}>
                <SelectTrigger className="border-border">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground mr-1" />
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
              <Input className="border-border" type="number" placeholder="Цена от" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
            </div>
            <div className="w-full md:w-32">
              <Input className="border-border" type="number" placeholder="Цена до" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox id="in-stock" checked={filters.inStock} onCheckedChange={(checked) => setFilters({ ...filters, inStock: checked === true })} />
              <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">В наличии</Label>
            </div>
            <Button variant="outline" size="sm" className="border-border hover:bg-muted" onClick={() => setFilters({ search: '', category: '', minPrice: '', maxPrice: '', inStock: false, city: '' })}>
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Список товаров */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Загрузка товаров...</div>
      ) : products.length === 0 ? (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Товаров пока нет</h2>
            <p className="text-sm text-muted-foreground mt-1">Будьте первым — добавьте свой товар!</p>
            <Button className="mt-4 bg-primary text-white hover:bg-primary/90" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить товар
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <article key={product.id}>
              <Card className="border-border shadow-sm overflow-hidden hover:border-primary/30 hover:shadow-md transition-all h-full flex flex-col">
                <Link to={`/product/${product.id}`} className="h-44 bg-muted flex items-center justify-center shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </Link>
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex-1">
                    <Link to={`/company/${product.tenantId}`} className="text-xs text-primary hover:underline font-medium line-clamp-1">
                      {product.tenant?.name || 'Поставщик'}
                      {product.tenant?.city && ` · ${product.tenant.city}`}
                    </Link>
                    <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors block mt-1">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2">{product.name}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge className={product.stock > 0 ? 'bg-green-500/10 text-green-600 border-0 text-[10px]' : 'bg-amber-500/10 text-amber-600 border-0 text-[10px]'}>
                        {product.stock > 0 ? 'В наличии' : 'Под заказ'}
                      </Badge>
                      {product.isOpt && <Badge variant="outline" className="border-border text-[10px]">Опт</Badge>}
                      {product.isRetail && <Badge variant="outline" className="border-border text-[10px]">Розница</Badge>}
                    </div>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-primary">
                        {product.price ? `${Number(product.price).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                      </span>
                      <span className="text-xs text-muted-foreground">{product.unit || 'шт.'}</span>
                    </div>
                    <Button size="sm" className="w-full mt-2 bg-primary text-white hover:bg-primary/90" asChild>
                      <Link to={`/product/${product.id}`}>
                        Подробнее
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
