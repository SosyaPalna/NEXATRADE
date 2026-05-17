// frontend/src/pages/AdminRfqs.jsx
import { useEffect, useState } from 'react'
import { api } from '../api'
import '../styles/Admin.css'

export default function AdminRfqs() {
  const [rfqs, setRfqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1 })
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { loadRfqs() }, [page, search, statusFilter])

  const loadRfqs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/rfqs', { params: { search, status: statusFilter, page, limit: 20 } })
      setRfqs(res.data.rfqs)
      setPagination({ pages: res.data.pages })
    } catch {
      setError('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const openStatusModal = (rfq) => setModal({ rfq, type: 'status' })
  const openDeleteModal = (rfq) => setModal({ rfq, type: 'delete' })

  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/admin/rfqs/${modal.rfq.id}`, { status })
      setModal(null); loadRfqs()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/rfqs/${modal.rfq.id}`)
      setModal(null); loadRfqs()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка')
    }
  }

  if (loading && !rfqs.length) return <div className="auth-wrapper">Загрузка...</div>

  return (
    <div>
      <div className="admin-header"><h2>📝 Управление запросами (RFQ)</h2></div>
      <div className="admin-filters">
        <input className="input-field" placeholder="Поиск..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ maxWidth: 300 }} />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="all">Все статусы</option>
          <option value="open">Открытые</option>
          <option value="in_progress">В работе</option>
          <option value="closed">Закрытые</option>
          <option value="cancelled">Отменённые</option>
        </select>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <table className="admin-table">
        <thead><tr><th>Название</th><th>Покупатель</th><th>Статус</th><th>Предложений</th><th>Дата</th><th style={{ width: '140px' }}>Действия</th></tr></thead>
        <tbody>
          {rfqs.map(rfq => (
            <tr key={rfq.id}>
              <td><strong>{rfq.title}</strong><div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>{rfq.description?.substring(0, 50)}...</div></td>
              <td>{rfq.buyer?.name}</td>
              <td><span className={`status-badge status-${rfq.status}`}>{rfq.status}</span></td>
              <td>{rfq._count?.quotes || 0}</td>
              <td>{new Date(rfq.createdAt).toLocaleDateString('ru-RU')}</td>
              <td className="actions">
                <button className="btn btn-sm btn-edit" onClick={() => openStatusModal(rfq)}>⚙️</button>
                <button className="btn btn-sm btn-delete" onClick={() => openDeleteModal(rfq)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pagination.pages > 1 && (
        <div className="admin-pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
          <span>{page} / {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>→</button>
        </div>
      )}
      {modal?.type === 'status' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>⚙️ Статус</h3><button className="modal-close" onClick={() => setModal(null)}>×</button></div>
            <p><strong>{modal.rfq.title}</strong></p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '1rem 0' }}>
              {['open', 'in_progress', 'closed', 'cancelled'].map(s => (
                <button key={s} className={`btn ${modal.rfq.status === s ? 'btn-primary' : 'btn-danger'}`} onClick={() => handleStatusChange(s)} disabled={modal.rfq.status === s}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {modal?.type === 'delete' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>🗑 Удаление</h3><button className="modal-close" onClick={() => setModal(null)}>×</button></div>
            <p>Удалить <strong>{modal.rfq.title}</strong>?</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-danger" onClick={() => setModal(null)}>Отмена</button>
              <button className="btn btn-delete" onClick={handleDelete}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}