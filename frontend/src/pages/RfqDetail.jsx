import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import '../styles/Rfq.css'
import Chat from '../components/Chat'

export default function RfqDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq, setRfq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quoteForm, setQuoteForm] = useState({ price: '', deliveryTime: '', message: '' })
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState(null)
  const [currentTenantId, setCurrentTenantId] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [rfqRes, meRes] = await Promise.all([
        api.get(`/rfq/${id}`),
        api.get('/auth/me')
      ])
      setRfq(rfqRes.data)
      setUserRole(meRes.data.tenant.role)
      setCurrentTenantId(meRes.data.tenantId) // ← ВАЖНО!
    } catch (err) {
      setError('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuote = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/rfq/${id}/quotes`, quoteForm)
      setQuoteForm({ price: '', deliveryTime: '', message: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки предложения')
    }
  }

  const handleQuoteAction = async (quoteId, status) => {
    try {
      await api.patch(`/rfq/quotes/${quoteId}`, { status })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка')
    }
  }

  const handleCloseRfq = async (status) => {
    try {
      await api.patch(`/rfq/${id}`, { status })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка')
    }
  }

  if (loading) return <div className="auth-wrapper">Загрузка...</div>
  if (!rfq) return <div className="auth-wrapper">RFQ не найден</div>

  const isBuyer = rfq.buyerId === localStorage.getItem('tenantId') || userRole === 'buyer'

  return (
    <div className="dashboard-content container">
      <button onClick={() => navigate('/rfq')} className="btn btn-danger" style={{ marginBottom: '1rem' }}>
        ← Назад
      </button>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="rfq-header">
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>{rfq.title}</h2>
            <div className="rfq-meta">
              {rfq.buyer?.name} • Создан: {new Date(rfq.createdAt).toLocaleDateString('ru-RU')}
            </div>
          </div>
          <span className={`status-badge status-${rfq.status}`}>
            {rfq.status === 'open' ? 'Открыт' : rfq.status === 'in_progress' ? 'Есть предложения' : 'Закрыт'}
          </span>
        </div>

        <p style={{ marginBottom: '1rem' }}>{rfq.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div><strong>📦 Количество:</strong> {rfq.quantity}</div>
          <div><strong>💰 Бюджет:</strong> {rfq.budget ? `${rfq.budget} ₽` : 'не указан'}</div>
          <div><strong>📅 Дедлайн:</strong> {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('ru-RU') : 'не указан'}</div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Кнопки управления для покупателя */}
        {isBuyer && rfq.status === 'open' && (
          <div className="rfq-actions">
            <button onClick={() => handleCloseRfq('closed')} className="btn btn-primary">Закрыть RFQ</button>
            <button onClick={() => handleCloseRfq('cancelled')} className="btn btn-danger">Отменить</button>
          </div>
        )}
      </div>

      <h3 style={{ marginBottom: '1rem' }}>💬 Предложения ({rfq.quotes?.length || 0})</h3>
      {rfq.status !== 'cancelled' && (
        <div style={{ marginTop: '2rem' }}>
          <Chat rfqId={rfq.id} currentTenantId={currentTenantId} />
        </div>
      )}

      {rfq.quotes?.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--secondary)' }}>Пока нет предложений</p>
        </div>
      ) : (
        <div>
          {rfq.quotes.map(quote => (
            <div key={quote.id} className="quote-item">
              <div className="quote-header">
                <div>
                  <div className="quote-seller">{quote.seller?.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                    {quote.deliveryTime && `⏱ Срок: ${quote.deliveryTime}`}
                  </div>
                </div>
                <div className="quote-price">{quote.price} ₽</div>
              </div>
              {quote.message && <p style={{ marginBottom: '0.5rem' }}>{quote.message}</p>}
              <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Статус: <strong>
                  {quote.status === 'pending' ? '⏳ На рассмотрении' : 
                   quote.status === 'accepted' ? '✅ Принято' : '❌ Отклонено'}
                </strong>
              </div>
              
              {/* Кнопки для покупателя */}
              {isBuyer && quote.status === 'pending' && (
                <div className="rfq-actions">
                  <button onClick={() => handleQuoteAction(quote.id, 'accepted')} className="btn btn-sm btn-accept">
                    Принять
                  </button>
                  <button onClick={() => handleQuoteAction(quote.id, 'rejected')} className="btn btn-sm btn-reject">
                    Отклонить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Форма отправки предложения для продавцов */}
      {!isBuyer && rfq.status === 'open' && !rfq.quotes?.some(q => q.sellerId === rfq.buyerId) && (
        <div className="card rfq-sidebar" style={{ marginTop: '2rem' }}>
          <h3>📤 Отправить предложение</h3>
          <form onSubmit={handleSubmitQuote}>
            <div className="input-group">
              <label>Цена (₽) *</label>
              <input 
                type="number" 
                step="0.01" 
                className="input-field" 
                value={quoteForm.price}
                onChange={e => setQuoteForm({...quoteForm, price: e.target.value})}
                required
              />
            </div>
            <div className="input-group">
              <label>Срок доставки</label>
              <input 
                className="input-field" 
                value={quoteForm.deliveryTime}
                onChange={e => setQuoteForm({...quoteForm, deliveryTime: e.target.value})}
                placeholder="Например: 5 дней"
              />
            </div>
            <div className="input-group">
              <label>Комментарий</label>
              <textarea 
                className="input-field" 
                rows="3"
                value={quoteForm.message}
                onChange={e => setQuoteForm({...quoteForm, message: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Отправить предложение
            </button>
          </form>
        </div>
      )}
    </div>
  )
}