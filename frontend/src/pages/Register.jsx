import { useState } from 'react'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Building2, Mail, Lock } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', companyName: '', role: 'buyer' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const passwordChecks = [
    { test: form.password.length >= 8, label: 'Минимум 8 символов' },
    { test: /[a-z]/.test(form.password), label: 'Хотя бы одна строчная латинская буква' },
    { test: /[A-Z]/.test(form.password), label: 'Хотя бы одна заглавная латинская буква' },
    { test: /\d/.test(form.password), label: 'Хотя бы одна цифра' },
    { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password), label: 'Хотя бы один спецсимвол' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!agreed) {
      setError('Необходимо согласие на обработку персональных данных')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    for (const c of passwordChecks) {
      if (!c.test) {
        setError(c.label)
        return
      }
    }

    setLoading(true)
    try {
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        tenant: { name: form.companyName, role: form.role }
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO title="Регистрация" description="Создайте аккаунт компании на NexaTrade — B2B-платформа для оптовых закупок и продаж." noindex nofollow />
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl">
            N
          </div>
        </div>

        <Card className="border border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Регистрация</CardTitle>
            <CardDescription className="text-muted-foreground">Создайте аккаунт компании для B2B-торговли</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9 border-border text-foreground"
                    placeholder="company@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-foreground">Название компании</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    className="pl-9 border-border text-foreground"
                    placeholder="ООО «Пример»"
                    value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-foreground">Роль в системе</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="buyer">Покупатель (заказчик)</option>
                  <option value="seller">Поставщик (продавец)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9 border-border text-foreground"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Требования к паролю:</p>
                  <ul className="space-y-0.5">
                    {passwordChecks.map((item, i) => (
                      <li key={i} className={`flex items-center gap-1.5 text-xs ${item.test ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <span className="leading-none">{item.test ? '✓' : '•'}</span>
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Подтвердите пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="pl-9 border-border text-foreground"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="consent"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                  className="border-border data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground mt-0.5"
                />
                <Label htmlFor="consent" className="text-xs font-normal leading-relaxed cursor-pointer text-muted-foreground">
                  Я согласен на обработку моих персональных данных в соответствии с{' '}
                  <a href="#" className="underline text-primary hover:underline">Политикой конфиденциальности</a>{' '}
                  и принимаю{' '}
                  <a href="#" className="underline text-primary hover:underline">Пользовательское соглашение</a>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Войти
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
    </>
  )
}
