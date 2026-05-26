import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, Package, Building2, Phone } from 'lucide-react'
import SEO from '../components/SEO'

export default function CategoryPage() {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1, total: 0 })

  const loadCategory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/categories/${slug}`, { params: { page, limit: 20 } })
      setCategory(res.data.category)
      setProducts(res.data.category.products)
      setPagination({ pages: res.data.pages, total: res.data.total })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [slug, page])

  useEffect(() => {
    Promise.resolve().then(() => loadCategory())
  }, [loadCategory])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Загрузка...
      </div>
    )
  }

  if (!category) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Категория не найдена
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SEO title={category.name} description={`${category.name} — товары и услуги от B2B-поставщиков на NexaTrade. ${category.description || ''}`} />
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/products" className="hover:text-foreground hover:underline transition-colors">Каталог</Link>
        {category.parent && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-border" />
            <Link to={`/category/${category.parent.slug}`} className="hover:text-foreground hover:underline transition-colors">
              {category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-border" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {category.name}
          {category.parent && <span className="text-muted-foreground font-normal"> в {category.parent.name}</span>}
        </h1>
        <Badge variant="outline" className="border-border text-muted-foreground w-fit">
          {pagination.total} товаров
        </Badge>
      </div>

      {/* Subcategories */}
      {category.children?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {category.children.map(sub => (
            <Link key={sub.id} to={`/category/${sub.slug}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-muted hover:border-primary/30 transition-colors"
              >
                <TagIcon className="h-3.5 w-3.5 mr-1.5 text-primary" />
                {sub.name}
                <span className="ml-1.5 text-xs text-muted-foreground">({sub._count?.products || 0})</span>
              </Button>
            </Link>
          ))}
        </div>
      )}

      <Separator className="bg-border" />

      {/* Products */}
      {products.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-border mb-4" />
            <h3 className="text-lg font-semibold text-foreground">В этой категории пока нет товаров</h3>
            <p className="text-sm text-muted-foreground mt-1">Добавьте первый товар в этой категории</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map(product => (
            <Card
              key={product.id}
              className="border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all flex flex-col"
            >
              {/* Product image */}
              <div className="h-44 bg-muted flex items-center justify-center relative overflow-hidden group">
                {product.images?.[0] ? (
                  <Link to={`/product/${product.id}`} className="w-full h-full">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                ) : (
                  <Package className="h-10 w-10 text-border" />
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {product.isOpt && (
                    <Badge className="bg-primary/90 text-white border-0 text-[10px]">Опт</Badge>
                  )}
                  {product.isRetail && (
                    <Badge className="bg-amber-500/90 text-white border-0 text-[10px]">Розница</Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-4 flex flex-col flex-1">
                {/* Supplier */}
                <Link
                  to={`/company/${product.tenantId}`}
                  className="text-xs text-primary hover:underline font-medium flex items-center gap-1 mb-1.5"
                >
                  <Building2 className="h-3 w-3" />
                  {product.tenant?.name || 'Поставщик'}
                </Link>

                {/* Title */}
                <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors">
                  <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                </Link>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">
                  {product.description || 'Нет описания'}
                </p>

                {/* Stock badge */}
                <div className="mb-3">
                  <Badge
                    className={
                      product.stock > 0
                        ? 'bg-green-500/10 text-green-500 border-0 text-[10px]'
                        : 'bg-amber-500/10 text-amber-500 border-0 text-[10px]'
                    }
                  >
                    {product.stock > 0 ? 'В наличии' : 'Под заказ'}
                  </Badge>
                </div>

                {/* Price and CTA */}
                <div className="mt-auto pt-3 border-t border-border">
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-lg font-bold text-primary">
                      {product.price ? `${Number(product.price).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                    </span>
                    {product.price && (
                      <span className="text-xs text-muted-foreground">/{product.unit || 'шт.'}</span>
                    )}
                  </div>
                  <Link to={`/company/${product.tenantId}`}>
                    <Button
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                      <Phone className="h-3.5 w-3.5 mr-1.5" />
                      Связаться
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-border text-foreground hover:bg-muted disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p)}
                className={
                  p === page
                    ? 'bg-primary hover:bg-primary/90 text-white'
                    : 'border-border text-foreground hover:bg-muted'
                }
              >
                {p}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="border-border text-foreground hover:bg-muted disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function TagIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  )
}
