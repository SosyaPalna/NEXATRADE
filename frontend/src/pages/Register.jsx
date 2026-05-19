import { useState } from 'react'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Building2, Mail, Lock } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', companyName: '', role: 'buyer' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!agreed) {
      setError('Необходимо согласие на обработку персональных данных')
      return
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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#005BAC] text-[#ffffff] font-bold text-2xl">
            N
          </div>
        </div>

        <Card className="border border-[#e2e8f0] bg-[#ffffff]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-[#0f172a]">Регистрация</CardTitle>
            <CardDescription className="text-[#64748b]">Создайте аккаунт компании для B2B-торговли</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-[#ef4444] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[#ef4444] mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#0f172a]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9 border-[#e2e8f0] text-[#0f172a]"
                    placeholder="company@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-[#0f172a]">Название компании</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                  <Input
                    id="company"
                    className="pl-9 border-[#e2e8f0] text-[#0f172a]"
                    placeholder="ООО «Пример»"
                    value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-[#0f172a]">Роль в системе</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-lg border border-[#e2e8f0] bg-[#ffffff] px-3 py-2 text-sm text-[#0f172a] outline-none focus:ring-2 focus:ring-[#005BAC]/30"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="buyer">Покупатель (заказчик)</option>
                  <option value="seller">Поставщик (продавец)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#0f172a]">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9 border-[#e2e8f0] text-[#0f172a]"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="consent"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                  className="border-[#e2e8f0] data-checked:border-[#005BAC] data-checked:bg-[#005BAC] data-checked:text-[#ffffff] mt-0.5"
                />
                <Label htmlFor="consent" className="text-xs font-normal leading-relaxed cursor-pointer text-[#64748b]">
                  Я согласен на обработку моих персональных данных в соответствии с{' '}
                  <a href="#" className="underline text-[#005BAC] hover:underline">Политикой конфиденциальности</a>{' '}
                  и принимаю{' '}
                  <a href="#" className="underline text-[#005BAC] hover:underline">Пользовательское соглашение</a>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#005BAC] text-[#ffffff] hover:bg-[#004a8d]"
                disabled={loading}
              >
                {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-[#64748b]">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="font-medium text-[#005BAC] hover:underline">
                Войти
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
