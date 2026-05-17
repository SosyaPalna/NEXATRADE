import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationProvider } from './context/NotificationContext'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import RfqList from './pages/RfqList'
import RfqDetail from './pages/RfqDetail'
import RfqCreate from './pages/RfqCreate'
import AdminLayout from './pages/AdminLayout'
import AdminUsers from './pages/AdminUsers'
import AdminRfqs from './pages/AdminRfqs'

const queryClient = new QueryClient()

// 🔐 Защита: требуется токен
function Protected({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

// 🔐 Защита: требуется роль админа
function AdminOnly({ children }) {
  const isAdmin = localStorage.getItem('isAdmin') === 'true'
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Публичные роуты */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Защищённые роуты пользователя */}
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/products" element={<Protected><Products /></Protected>} />
            <Route path="/rfq" element={<Protected><RfqList /></Protected>} />
            <Route path="/rfq/create" element={<Protected><RfqCreate /></Protected>} />
            <Route path="/rfq/:id" element={<Protected><RfqDetail /></Protected>} />

            {/* 🔥 Админ-панель с вложенными роутами */}
            <Route path="/admin" element={
              <Protected>
                <AdminOnly>
                  <AdminLayout />
                </AdminOnly>
              </Protected>
            }>
              {/* По умолчанию редирект на пользователей */}
              <Route index element={<Navigate to="users" replace />} />
              {/* Вложенные роуты — они рендерятся в <Outlet /> внутри AdminLayout */}
              <Route path="users" element={<AdminUsers />} />
              <Route path="rfqs" element={<AdminRfqs />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<div style={{ textAlign: 'center', marginTop: 80 }}>404 — Страница не найдена</div>} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </NotificationProvider>
  )
}