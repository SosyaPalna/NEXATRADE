import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Package, Building2, Phone } from 'lucide-react'
import { getPreviewUrl } from '../lib/images'

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth()
  const [showPhone, setShowPhone] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const hasPhone = !!product.tenant?.phone

  const handlePhoneClick = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    setShowPhone(true)
  }

  return (
    <>
      <Card className="border-border shadow-sm overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
        <div className="flex flex-col sm:flex-row">
          <Link
            to={`/product/${product.id}`}
            className="w-full sm:w-44 h-44 bg-muted flex items-center justify-center shrink-0 relative"
          >
            {product.images?.[0] ? (
              <>
                <img
                  src={getPreviewUrl(product.images[0])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.images.length > 1 && (
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    +{product.images.length - 1}
                  </span>
                )}
              </>
            ) : (
              <Package className="h-10 w-10 text-muted-foreground/40" />
            )}
          </Link>

          <CardContent className="p-4 flex flex-col flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <Link
                to={`/company/${product.tenantId}`}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                <Building2 className="h-3 w-3" />
                <span className="truncate">
                  {product.tenant?.name || 'Поставщик'}
                  {product.tenant?.city && ` · ${product.tenant.city}`}
                </span>
              </Link>

              <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors block mt-1">
                <h3 className="text-base font-semibold text-foreground line-clamp-2">{product.name}</h3>
              </Link>

              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>

              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge
                  className={
                    product.stock > 0
                      ? 'bg-green-500/10 text-green-600 border-0 text-[10px]'
                      : 'bg-amber-500/10 text-amber-600 border-0 text-[10px]'
                  }
                >
                  {product.stock > 0 ? 'В наличии' : 'Под заказ'}
                </Badge>
                {product.isOpt && <Badge variant="outline" className="border-border text-[10px]">Опт</Badge>}
                {product.isRetail && <Badge variant="outline" className="border-border text-[10px]">Розница</Badge>}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-lg font-bold text-primary">
                    {product.price ? `${Number(product.price).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">{product.unit || 'шт.'}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {showPhone && hasPhone ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm font-medium text-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      {product.tenant.phone}
                    </div>
                  ) : hasPhone ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border hover:bg-muted"
                      onClick={handlePhoneClick}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Показать номер
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Компания не оставила номер телефона для связи
                    </span>
                  )}

                  <Button size="sm" className="bg-primary text-white hover:bg-primary/90" asChild>
                    <Link to={`/product/${product.id}`}>Подробнее</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Требуется авторизация</DialogTitle>
            <DialogDescription>
              Сначала войдите или зарегистрируйтесь, чтобы увидеть номер телефона продавца.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button className="w-full bg-primary text-white hover:bg-primary/90" asChild>
              <Link to="/login" onClick={() => setAuthModalOpen(false)}>Войти</Link>
            </Button>
            <Button variant="outline" className="w-full border-border hover:bg-muted" asChild>
              <Link to="/register" onClick={() => setAuthModalOpen(false)}>Регистрация</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
