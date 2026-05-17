import { useState } from 'react'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'
import '../styles/Auth.css'

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
      
      // Сохраняем токен
      localStorage.setItem('token', data.accessToken)
      
      if (data.user?.isAdmin) {
        localStorage.setItem('isAdmin', 'true')
      } else {
        // Удаляем флаг, если пользователь не админ (защита от "залипания" прав)
        localStorage.removeItem('isAdmin')
      }
      
      // Плавный переход на дашборд
      setTimeout(() => navigate('/dashboard', { replace: true }), 100)
      
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.error || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div className="auth-header">
          <h2>🔐 Вход в NexaTrade</h2>
          <p>Введите данные вашей компании</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="admin@company.com" 
              required 
            />
          </div>
          <div className="input-group">
            <label>Пароль</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="auth-footer">
          Нет аккаунта? <Link to="/register">Создать компанию</Link>
        </div>
      </div>
    </div>
  )
}