// frontend/src/context/NotificationContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import './Notification.css' // Стили для тостов

const NotificationContext = createContext()

export const useNotification = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeNotification = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Функция добавления уведомления
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])

    // Звук уведомления
    playSound()

    // Авто-удаление через 4 секунды
    setTimeout(() => {
      removeNotification(id)
    }, 4000)
  }, [removeNotification])

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {/* Контейнер для отображения всех уведомлений */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => removeNotification(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

// Простой звук уведомления (Base64 чтобы не качать файлы)
const playSound = () => {
  try {
    // Короткий звук "дзынь"
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
    audio.volume = 0.5
    audio.play().catch(e => console.log('Audio play blocked:', e))
  } catch (e) {
    console.error('Sound error:', e)
  }
}