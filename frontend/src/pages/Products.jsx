import { useEffect, useState } from 'react'
import { api } from '../api'
import '../styles/Products.css'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '0', category: 'general' })
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data)
    } catch (err) {
      setError('Ошибка загрузки товаров')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editId) {
        await api.put(`/products/${editId}`, form)
        setEditId(null)
      } else {
        await api.post('/products', form)
      }
      setForm({ name: '', description: '', price: '', stock: '0', category: 'general' })
      loadProducts()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения')
    }
  }

  const handleEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price.toString(), stock: p.stock.toString(), category: p.category })
    setEditId(p.id)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return
    try {
      await api.delete(`/products/${id}`)
      loadProducts()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления')
    }
  }

  if (loading) return <div className="auth-wrapper">Загрузка каталога...</div>

  return (
    <div className="dashboard-content container">
      <h2 style={{ marginBottom: '1.5rem' }}>📦 Каталог товаров</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="products-layout">
        {/* Форма создания/редактирования */}
        <div className="card products-sidebar">
          <h3>{editId ? '✏️ Редактирование' : ' Новый товар'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Название</label>
              <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Описание</label>
              <textarea className="input-field" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Цена (₽)</label>
                <input type="number" step="0.01" className="input-field" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Остаток</label>
                <input type="number" className="input-field" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
              </div>
            </div>
            <div className="input-group">
              <label>Категория</label>
              <select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="general">Общее</option>
                <option value="electronics">Электроника</option>
                <option value="raw_materials">Сырьё</option>
                <option value="equipment">Оборудование</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {editId ? 'Сохранить' : 'Добавить'}
              </button>
              {editId && (
                <button type="button" className="btn btn-danger" onClick={() => { setEditId(null); setForm({ name: '', description: '', price: '', stock: '0', category: 'general' }) }}>
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Таблица товаров */}
        <div className="products-main">
          {products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>Товаров пока нет. Создайте первый!</p>
            </div>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  <th>Остаток</th>
                  <th style={{ width: '140px' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>{p.description || '—'}</div>
                    </td>
                    <td>{p.category}</td>
                    <td className="price-tag">{p.price} ₽</td>
                    <td>
                      <span className={`stock-badge ${p.stock > 10 ? 'in-stock' : p.stock > 0 ? 'low-stock' : 'out-stock'}`}>
                        {p.stock > 10 ? 'В наличии' : p.stock > 0 ? 'Мало' : 'Нет'} ({p.stock})
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-sm btn-edit" onClick={() => handleEdit(p)}>Изменить</button>
                        <button className="btn btn-sm btn-delete" onClick={() => handleDelete(p.id)}>Удалить</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}