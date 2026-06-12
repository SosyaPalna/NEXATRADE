import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, uploadFile } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Building2,
  Globe,
  Phone,
  CalendarDays,
  Package,
  Pencil,
  Save,
  X,
  AlertCircle,
  Camera,
  Trash2,
  ExternalLink,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Plus
} from 'lucide-react'
import SEO from '../components/SEO'
import ReportButton from '../components/ReportButton'

export default function CompanyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [isOwn, setIsOwn] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    description: '', website: '', phone: '', avatarUrl: '', coverUrl: '',
    socialLinks: { vk: '', telegram: '', whatsapp: '' },
    city: '', deliveryMethods: '', paymentMethods: ''
  })
  const [cities, setCities] = useState([])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [companyRes, meRes, citiesRes] = await Promise.all([
        api.get(`/company/${id}`),
        api.get('/auth/me').catch(() => null),
        api.get('/cities').catch(() => null)
      ])
      if (citiesRes?.data) setCities(citiesRes.data)
      setCompany(companyRes.data)
      if (meRes?.data?.tenantId === id || meRes?.data?.tenant?.id === id) {
        setIsOwn(true)
        setForm({
          description: companyRes.data.description || '',
          website: companyRes.data.website || '',
          phone: companyRes.data.phone || '',
          avatarUrl: companyRes.data.avatarUrl || '',
          coverUrl: companyRes.data.coverUrl || '',
          socialLinks: companyRes.data.socialLinks || { vk: '', telegram: '', whatsapp: '' },
          city: companyRes.data.city || '',
          deliveryMethods: (companyRes.data.deliveryMethods || []).join(', '),
          paymentMethods: (companyRes.data.paymentMethods || []).join(', ')
        })
      }
    } catch {
      setError('Ошибка загрузки компании')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    Promise.resolve().then(() => loadData())
  }, [loadData])

  const handleImageUpload = async (file, type) => {
    if (!file) return
    try {
      const endpoint = type === 'avatar' ? '/uploads/tenant-avatar' : '/uploads/tenant-cover'
      const url = await uploadFile(endpoint, file)
      setForm(prev => ({ ...prev, [type === 'avatar' ? 'avatarUrl' : 'coverUrl']: url }))
    } catch {
      setError('Ошибка загрузки изображения')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        deliveryMethods: form.deliveryMethods ? form.deliveryMethods.split(',').map(s => s.trim()).filter(Boolean) : [],
        paymentMethods: form.paymentMethods ? form.paymentMethods.split(',').map(s => s.trim()).filter(Boolean) : []
      }
      await api.put('/company/me', payload)
      setIsEditing(false)
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteImage = (type) => {
    const fieldName = type === 'avatar' ? 'avatarUrl' : 'coverUrl'
    setForm(prev => ({ ...prev, [fieldName]: '' }))
    setCompany(prev => prev ? { ...prev, [fieldName]: '' } : null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Загрузка...
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Компания не найдена
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SEO
        title={company.name}
        description={company.description || `Компания ${company.name} на B2B-платформе NexaTrade`}
        keywords={`${company.name}, компания поставщик, B2B поставщик, ${company.address || ''}, оптовые продажи`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: company.name,
          description: company.description,
          url: `https://nexatrade.ru/company/${company.id}`,
          telephone: company.phone,
          address: company.address ? {
            '@type': 'PostalAddress',
            addressLocality: company.address,
          } : undefined,
        }}
      />
      {/* Cover */}
      <div className="relative h-48 md:h-64 rounded-xl overflow-hidden bg-linear-to-r from-primary/80 to-primary">
        {company.coverUrl ? (
          <img src={company.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : null}
        {isOwn && isEditing && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3">
            <label className="cursor-pointer bg-card/90 hover:bg-card text-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
              <Camera className="h-4 w-4" />
              Изменить обложку
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0], 'cover')} hidden />
            </label>
            {company.coverUrl && (
              <button
                className="bg-destructive/90 hover:bg-destructive text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                onClick={() => handleDeleteImage('cover')}
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </button>
            )}
          </div>
        )}
      </div>

      {/* Company header */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative -mt-16 ml-4 md:ml-8">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={company.avatarUrl} alt={company.name} />
            <AvatarFallback className="bg-primary text-white text-2xl">
              {company.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOwn && isEditing && (
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              <label className="cursor-pointer bg-primary text-white rounded-full p-1.5 hover:bg-primary/90 transition-colors">
                <Camera className="h-3 w-3" />
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0], 'avatar')} hidden />
              </label>
              {company.avatarUrl && (
                <button
                  className="bg-destructive text-white rounded-full p-1.5 hover:opacity-90 transition-opacity"
                  onClick={() => handleDeleteImage('avatar')}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-2 md:pt-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="border-border text-foreground">
                  {company.role === 'buyer' ? 'Покупатель' : 'Поставщик'}
                </Badge>
                {company.isVerified && (
                  <Badge className="bg-blue-500 text-white hover:bg-blue-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Верифицирована
                  </Badge>
                )}
                {company.city && (
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {company.city}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  На платформе с {new Date(company.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isOwn && company && (
                <ReportButton
                  type="user"
                  targetId={company.id}
                  targetName={company.name}
                  targetLink={`/company/${company.id}`}
                />
              )}
              {isOwn && (
                <Button
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  variant={isEditing ? 'default' : 'outline'}
                  className={isEditing ? 'bg-primary hover:bg-primary/90 text-white' : 'border-border text-foreground hover:bg-muted'}
                >
                  {isEditing ? <><X className="h-4 w-4 mr-1" /> Отмена</> : <><Pencil className="h-4 w-4 mr-1" /> Редактировать</>}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="bg-destructive/10 border-destructive/30 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {!isEditing ? (
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="about" className="data-active:bg-card data-active:text-primary data-active:shadow-sm text-muted-foreground">
              <Building2 className="h-4 w-4 mr-1.5" />
              О компании
            </TabsTrigger>
            <TabsTrigger value="products" className="data-active:bg-card data-active:text-primary data-active:shadow-sm text-muted-foreground">
              <Package className="h-4 w-4 mr-1.5" />
              Товары
              {company._count?.products > 0 && (
                <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {company._count.products}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="delivery" className="data-active:bg-card data-active:text-primary data-active:shadow-sm text-muted-foreground">
              <Package className="h-4 w-4 mr-1.5" />
              Доставка и оплата
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-active:bg-card data-active:text-primary data-active:shadow-sm text-muted-foreground">
              <Phone className="h-4 w-4 mr-1.5" />
              Контакты
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  О компании
                </CardTitle>
              </CardHeader>
              <CardContent>
                {company.description ? (
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                    {company.description}
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Building2 className="h-10 w-10 text-border mb-3" />
                    <p className="text-sm text-muted-foreground">Описание не добавлено</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            {company.products?.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Товары компании</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{company._count?.products || 0} позиций в каталоге</span>
                    {isOwn && (
                      <Button size="sm" className="bg-primary text-white hover:bg-primary/90 gap-1.5" onClick={() => navigate(`/product/${p.id}`)}>
                        <Plus className="h-4 w-4" />
                        Добавить товар
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {company.products.slice(0, 6).map(p => (
                    <Card
                      key={p.id}
                      className="border-border cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all overflow-hidden"
                      onClick={() => navigate('/products')}
                    >
                      <div className="h-36 bg-muted flex items-center justify-center">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-8 w-8 text-border" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm text-foreground line-clamp-1">{p.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description || 'Нет описания'}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm font-semibold text-primary">
                            {p.price ? `${Number(p.price).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                          </span>
                          <Badge className={p.stock > 0 ? 'bg-green-500/10 text-green-500 border-0' : 'bg-amber-500/10 text-amber-500 border-0'}>
                            {p.stock > 0 ? 'В наличии' : 'Под заказ'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {company.products.length > 6 && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/products')}
                      className="border-border text-foreground hover:bg-muted"
                    >
                      Показать все товары
                      <ExternalLink className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card className="border-border">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-border mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">В каталоге пока нет товаров</h3>
                  <p className="text-sm text-muted-foreground mt-1">Компания еще не добавила ни одного товара</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  Контакты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.phone && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Телефон</p>
                      <a href={`tel:${company.phone}`} className="text-sm text-foreground hover:text-primary transition-colors font-medium">
                        {company.phone}
                      </a>
                    </div>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Сайт</p>
                      <a href={company.website} target="_blank" rel="noopener" className="text-sm text-foreground hover:text-primary transition-colors font-medium flex items-center gap-1">
                        {company.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                {company.socialLinks?.vk && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ВКонтакте</p>
                      <a href={company.socialLinks.vk} target="_blank" rel="noopener" className="text-sm text-foreground hover:text-primary transition-colors font-medium flex items-center gap-1">
                        {company.socialLinks.vk}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                {company.socialLinks?.telegram && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Telegram</p>
                      <a href={company.socialLinks.telegram} target="_blank" rel="noopener" className="text-sm text-foreground hover:text-primary transition-colors font-medium flex items-center gap-1">
                        {company.socialLinks.telegram}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                {company.socialLinks?.whatsapp && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <a href={company.socialLinks.whatsapp} target="_blank" rel="noopener" className="text-sm text-foreground hover:text-primary transition-colors font-medium flex items-center gap-1">
                        {company.socialLinks.whatsapp}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                {!company.website && !company.phone && !company.socialLinks?.vk && !company.socialLinks?.telegram && !company.socialLinks?.whatsapp && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <MapPin className="h-10 w-10 text-border mb-3" />
                    <p className="text-sm text-muted-foreground">Контакты не указаны</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="mt-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Package className="h-4 w-4 text-primary" />
                  Доставка и оплата
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Способы доставки</h3>
                  {company.deliveryMethods?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {company.deliveryMethods.map((method, i) => (
                        <Badge key={i} variant="outline" className="border-border text-foreground">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Не указаны</p>
                  )}
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Способы оплаты</h3>
                  {company.paymentMethods?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {company.paymentMethods.map((method, i) => (
                        <Badge key={i} variant="outline" className="border-border text-foreground">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Не указаны</p>
                  )}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700">
                  Оплата и доставка осуществляются напрямую между поставщиком и покупателем. Площадка NexaTrade не проводит платежи.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Редактирование профиля компании</CardTitle>
            <CardDescription className="text-muted-foreground">Внесите изменения и сохраните профиль</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-foreground">Описание</Label>
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Расскажите о вашей компании..."
                  className="border-border focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Сайт</Label>
                  <Input
                    value={form.website}
                    onChange={e => setForm({ ...form, website: e.target.value })}
                    placeholder="https://..."
                    className="border-border focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Телефон</Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+7..."
                    className="border-border focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary"
                  />
                </div>
              </div>

              <Separator className="bg-border" />

              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Социальные сети</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">ВКонтакте</Label>
                    <Input
                      value={form.socialLinks?.vk || ''}
                      onChange={e => setForm({ ...form, socialLinks: { ...form.socialLinks, vk: e.target.value } })}
                      placeholder="https://vk.com/..."
                      className="border-border focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Telegram</Label>
                    <Input
                      value={form.socialLinks?.telegram || ''}
                      onChange={e => setForm({ ...form, socialLinks: { ...form.socialLinks, telegram: e.target.value } })}
                      placeholder="https://t.me/..."
                      className="border-border focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">WhatsApp</Label>
                    <Input
                      value={form.socialLinks?.whatsapp || ''}
                      onChange={e => setForm({ ...form, socialLinks: { ...form.socialLinks, whatsapp: e.target.value } })}
                      placeholder="https://wa.me/..."
                      className="border-border focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Город</Label>
                  <Input
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Москва"
                    list="cities-list"
                    className="border-border focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary"
                  />
                  <datalist id="cities-list">
                    {cities.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Способы доставки</Label>
                <Input
                  value={form.deliveryMethods}
                  onChange={e => setForm({ ...form, deliveryMethods: e.target.value })}
                  placeholder="Самовывоз, Доставка ТК, Курьер"
                  className="border-border focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary"
                />
                <p className="text-xs text-muted-foreground">Укажите через запятую</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Способы оплаты</Label>
                <Input
                  value={form.paymentMethods}
                  onChange={e => setForm({ ...form, paymentMethods: e.target.value })}
                  placeholder="Безналичный расчёт, Наличные, Карта"
                  className="border-border focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary"
                />
                <p className="text-xs text-muted-foreground">Укажите через запятую</p>
              </div>

              <Separator className="bg-border" />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsEditing(false); loadData(); }}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
