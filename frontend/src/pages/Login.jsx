import { useState } from 'react'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Mail, Lock } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.accessToken)
      if (data.user?.isAdmin) {
        localStorage.setItem('isAdmin', 'true')
        navigate('/admin', { replace: true })
      } else {
        localStorage.removeItem('isAdmin')
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа')
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
            <CardTitle className="text-2xl text-[#0f172a]">Вход в NexaTrade</CardTitle>
            <CardDescription className="text-[#64748b]">Введите данные вашей компании</CardDescription>
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
                    placeholder="admin@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
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
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#005BAC] text-[#ffffff] hover:bg-[#004a8d]"
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-[#64748b]">
              Нет аккаунта?{' '}
              <Link to="/register" className="font-medium text-[#005BAC] hover:underline">
                Создать компанию
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
