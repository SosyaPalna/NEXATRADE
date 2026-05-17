// frontend/src/components/ProductFilters.jsx
import { useState } from 'react'

export default function ProductFilters({ onFilterChange, categories = [] }) {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock: false
  })

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const clearFilters = () => {
    const empty = { search: '', category: '', minPrice: '', maxPrice: '', inStock: false }
    setFilters(empty)
    onFilterChange?.(empty)
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>🔍 Фильтры</h3>
        <button onClick={clearFilters} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          Сбросить
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Поиск по названию */}
        <div className="input-group">
          <label>Поиск</label>
          <input 
            className="input-field" 
            placeholder="Название товара..." 
            value={filters.search}
            onChange={e => handleChange('search', e.target.value)}
          />
        </div>

        {/* Категория */}
        <div className="input-group">
          <label>Категория</label>
          <select 
            className="input-field" 
            value={filters.category}
            onChange={e => handleChange('category', e.target.value)}
          >
            <option value="">Все категории</option>
            <option value="general">Общее</option>
            <option value="electronics">Электроника</option>
            <option value="raw_materials">Сырьё</option>
            <option value="equipment">Оборудование</option>
          </select>
        </div>

        {/* Цена от */}
        <div className="input-group">
          <label>Цена от (₽)</label>
          <input 
            type="number" 
            className="input-field" 
            placeholder="0"
            value={filters.minPrice}
            onChange={e => handleChange('minPrice', e.target.value)}
          />
        </div>

        {/* Цена до */}
        <div className="input-group">
          <label>Цена до (₽)</label>
          <input 
            type="number" 
            className="input-field" 
            placeholder="100000"
            value={filters.maxPrice}
            onChange={e => handleChange('maxPrice', e.target.value)}
          />
        </div>
      </div>

      {/* Чекбокс "В наличии" */}
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input 
          type="checkbox" 
          id="inStock"
          checked={filters.inStock}
          onChange={e => handleChange('inStock', e.target.checked)}
          style={{ width: '18px', height: '18px' }}
        />
        <label htmlFor="inStock" style={{ margin: 0, cursor: 'pointer' }}>Только в наличии</label>
      </div>
    </div>
  )
}