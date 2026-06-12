import { useState } from 'react'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Mail, Lock } from 'lucide-react'

export default function Login() {
  return (
    <>
      <SEO title="Вход" description="Войдите в свой аккаунт NexaTrade — B2B-платформа для оптовых закупок." noindex nofollow />
      <LoginForm />
    </>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      login(data.user)
      if (data.user?.isAdmin) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl">
            N
          </div>
        </div>

        <Card className="border border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Вход в NexaTrade</CardTitle>
            <CardDescription className="text-muted-foreground">Введите данные вашей компании</CardDescription>
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
                    placeholder="admin@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
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
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Нет аккаунта?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Создать компанию
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
