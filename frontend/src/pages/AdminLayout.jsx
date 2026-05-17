// frontend/src/pages/AdminLayout.jsx
import { useState } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import '../styles/Admin.css'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    localStorage.removeItem('token')
    localStorage.removeItem('isAdmin')
    navigate('/login')
  }

  const navItems = [
    { path: '/admin/users', label: '👥 Пользователи' },
    { path: '/admin/rfqs', label: '📝 RFQ Запросы' },
    { path: '/dashboard', label: '🔙 На сайт' }
  ]

  return (
    <div className="admin-layout">
      {/* Сайдбар */}
      <aside className="admin-sidebar">
        <h3 style={{ marginBottom: '2rem', padding: '0 1rem' }}>⚙️ Админ-панель</h3>
        <nav className="admin-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button 
            onClick={handleLogout} 
            className="btn btn-danger" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Выход...' : 'Выйти'}
          </button>
        </div>
      </aside>

      {/* Контент */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}