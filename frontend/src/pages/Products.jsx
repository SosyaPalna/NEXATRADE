import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, uploadFiles } from '../api'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
import { Package, Plus, SlidersHorizontal, X, Camera } from 'lucide-react'
import SEO from '../components/SEO'
import ProductCard from '../components/ProductCard'

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

const sortOptions = [
  { value: 'createdAt:desc', label: 'Сначала новые' },
  { value: 'createdAt:asc', label: 'Сначала старые' },
  { value: 'price:asc', label: 'Цена: по возрастанию' },
  { value: 'price:desc', label: 'Цена: по убыванию' },
  { value: 'viewCount:desc', label: 'Популярные' },
]

function getCategoryDepth(categories, categoryId) {
  let depth = 0
  let current = categories.find(c => c.id === categoryId)
  while (current?.parentId) {
    depth++
    current = categories.find(c => c.id === current.parentId)
  }
  return depth
}

function flattenCategories(categories) {
  if (!categories?.length) return []

  function buildTree(parentId = null) {
    return categories
      .filter(c => c.parentId === parentId || (parentId === null && !c.parentId))
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap(c => [c, ...buildTree(c.id)])
  }

  return buildTree().map(c => ({
    id: c.id,
    label: '— '.repeat(getCategoryDepth(categories, c.id)) + c.name
  }))
}

export default function Products() {
  const { isAuthenticated } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '', category: '', minPrice: '', maxPrice: '', inStock: false, city: localStorage.getItem('selectedCity') || ''
  })
  const [sort, setSort] = useState('createdAt:desc')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [searchParams] = useSearchParams()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', stock: '', unit: 'шт.',
    categoryId: '', isOpt: true, isRetail: false, images: []
  })
  const [uploading, setUploading] = useState(false)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const [sortBy, order] = sort.split(':')
      const res = await api.get('/products', {
        params: {
          ...filters,
          all: true,
          page,
          limit: 20,
          sortBy,
          order,
        }
      })
      setProducts(res.data.products || [])
      setPages(res.data.pages || 0)
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, sort, page])

  useEffect(() => {
    loadProducts()
    api.get('/categories/flat').then(res => setCategories(res.data)).catch(() => {})
  }, [loadProducts])

  useEffect(() => {
    const q = searchParams.get('search') || ''
    setFilters(prev => prev.search === q ? prev : { ...prev, search: q })
  }, [searchParams])

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'selectedCity') {
        setFilters(prev => ({ ...prev, city: e.newValue === 'Все города' ? '' : e.newValue }))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filters, sort])

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls = await uploadFiles('/uploads/product-images', Array.from(files))
      setNewProduct(prev => ({ ...prev, images: [...prev.images, ...urls] }))
    } catch {
      // Ошибка обрабатывается глобальным интерсептором api
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
    } catch {
      // Ошибка обрабатывается глобальным интерсептором api
    }
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Каталог товаров"
        description="Каталог товаров и услуг от проверенных B2B-поставщиков на Торговый Хаб."
        keywords="каталог товаров, B2B каталог, оптовые товары, поставщики, закупки оптом, торговая площадка"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Каталог товаров — Торговый Хаб',
          description: 'Каталог товаров и услуг от проверенных B2B-поставщиков на Торговый Хаб.',
          url: typeof window !== 'undefined' ? window.location.href : 'https://nexatrade.ru/products',
          isPartOf: { '@type': 'WebSite', name: 'Торговый Хаб', url: 'https://nexatrade.ru' },
        }}
      />
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Каталог товаров и услуг</h1>
          <p className="text-sm text-muted-foreground mt-1">Найдено: <strong>{products.length}</strong> предложений</p>
        </div>
        {isAuthenticated && (
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
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="Выберите категорию">
                        {flattenCategories(categories).find(o => o.id === newProduct.categoryId)?.label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {flattenCategories(categories).map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
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
                    <input type="file" accept="image/*" multiple onChange={e => handleImageUpload(e.target.files)} disabled={uploading} hidden />
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
        )}
      </div>

      <Separator className="bg-border" />

      {/* Фильтры */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-start">
            <div className="w-full md:w-52">
              <Select value={filters.category} onValueChange={v => setFilters({ ...filters, category: v })}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Все категории">
                    {filters.category ? flattenCategories(categories).find(o => o.id === filters.category)?.label : 'Все категории'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все категории</SelectItem>
                  {flattenCategories(categories).map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
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
            <div className="w-full md:w-48">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="border-border">
                  <SelectValue>{sortOptions.find(o => o.value === sort)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="border-border hover:bg-muted" onClick={() => { setFilters({ search: '', category: '', minPrice: '', maxPrice: '', inStock: false, city: '' }); setSort('createdAt:desc') }}>
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
            {isAuthenticated && (
            <Button className="mt-4 bg-primary text-white hover:bg-primary/90" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить товар
            </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Назад
          </Button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            let num = i + 1
            if (pages > 7) {
              const start = Math.max(1, Math.min(pages - 6, page - 3))
              num = start + i
            }
            return (
              <Button
                key={num}
                variant={num === page ? 'default' : 'outline'}
                size="sm"
                className={num === page ? 'bg-primary text-white' : 'border-border'}
                onClick={() => setPage(num)}
              >
                {num}
              </Button>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page >= pages}
          >
            Вперёд
          </Button>
        </div>
      )}
    </div>
  )
}
