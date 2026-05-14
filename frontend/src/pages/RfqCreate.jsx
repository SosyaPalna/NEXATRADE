import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import '../styles/Rfq.css'

export default function RfqCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    quantity: '',
    budget: '',
    deadline: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/rfq', form)
      navigate('/rfq')
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания RFQ')
    }
  }

  return (
    <div className="dashboard-content container">
      <button onClick={() => navigate('/rfq')} className="btn btn-danger" style={{ marginBottom: '1rem' }}>
        ← Назад
      </button>

      <div className="card" style={{ maxWidth: 600 }}>
        <h2 style={{ marginBottom: '1.5rem' }}>📝 Создать запрос на закупку</h2>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Название запроса *</label>
            <input 
              className="input-field" 
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Например: Закупка офисной бумаги"
              required
            />
          </div>
          <div className="input-group">
            <label>Описание *</label>
            <textarea 
              className="input-field" 
              rows="4"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Опишите требования к товару/услуге..."
              required
            />
          </div>
          <div className="form-row">
            <div className="input-group">
              <label>Количество *</label>
              <input 
                type="number" 
                className="input-field" 
                value={form.quantity}
                onChange={e => setForm({...form, quantity: e.target.value})}
                required
              />
            </div>
            <div className="input-group">
              <label>Бюджет (₽)</label>
              <input 
                type="number" 
                step="0.01"
                className="input-field" 
                value={form.budget}
                onChange={e => setForm({...form, budget: e.target.value})}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Дедлайн</label>
            <input 
              type="date" 
              className="input-field" 
              value={form.deadline}
              onChange={e => setForm({...form, deadline: e.target.value})}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Создать RFQ
          </button>
        </form>
      </div>
    </div>
  )
} 