import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// Авто-обработка 401 (неавторизован)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const requestUrl = err.config?.url || ''
      // Не редиректим на /auth/me — иначе публичные страницы будут перебрасывать на логин
      if (!requestUrl.includes('/auth/me') && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
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
