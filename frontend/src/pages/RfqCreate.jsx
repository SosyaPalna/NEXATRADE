import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle2, ChevronRight, FileText } from 'lucide-react'

export default function RfqCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState([])

  const [formData, setFormData] = useState({
    title: '', description: '', categoryId: '', quantity: '', unit: 'шт.',
    budget: '', budgetType: 'fixed', deadline: '', deliveryDate: '',
    deliveryAddress: '', deliveryType: 'pickup', requirements: '',
    contactPhone: '', contactEmail: '', companyInn: ''
  })

  useEffect(() => {
    api.get('/categories/flat').then(res => setCategories(res.data)).catch(() => {})
  }, [])

  const units = [
    { value: 'шт.', label: 'Штуки' },
    { value: 'кг', label: 'Килограммы' },
    { value: 'т', label: 'Тонны' },
    { value: 'м', label: 'Метры' },
    { value: 'м2', label: 'Квадратные метры' },
    { value: 'м3', label: 'Кубометры' },
    { value: 'л', label: 'Литры' },
    { value: 'упак', label: 'Упаковки' },
    { value: 'комплект', label: 'Комплекты' }
  ]

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (!formData.title || !formData.quantity) throw new Error('Заполните обязательные поля')
      const payload = {
        title: formData.title, description: formData.description, categoryId: formData.categoryId,
        quantity: parseFloat(formData.quantity), unit: formData.unit,
        budget: formData.budgetType === 'fixed' && formData.budget ? parseFloat(formData.budget) : null,
        deadline: formData.deadline || null, deliveryDate: formData.deliveryDate || null,
        deliveryAddress: formData.deliveryAddress, deliveryType: formData.deliveryType,
        requirements: formData.requirements ? formData.requirements.split('\n').filter(r => r.trim()) : [],
        contactPhone: formData.contactPhone, contactEmail: formData.contactEmail, companyInn: formData.companyInn
      }
      const res = await api.post('/rfq', payload)
      navigate(`/rfq/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка создания заявки')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 1, label: 'Товар' },
    { id: 2, label: 'Условия' },
    { id: 3, label: 'Контакты' }
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] flex items-center justify-center gap-2">
          <FileText className="h-6 w-6 text-[#005BAC]" />
          Разместить заявку на закупку
        </h1>
        <p className="text-[#64748b]">Заполните форму — поставщики сами предложат вам условия</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-2">
            <Badge className={`h-8 w-8 rounded-full flex items-center justify-center p-0 ${step >= s.id ? 'bg-[#005BAC] text-white hover:bg-[#005BAC]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-transparent'}`}>
              {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
            </Badge>
            <span className={`text-sm ${step >= s.id ? 'font-medium text-[#0f172a]' : 'text-[#64748b]'}`}>{s.label}</span>
            {idx < steps.length - 1 && <ChevronRight className="h-4 w-4 text-[#cbd5e1]" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-[#fee2e2] text-[#ef4444] border border-[#fecaca] rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <Card className="border-[#e2e8f0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#0f172a]">Что нужно купить?</CardTitle>
              <CardDescription>Укажите основную информацию о товаре или услуге</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название товара / услуги *</Label>
                <Input id="title" value={formData.title} onChange={e => handleChange('title', e.target.value)} placeholder="Например: Бетон М300 с доставкой" required className="border-[#e2e8f0]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select value={formData.categoryId} onValueChange={v => handleChange('categoryId', v)}>
                  <SelectTrigger className="border-[#e2e8f0]"><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Подробное описание</Label>
                <Textarea id="description" rows={4} value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="Опишите характеристики, требования к качеству, стандарты" className="border-[#e2e8f0]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Количество *</Label>
                  <Input id="quantity" type="number" min="0.01" step="0.01" value={formData.quantity} onChange={e => handleChange('quantity', e.target.value)} placeholder="100" required className="border-[#e2e8f0]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Единица измерения</Label>
                  <Select value={formData.unit} onValueChange={v => handleChange('unit', v)}>
                    <SelectTrigger className="border-[#e2e8f0]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {units.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" className="bg-[#005BAC] text-white hover:bg-[#004a8d]" onClick={() => setStep(2)}>
                  Далее <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-[#e2e8f0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#0f172a]">Бюджет и сроки</CardTitle>
              <CardDescription>Укажите финансовые условия и временные рамки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budgetType">Тип цены</Label>
                <Select value={formData.budgetType} onValueChange={v => handleChange('budgetType', v)}>
                  <SelectTrigger className="border-[#e2e8f0]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Фиксированная цена</SelectItem>
                    <SelectItem value="negotiable">Договорная</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.budgetType === 'fixed' && (
                <div className="space-y-2">
                  <Label htmlFor="budget">Бюджет (₽)</Label>
                  <Input id="budget" type="number" min="0" value={formData.budget} onChange={e => handleChange('budget', e.target.value)} placeholder="50000" className="border-[#e2e8f0]" />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Срок поставки</Label>
                  <Input id="deliveryDate" type="date" value={formData.deliveryDate} onChange={e => handleChange('deliveryDate', e.target.value)} min={new Date().toISOString().split('T')[0]} className="border-[#e2e8f0]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Дедлайн отклика</Label>
                  <Input id="deadline" type="date" value={formData.deadline} onChange={e => handleChange('deadline', e.target.value)} min={new Date().toISOString().split('T')[0]} className="border-[#e2e8f0]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryType">Тип доставки</Label>
                <Select value={formData.deliveryType} onValueChange={v => handleChange('deliveryType', v)}>
                  <SelectTrigger className="border-[#e2e8f0]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Самовывоз</SelectItem>
                    <SelectItem value="delivery">Доставка</SelectItem>
                    <SelectItem value="both">Любой вариант</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.deliveryType === 'delivery' || formData.deliveryType === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="address">Адрес доставки</Label>
                  <Input id="address" value={formData.deliveryAddress} onChange={e => handleChange('deliveryAddress', e.target.value)} placeholder="г. Москва, ул. Примерная, д. 1" className="border-[#e2e8f0]" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="requirements">Дополнительные требования</Label>
                <Textarea id="requirements" rows={3} value={formData.requirements} onChange={e => handleChange('requirements', e.target.value)} placeholder="• Наличие сертификатов&#10;• Гарантия качества&#10;• Рассрочка платежа" className="border-[#e2e8f0]" />
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" className="border-[#e2e8f0] hover:bg-[#f1f5f9]" onClick={() => setStep(1)}>Назад</Button>
                <Button type="button" className="bg-[#005BAC] text-white hover:bg-[#004a8d]" onClick={() => setStep(3)}>
                  Далее <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-[#e2e8f0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#0f172a]">Доставка и контакты</CardTitle>
              <CardDescription>Поставщики смогут связаться с вами для уточнения деталей</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" type="tel" value={formData.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} placeholder="+7 (999) 123-45-67" className="border-[#e2e8f0]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} placeholder="example@company.ru" className="border-[#e2e8f0]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inn">ИНН компании</Label>
                <Input id="inn" value={formData.companyInn} onChange={e => handleChange('companyInn', e.target.value)} placeholder="1234567890" maxLength={10} className="border-[#e2e8f0]" />
                <p className="text-xs text-[#64748b]">Для юридических лиц</p>
              </div>
              <Separator className="bg-[#e2e8f0]" />
              <div className="flex justify-between">
                <Button type="button" variant="outline" className="border-[#e2e8f0] hover:bg-[#f1f5f9]" onClick={() => setStep(2)}>Назад</Button>
                <Button type="submit" className="bg-[#005BAC] text-white hover:bg-[#004a8d]" disabled={loading}>
                  {loading ? 'Создание...' : 'Разместить заявку'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
