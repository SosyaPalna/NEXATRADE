import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Package, Building2, ArrowLeft, ShoppingCart, MessageCircle,
  Phone, Globe, MapPin, Truck, CreditCard, CheckCircle2,
  ShieldCheck, Eye
} from 'lucide-react'
import SEO from '../components/SEO'
import Chat from '../components/Chat'
import ReportButton from '../components/ReportButton'
import ImageGallery from '../components/ImageGallery'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTenantId, setCurrentTenantId] = useState(null)
  const [showPhone, setShowPhone] = useState(false)

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

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '—'
    return `${Number(price).toLocaleString('ru-RU')} ₽`
  }

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
                { '@type': 'ListItem', position: 1, name: 'Категории товаров', item: 'https://nexatrade.ru/products' },
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
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground">
        <Link to="/products" className="hover:text-foreground hover:underline transition-colors shrink-0">Каталог</Link>
        {product.category && (
          <>
            <span className="text-border shrink-0">/</span>
            <Link to={`/category/${product.category.slug}`} className="hover:text-foreground hover:underline transition-colors truncate max-w-[120px] sm:max-w-[200px]">
              {product.category.name}
            </Link>
          </>
        )}
        <span className="text-border shrink-0">/</span>
        <span className="text-foreground font-medium truncate max-w-[140px] sm:max-w-md">{product.name}</span>
      </nav>

      {/* Верхняя секция: фото + инфо + цена/поставщик */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Левая колонка — фото */}
        <div className="lg:col-span-4">
          <Card className="border-border shadow-sm overflow-hidden p-2 sm:p-4">
            <ImageGallery images={product.images} alt={product.name} />
          </Card>
        </div>

        {/* Центральная колонка — инфо о товаре */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Артикул: {product.id.slice(0, 8).toUpperCase()}</p>
          </div>

          {/* Характеристики */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2 border-b border-dashed border-border py-1.5">
              <span className="text-muted-foreground shrink-0">Цена</span>
              <span className="font-medium text-right break-words">{formatPrice(product.price)} / {product.unit}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-dashed border-border py-1.5">
              <span className="text-muted-foreground shrink-0">Наличие</span>
              <span className={product.stock > 0 ? 'text-green-600 font-medium text-right' : 'text-amber-600 font-medium text-right'}>
                {product.stock > 0 ? 'В наличии' : 'Под заказ'}
              </span>
            </div>
            <div className="flex justify-between gap-2 border-b border-dashed border-border py-1.5">
              <span className="text-muted-foreground shrink-0">Мин. партия</span>
              <span className="font-medium text-right break-words">{product.stock} {product.unit}</span>
            </div>
            {product.category && (
              <div className="flex justify-between gap-2 border-b border-dashed border-border py-1.5">
                <span className="text-muted-foreground shrink-0">Категория</span>
                <Link to={`/category/${product.category.slug}`} className="font-medium text-primary hover:underline text-right truncate">
                  {product.category.name}
                </Link>
              </div>
            )}
            <div className="flex justify-between gap-2 border-b border-dashed border-border py-1.5">
              <span className="text-muted-foreground shrink-0">Условия</span>
              <span className="font-medium text-right">
                {[product.isOpt && 'Опт', product.isRetail && 'Розница'].filter(Boolean).join(', ') || '—'}
              </span>
            </div>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {product.description}
            </p>
          )}

          {!isOwner && (
            <div className="flex flex-wrap gap-2 pt-2">
              <ReportButton
                type="product"
                targetId={product.id}
                targetName={product.name}
                targetLink={`/product/${product.id}`}
              />
            </div>
          )}
        </div>

        {/* Правая колонка — цена и действия */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border shadow-sm">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {formatPrice(product.price)}
              </div>
              <div className="text-sm text-muted-foreground">за {product.unit}</div>

              <div className="flex flex-wrap gap-2">
                {product.stock > 0 ? (
                  <Badge className="bg-green-500 text-white hover:bg-green-500">В наличии</Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">Под заказ</Badge>
                )}
                {product.isOpt && <Badge variant="outline" className="border-border">Опт</Badge>}
              </div>

              <Separator className="bg-border" />

              {!isOwner && (
                <div className="space-y-2">
                  {currentTenantId ? (
                    <Button
                      className="w-full bg-primary text-white hover:bg-primary/90 gap-2"
                      onClick={() => document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Заказать
                    </Button>
                  ) : (
                    <Button className="w-full bg-primary text-white hover:bg-primary/90 gap-2" asChild>
                      <Link to="/login">
                        <ShoppingCart className="h-4 w-4" />
                        Войти, чтобы заказать
                      </Link>
                    </Button>
                  )}

                  {seller?.phone && (
                    <div className="pt-1">
                      {showPhone ? (
                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground bg-muted rounded-md py-2">
                          <Phone className="h-4 w-4 text-primary" />
                          {seller.phone}
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full border-border hover:bg-muted gap-2" onClick={() => setShowPhone(true)}>
                          <Phone className="h-4 w-4" />
                          Показать номер
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Блок поставщика */}
              <Separator className="bg-border" />
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Поставщик</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {seller?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <Link to={`/company/${seller?.id}`} className="text-sm font-medium text-foreground hover:text-primary hover:underline block truncate">
                      {seller?.name || 'Неизвестный поставщик'}
                    </Link>
                    {seller?.city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {seller.city}
                      </div>
                    )}
                  </div>
                </div>

                {seller?.isVerified && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-md px-2 py-1.5 border border-green-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Верифицированный поставщик</span>
                  </div>
                )}

                <Button variant="outline" size="sm" className="w-full border-border hover:bg-muted gap-2" asChild>
                  <Link to={`/company/${seller?.id}`}>
                    <Building2 className="h-4 w-4" />
                    Профиль компании
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Табы */}
      <div id="product-tabs">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="bg-muted border border-border w-full">
            <TabsTrigger value="about" className="data-active:bg-card data-active:text-primary data-active:shadow-sm text-muted-foreground">О товаре</TabsTrigger>
            <TabsTrigger value="company" className="data-active:bg-card data-active:text-primary data-active:shadow-sm text-muted-foreground">О компании</TabsTrigger>
            <TabsTrigger value="delivery" className="data-active:bg-card data-active:text-primary data-active:shadow-sm text-muted-foreground">Доставка и оплата</TabsTrigger>
            <TabsTrigger value="chat" className="data-active:bg-card data-active:text-primary data-active:shadow-sm text-muted-foreground">Чат с поставщиком</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="pt-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Описание</h2>
                {product.description ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Описание отсутствует</p>
                )}

                <Separator className="bg-border" />

                <h3 className="text-base font-semibold text-foreground">Характеристики</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden text-sm">
                  <div className="flex justify-between py-2.5 px-3 bg-card">
                    <span className="text-muted-foreground">Артикул</span>
                    <span className="font-medium">{product.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between py-2.5 px-3 bg-card">
                    <span className="text-muted-foreground">Цена</span>
                    <span className="font-medium">{formatPrice(product.price)} / {product.unit}</span>
                  </div>
                  <div className="flex justify-between py-2.5 px-3 bg-card">
                    <span className="text-muted-foreground">Наличие</span>
                    <span className={product.stock > 0 ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                      {product.stock > 0 ? 'В наличии' : 'Под заказ'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 px-3 bg-card">
                    <span className="text-muted-foreground">Мин. партия</span>
                    <span className="font-medium">{product.stock} {product.unit}</span>
                  </div>
                  {product.category && (
                    <div className="flex justify-between py-2.5 px-3 bg-card">
                      <span className="text-muted-foreground">Категория</span>
                      <span className="font-medium">{product.category.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2.5 px-3 bg-card">
                    <span className="text-muted-foreground">Условия</span>
                    <span className="font-medium">
                      {[product.isOpt && 'Опт', product.isRetail && 'Розница'].filter(Boolean).join(', ') || '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="pt-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {seller?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{seller?.name || 'Неизвестный поставщик'}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {seller?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {seller.city}
                        </span>
                      )}
                      {seller?.isVerified && (
                        <span className="flex items-center gap-1 text-green-600">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Верифицирован
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {seller?.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{seller.description}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {seller?.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{seller.phone}</span>
                    </div>
                  )}
                  {seller?.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4 shrink-0" />
                      <a href={seller.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">{seller.website}</a>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="border-border hover:bg-muted gap-2" asChild>
                  <Link to={`/company/${seller?.id}`}>
                    <Eye className="h-4 w-4" />
                    Перейти в профиль компании
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="pt-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Способы доставки
                  </h2>
                  {seller?.deliveryMethods?.length > 0 ? (
                    <ul className="space-y-2">
                      {seller.deliveryMethods.map((method, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          {method}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Уточняйте способы доставки у поставщика</p>
                  )}
                </div>

                <Separator className="bg-border" />

                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Способы оплаты
                  </h2>
                  {seller?.paymentMethods?.length > 0 ? (
                    <ul className="space-y-2">
                      {seller.paymentMethods.map((method, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          {method}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Уточняйте способы оплаты у поставщика</p>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700">
                  Оплата и доставка осуществляются напрямую между поставщиком и покупателем. Площадка Торговый Хаб не проводит платежи.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="pt-4 space-y-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
