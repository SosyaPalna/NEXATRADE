// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationProvider } from './context/NotificationContext'

// 🔹 Страницы
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import RfqList from './pages/RfqList'
import RfqDetail from './pages/RfqDetail'
import RfqCreate from './pages/RfqCreate'
import Profile from './pages/Profile'
import CompanyPage from './pages/CompanyPage'
import CategoryPage from './pages/CategoryPage'
import AdminLayout from './pages/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminRfqs from './pages/AdminRfqs'
import AdminReports from './pages/AdminReports'
import AdminCategories from './pages/AdminCategories'

// 🔹 Компоненты и лейауты
import NavBar from './components/NavBar'
import MarketLayout from './layouts/MarketLayout'
import CookieConsent from './components/CookieConsent'

const queryClient = new QueryClient()

// 🔐 Защита: требует токен
function Protected() {
  const token = localStorage.getItem('token')
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

// 🔐 Защита админки: требует isAdmin
function AdminOnly() {
  const isAdmin = localStorage.getItem('isAdmin') === 'true'
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />
}

// 🏗 Основная обёртка приложения (навбар + контент)
function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <main className="mx-auto max-w-7xl">
          <Outlet />
        </main>
      </div>
      <CookieConsent />
    </div>
  )
}

export default function App() {
  return (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* 🔓 Публичные маршруты */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 🔒 Защищённые маршруты */}
            <Route element={<Protected />}>
              <Route element={<AppLayout />}>
                
                {/* Главная → редирект на дашборд */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/company/:id" element={<CompanyPage />} />

                {/* 🛒 Маркетплейс: обёртка с боковым меню категорий */}
                <Route element={<MarketLayout />}>
                  <Route path="/products" element={<Products />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/requests" element={<RfqList />} />
                  <Route path="/rfq" element={<RfqList />} />
                  <Route path="/rfq/create" element={<RfqCreate />} />
                  <Route path="/rfq/:id" element={<RfqDetail />} />
                </Route>

                {/* ⚙️ Админ-панель (отдельный лейаут) */}
                <Route path="/admin/*" element={<AdminOnly />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="rfqs" element={<AdminRfqs />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="categories" element={<AdminCategories />} />
                  </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </NotificationProvider>
  )
}
