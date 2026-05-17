// frontend/src/pages/AdminUsers.jsx
import { useEffect, useState } from 'react'
import { api } from '../api'
import '../styles/Admin.css'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1 })
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')

  useEffect(() => { loadUsers() }, [page, search])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users', { params: { search, page, limit: 20 } })
      setUsers(res.data.users)
      setPagination({ pages: res.data.pages })
    } catch {
      setError('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (user) => {
    setForm({ ...user, password: '' })
    setModal({ user, type: 'edit' })
  }

  const openDeleteModal = (user) => {
    setModal({ user, type: 'delete' })
  }

  const handleSave = async () => {
    setError('')
    try {
      await api.put(`/admin/users/${form.id}`, {
        email: form.email,
        isActive: form.isActive,
        isAdmin: form.isAdmin,
        password: form.password || undefined
      })
      setModal(null)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения')
    }
  }

  const handleDelete = async () => {
    setError('')
    try {
      await api.delete(`/admin/users/${modal.user.id}`)
      setModal(null)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления')
    }
  }

  if (loading && !users.length) return <div className="auth-wrapper">Загрузка...</div>

  return (
    <div>
      <div className="admin-header">
        <h2>👥 Управление пользователями</h2>
      </div>

      <div className="admin-filters">
        <input className="input-field" placeholder="Поиск по email или компании..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ maxWidth: 300 }} />
        <span style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>Найдено: {users.length}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th><th>Компания</th><th>Админ</th><th>Активен</th><th>Дата</th><th style={{ width: '140px' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.tenant?.name || '—'}</td>
              <td><span className={`status-badge status-${user.isAdmin}`}>{user.isAdmin ? 'Да' : 'Нет'}</span></td>
              <td><span className={`status-badge status-${user.isActive}`}>{user.isActive ? 'Да' : 'Нет'}</span></td>
              <td>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
              <td className="actions">
                <button className="btn btn-sm btn-edit" onClick={() => openEditModal(user)}>✏️</button>
                <button className="btn btn-sm btn-delete" onClick={() => openDeleteModal(user)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination.pages > 1 && (
        <div className="admin-pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Назад</button>
          <span>Стр. {page} из {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>Вперёд →</button>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.type === 'edit' ? '✏️ Редактирование' : '🗑 Удаление'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            {modal.type === 'edit' ? (
              <div>
                <div className="input-group"><label>Email</label><input className="input-field" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="input-group"><label>Новый пароль</label><input type="password" className="input-field" value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} /></div>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} /> Активен</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={form.isAdmin} onChange={e => setForm({...form, isAdmin: e.target.checked})} /> Администратор</label>
                </div>
                {error && <div className="alert alert-error">{error}</div>}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-danger" onClick={() => setModal(null)}>Отмена</button>
                  <button className="btn btn-primary" onClick={handleSave}>Сохранить</button>
                </div>
              </div>
            ) : (
              <div>
                <p>Удалить пользователя <strong>{modal.user.email}</strong>?</p>
                {error && <div className="alert alert-error">{error}</div>}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button className="btn btn-danger" onClick={() => setModal(null)}>Отмена</button>
                  <button className="btn btn-delete" onClick={handleDelete}>Удалить</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}