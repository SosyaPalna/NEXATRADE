import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'  // ← ДОБАВИТЬ ЭТУ СТРОКУ!
import { api } from '../api'
import '../styles/Dashboard.css'
import RfqFeed from '../components/RfqFeed'

export default function Dashboard() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data))
  }, [])

  if (!user) return <div className="auth-wrapper">Загрузка...</div>

  return (
    <div className="dashboard-layout">
      {/* Верхняя панель */}
      <header className="topbar">
        <div className="topbar-logo">NexaTrade</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>{user.email}</span>
          <button 
            onClick={() => { localStorage.removeItem('token'); window.location.href = '/login' }}
            className="btn btn-danger"
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Основной контент */}
      <main className="dashboard-content container">
        <div className="welcome-section">
          <h1>Добро пожаловать, {user.email}</h1>
          <p>Компания: <strong>{user.tenant?.name}</strong> ({user.tenant?.role})</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-title">Мои товары</div>
            <div className="stat-value">0</div>
          </div>
          <div className="stat-card">
            <Link to="/rfq" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-title">RFQ Запросы</div>
                <div className="stat-value">0</div>
              </div>
            </Link>
          </div>
          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-title">Контрагенты</div>
            <div className="stat-value">0</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚙️</div>
            <div className="stat-title">Настройки</div>
            <div className="stat-value">—</div>
          </div>
        </div>
        <div style={{ marginTop: '2rem' }}>
           <RfqFeed limit={5} />
        </div>
      </main>
    </div>
  )
}