import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products' 
import RfqList from './pages/RfqList'
import RfqDetail from './pages/RfqDetail'
import RfqCreate from './pages/RfqCreate'

const queryClient = new QueryClient()

function Protected({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <Protected><Dashboard /></Protected>
          } />
          <Route path="/products" element={
            <Protected><Products /></Protected>
          } />
          <Route path="/rfq" element={
            <Protected><RfqList /></Protected>
          } />
          <Route path="/rfq/create" element={
            <Protected><RfqCreate /></Protected>
          } />
          <Route path="/rfq/:id" element={
            <Protected><RfqDetail /></Protected>
          } />
          <Route path="*" element={<div style={{ textAlign: 'center', marginTop: 80 }}>404 — Страница не найдена</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}