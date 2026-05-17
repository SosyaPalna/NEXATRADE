// frontend/src/components/RfqFeed.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function RfqFeed({ limit = 5 }) {
  const [rfqs, setRfqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Загружаем только открытые RFQ от других компаний
    api.get('/rfq')
      .then(res => {
        const openRfqs = res.data
          .filter(r => r.status === 'open')
          .slice(0, limit)
        setRfqs(openRfqs)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [limit])

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Загрузка предложений...</div>
  if (rfqs.length === 0) return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>Активных предложений пока нет</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>📋 Активные запросы на закупку</h3>
        <Link to="/rfq" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>Все запросы →</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {rfqs.map(rfq => (
          <Link to={`/rfq/${rfq.id}`} key={rfq.id} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="rfq-card" style={{ padding: '1rem', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{rfq.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                    {rfq.buyer?.name} • {new Date(rfq.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {rfq.description}
                  </p>
                </div>
                <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
                    {rfq.budget ? `${rfq.budget} ₽` : 'Договорная'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                    📦 {rfq.quantity} шт.
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="status-badge status-open">Открыт</span>
                {rfq._count?.quotes > 0 && (
                  <span style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '99px' }}>
                    💬 {rfq._count.quotes} предл.
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}