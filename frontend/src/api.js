import axios from 'axios'
import { toast } from 'sonner'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// Авто-обработка ошибок и 401
api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    const message = err.response?.data?.error || err.message || 'Произошла ошибка'
    const requestUrl = err.config?.url || ''

    if (status === 401) {
      if (!requestUrl.includes('/auth/me') && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
      }
    } else if (status >= 400) {
      // Не показываем toast для 404 на публичных страницах
      const isPublic404 = status === 404 && requestUrl.includes('/products/')
      if (!isPublic404) {
        toast.error(message)
      }
    }

    return Promise.reject(err)
  }
)

export async function uploadFile(endpoint, file) {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.url
}

export async function uploadFiles(endpoint, files) {
  const formData = new FormData()
  files.forEach(file => formData.append('images', file))
  const { data } = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.urls
}
