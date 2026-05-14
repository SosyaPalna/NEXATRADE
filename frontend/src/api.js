import axios from 'axios'

export const api = axios.create({ 
  baseURL: '/api',  // Проксируется на http://localhost:8000/api
  headers: { 'Content-Type': 'application/json' }
})

// Авто-подстановка JWT-токена
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Авто-обработка 401 (неавторизован)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)