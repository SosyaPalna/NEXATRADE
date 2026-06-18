import axios from 'axios'
import { toast } from 'sonner'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

let isRefreshing = false
let refreshSubscribers = []
let lastToast = null

function showToast(message, type = 'error') {
  if (lastToast && lastToast.message === message && Date.now() - lastToast.time < 2000) {
    return
  }
  lastToast = { message, time: Date.now() }
  toast[type](message)
}

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb())
  refreshSubscribers = []
}

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

async function refreshToken() {
  try {
    console.log('[api] access token expired, calling /api/auth/refresh')
    await axios.post('/api/auth/refresh', null, { withCredentials: true })
    console.log('[api] refresh succeeded')
    return true
  } catch (err) {
    console.log('[api] refresh failed:', err.response?.status, err.response?.data?.error || err.message)
    return false
  }
}

function shouldSkipRedirect(url) {
  if (!url) return false
  return url.includes('/auth/me') || url.includes('/auth/refresh') || url.includes('/login') || url.includes('/register')
}

// Авто-обработка ошибок и 401
api.interceptors.response.use(
  res => res,
  async (err) => {
    const originalRequest = err.config
    const status = err.response?.status
    const message = err.response?.data?.error || err.message || 'Произошла ошибка'
    const requestUrl = originalRequest?.url || ''

    if (status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(api(originalRequest))
          })
        })
      }

      isRefreshing = true
      const refreshed = await refreshToken()
      isRefreshing = false

      if (refreshed) {
        onRefreshed()
        console.log('[api] retrying original request:', requestUrl)
        return api(originalRequest)
      }

      // Refresh не удался — сбрасываем сессию
      console.log('[api] session expired, redirecting to /login')
      if (!shouldSkipRedirect(requestUrl) && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
      }
    } else if (status >= 400) {
      // Не показываем toast для 404 на публичных страницах
      const isPublic404 = status === 404 && requestUrl.includes('/products/')
      if (!isPublic404) {
        showToast(message, 'error')
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
