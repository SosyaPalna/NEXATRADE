import { useState } from 'react'
import { api } from '../api'
import { useNavigate, Link } from 'react-router-dom'
import '../styles/Auth.css'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', companyName: '', role: 'buyer' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/register', {
        email: form.email, password: form.password, tenant: { name: form.companyName, role: form.role }
      })
      // После регистрации сразу кидаем на логин или дашборд
      navigate('/login') 
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации')
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div className="auth-header">
          <h2> Регистрация</h2>
          <p>Создайте аккаунт для B2B-торговли</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input name="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Название компании</label>
            <input name="companyName" className="input-field" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Роль</label>
            <select name="role" className="input-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="buyer">Покупатель</option>
              <option value="seller">Поставщик</option>
            </select>
          </div>
          <div className="input-group">
            <label>Пароль</label>
            <input name="password" type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Создать аккаунт</button>
        </form>

        <div className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  )
}