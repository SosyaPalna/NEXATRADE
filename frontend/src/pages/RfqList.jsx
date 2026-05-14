import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import '../styles/Rfq.css'

export default function RfqList() {
  const [rfqs, setRfqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/rfq').then(res => {
      setRfqs(res.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="auth-wrapper">Загрузка RFQ...</div>

  return (
    <div className="dashboard-content container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>📝 Запросы на закупку (RFQ)</h2>
        <Link to="/rfq/create" className="btn btn-primary">+ Создать RFQ</Link>
      </div>

      {rfqs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>RFQ пока нет. Создайте первый запрос!</p>
        </div>
      ) : (
        <div>
          {rfqs.map(rfq => (
            <Link to={`/rfq/${rfq.id}`} key={rfq.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="rfq-card">
                <div className="rfq-header">
                  <div>
                    <div className="rfq-title">{rfq.title}</div>
                    <div className="rfq-meta">
                      {rfq.buyer?.name} • {new Date(rfq.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <span className={`status-badge status-${rfq.status}`}>
                    {rfq.status === 'open' ? 'Открыт' : 
                     rfq.status === 'in_progress' ? 'Есть предложения' : 
                     rfq.status === 'closed' ? 'Закрыт' : 'Отменён'}
                  </span>
                </div>
                <p style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>{rfq.description.substring(0, 150)}...</p>
                <div style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>
                  Бюджет: {rfq.budget ? `${rfq.budget} ₽` : 'не указан'} • 
                  Количество: {rfq.quantity} • 
                  Предложений: {rfq._count?.quotes || 0}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}