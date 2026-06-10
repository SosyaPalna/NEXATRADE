// frontend/src/App.jsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationProvider } from './context/NotificationContext'

// 🔹 Страницы (синхронные)
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import RfqList from './pages/RfqList'
import RfqDetail from './pages/RfqDetail'
import RfqCreate from './pages/RfqCreate'
import Profile from './pages/Profile'
import CompanyPage from './pages/CompanyPage'
import CategoryPage from './pages/CategoryPage'
import ProductDetail from './pages/ProductDetail'

// 🔹 Админка (ленивая загрузка)
const AdminLayout = lazy(() => import('./pages/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const AdminRfqs = lazy(() => import('./pages/AdminRfqs'))
const AdminReports = lazy(() => import('./pages/AdminReports'))
const AdminCategories = lazy(() => import('./pages/AdminCategories'))
const AdminVerifications = lazy(() => import('./pages/AdminVerifications'))
const AdminProducts = lazy(() => import('./pages/AdminProducts'))
const AdminBroadcast = lazy(() => import('./pages/AdminBroadcast'))

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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <main className="mx-auto max-w-7xl">
          <Outlet />
        </main>
      </div>
      <CookieConsent />
      <footer className="border-t border-border bg-card py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} NexaTrade. Все права защищены.</p>
          <nav className="flex items-center gap-4">
            <a href="/products" className="hover:text-foreground transition-colors">Каталог</a>
            <a href="/requests" className="hover:text-foreground transition-colors">Заявки</a>
            <a href="/rfq/create" className="hover:text-foreground transition-colors">Создать заявку</a>
          </nav>
        </div>
      </footer>
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
            {/* 🔓 Публичные маршруты с общим лейаутом */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
            </Route>

            {/* 🔓 Публичные маршруты без лейаута */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 🔒 Защищённые маршруты */}
            <Route element={<Protected />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/company/:id" element={<CompanyPage />} />
                <Route path="/product/:id" element={<ProductDetail />} />

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
                  <Route element={<Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Загрузка админ-панели...</div>}><AdminLayout /></Suspense>}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>}><AdminDashboard /></Suspense>} />
                    <Route path="users" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>}><AdminUsers /></Suspense>} />
                    <Route path="rfqs" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>}><AdminRfqs /></Suspense>} />
                    <Route path="reports" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>}><AdminReports /></Suspense>} />
                    <Route path="categories" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>}><AdminCategories /></Suspense>} />
                    <Route path="verifications" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>}><AdminVerifications /></Suspense>} />
                    <Route path="products" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>}><AdminProducts /></Suspense>} />
                    <Route path="broadcast" element={<Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Загрузка...</div>}><AdminBroadcast /></Suspense>} />
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
