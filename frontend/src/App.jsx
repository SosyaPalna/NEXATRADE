// frontend/src/App.jsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationProvider } from './context/NotificationContext'

// 🔹 Страницы (синхронные)
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

// 🔹 Админка (ленивая загрузка)
const AdminLayout = lazy(() => import('./pages/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const AdminRfqs = lazy(() => import('./pages/AdminRfqs'))
const AdminReports = lazy(() => import('./pages/AdminReports'))
const AdminCategories = lazy(() => import('./pages/AdminCategories'))

// 🔹 Компоненты и лейауты
import NavBar from './components/NavBar'
import MarketLayout from './layouts/MarketLayout'
import CookieConsent from './components/CookieConsent'
import YandexMetrika from './components/YandexMetrika'

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
          <YandexMetrika />
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

                {/* ⚙️ Админ-панель (ленивая загрузка) */}
                <Route path="/admin/*" element={<AdminOnly />}>
                  <Route element={<Suspense fallback={<div className="flex items-center justify-center h-screen text-[#64748b]">Загрузка админ-панели...</div>}><AdminLayout /></Suspense>}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-[#64748b]">Загрузка...</div>}><AdminDashboard /></Suspense>} />
                    <Route path="users" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-[#64748b]">Загрузка...</div>}><AdminUsers /></Suspense>} />
                    <Route path="rfqs" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-[#64748b]">Загрузка...</div>}><AdminRfqs /></Suspense>} />
                    <Route path="reports" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-[#64748b]">Загрузка...</div>}><AdminReports /></Suspense>} />
                    <Route path="categories" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-[#64748b]">Загрузка...</div>}><AdminCategories /></Suspense>} />
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
