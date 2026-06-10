import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, Building2, ArrowLeft, ShoppingCart, MessageCircle, Phone, Globe, Mail } from 'lucide-react'
import SEO from '../components/SEO'
import Chat from '../components/Chat'
import ReportButton from '../components/ReportButton'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTenantId, setCurrentTenantId] = useState(null)

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setCurrentTenantId(res.data.tenantId))
      .catch(() => {})

    api.get(`/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Загрузка...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
        <Package className="h-12 w-12 opacity-30" />
        <p>Товар не найден</p>
        <Button variant="outline" className="border-border hover:bg-muted" asChild>
          <Link to="/products">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Вернуться в каталог
          </Link>
        </Button>
      </div>
    )
  }

  const seller = product.tenant
  const isOwner = currentTenantId === product.tenantId

  return (
    <div className="space-y-6">
      <SEO
        title={`${product.name} — купить оптом`}
        description={product.description?.slice(0, 160) || `Товар ${product.name} от поставщика ${seller?.name || ''}`}
        keywords={`${product.name}, купить оптом, ${product.category?.name || ''}, B2B поставщики, оптовые закупки`}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Product',
              name: product.name,
              description: product.description || `Товар ${product.name} от поставщика ${seller?.name || ''}`,
              image: product.images?.[0] || undefined,
              sku: product.id,
              brand: seller?.name ? { '@type': 'Brand', name: seller.name } : undefined,
              offers: {
                '@type': 'Offer',
                url: typeof window !== 'undefined' ? window.location.href : `https://nexatrade.ru/product/${product.id}`,
                priceCurrency: 'RUB',
                price: product.price?.toString() || undefined,
                availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
                seller: seller?.name
                  ? { '@type': 'Organization', name: seller.name, url: `https://nexatrade.ru/company/${seller.id}` }
                  : undefined,
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Каталог', item: 'https://nexatrade.ru/products' },
                ...(product.category?.slug
                  ? [{ '@type': 'ListItem', position: 2, name: product.category.name, item: `https://nexatrade.ru/category/${product.category.slug}` }]
                  : []),
                { '@type': 'ListItem', position: product.category?.slug ? 3 : 2, name: product.name, item: `https://nexatrade.ru/product/${product.id}` },
              ],
            },
          ],
        }}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/products" className="hover:text-foreground hover:underline transition-colors">Каталог</Link>
        {product.category && (
          <>
            <span className="text-border">/</span>
            <Link to={`/category/${product.category.slug}`} className="hover:text-foreground hover:underline transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span className="text-border">/</span>
        <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-md">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка — изображение и основная инфа */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Изображение */}
              <div className="bg-muted/30 flex items-center justify-center p-6 min-h-[300px]">
                {product.images?.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="max-w-full max-h-[300px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-16 w-16 opacity-30" />
                    <span className="text-sm">Нет изображения</span>
                  </div>
                )}
              </div>

              {/* Информация */}
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                  <div className="flex flex-wrap gap-2">
                    {product.stock > 0 ? (
                      <Badge className="bg-green-500 text-white hover:bg-green-500">В наличии</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-600">Под заказ</Badge>
                    )}
                    {product.isOpt && <Badge variant="outline" className="border-border">Опт</Badge>}
                    {product.isRetail && <Badge variant="outline" className="border-border">Розница</Badge>}
                    {product.category && (
                      <Badge variant="outline" className="border-border">
                        {product.category.name}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-3xl font-bold text-primary">
                  {product.price?.toLocaleString('ru-RU')} ₽
                  <span className="text-base font-normal text-muted-foreground"> / {product.unit}</span>
                </div>

                {product.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                )}

                <Separator className="bg-border" />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Поставщик</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {seller?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <Link to={`/company/${seller?.id}`} className="text-sm font-medium text-foreground hover:text-primary hover:underline">
                        {seller?.name || 'Неизвестный поставщик'}
                      </Link>
                      <p className="text-xs text-muted-foreground">{seller?.role === 'seller' ? 'Поставщик' : 'Покупатель'}</p>
                    </div>
                  </div>
                </div>

                {!isOwner && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {currentTenantId ? (
                      <Button
                        className="bg-primary text-white hover:bg-primary/90 gap-2"
                        onClick={() => document.getElementById('product-chat')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Написать поставщику
                      </Button>
                    ) : (
                      <Button className="bg-primary text-white hover:bg-primary/90 gap-2" asChild>
                        <Link to="/login">
                          <ShoppingCart className="h-4 w-4" />
                          Войти, чтобы оформить заказ
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" className="border-border hover:bg-muted gap-2" asChild>
                      <Link to={`/company/${seller?.id}`}>
                        <Building2 className="h-4 w-4" />
                        Профиль компании
                      </Link>
                    </Button>
                    <ReportButton
                      type="product"
                      targetId={product.id}
                      targetName={product.name}
                      targetLink={`/product/${product.id}`}
                    />
                  </div>
                )}
              </CardContent>
            </div>
          </Card>

          {/* Дополнительная информация о поставщике */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">О поставщике</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {seller?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{seller.phone}</span>
                  </div>
                )}
                {seller?.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <a href={seller.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">{seller.website}</a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Перейдите в профиль компании для связи</span>
                </div>
              </div>
              {seller?.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{seller.description}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка — чат */}
        <div id="product-chat" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Чат с поставщиком</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isOwner
                  ? 'Покупатели могут задать вопросы по этому товару.'
                  : 'Задайте вопрос поставщику напрямую в приватном чате.'}
              </p>
            </CardContent>
          </Card>

          {currentTenantId ? (
            <Chat
              roomType="product"
              roomId={product.id}
              currentTenantId={currentTenantId}
              title={`Чат: ${product.name.slice(0, 30)}${product.name.length > 30 ? '…' : ''}`}
            />
          ) : (
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Войдите или зарегистрируйтесь, чтобы написать поставщику</p>
                <Button className="bg-primary text-white hover:bg-primary/90 w-full" asChild>
                  <Link to="/login">Войти</Link>
                </Button>
                <Button variant="outline" className="border-border hover:bg-muted w-full" asChild>
                  <Link to="/register">Регистрация</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
