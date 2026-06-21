import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, Package, Tag } from 'lucide-react'
import SEO from '../components/SEO'
import ProductCard from '../components/ProductCard'

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
      <SEO
        title={category.name}
        description={`${category.name} — товары и услуги от B2B-поставщиков на Торговый Хаб. ${category.description || ''}`}
        keywords={`${category.name}, B2B каталог, оптовые закупки, поставщики ${category.name}, товары оптом`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              name: `${category.name} — Торговый Хаб`,
              description: category.description || `${category.name} — товары и услуги от B2B-поставщиков на Торговый Хаб.`,
              url: typeof window !== 'undefined' ? window.location.href : `https://nexatrade.ru/category/${slug}`,
              isPartOf: { '@type': 'WebSite', name: 'Торговый Хаб', url: 'https://nexatrade.ru' },
              about: { '@type': 'Thing', name: category.name },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Категории товаров', item: 'https://nexatrade.ru/products' },
                ...(category.parent
                  ? [{ '@type': 'ListItem', position: 2, name: category.parent.name, item: `https://nexatrade.ru/category/${category.parent.slug}` }]
                  : []),
                { '@type': 'ListItem', position: category.parent ? 3 : 2, name: category.name, item: `https://nexatrade.ru/category/${slug}` },
              ],
            },
          ],
        }}
      />
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/products" className="hover:text-foreground hover:underline transition-colors">Категории товаров</Link>
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
                <Tag className="h-3.5 w-3.5 mr-1.5 text-primary" />
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
        <div className="flex flex-col gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
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

