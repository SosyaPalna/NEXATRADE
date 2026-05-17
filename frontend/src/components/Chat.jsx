import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useNotification } from '../context/NotificationContext' // ← ИМПОРТ ХУКА
import './Chat.css'

export default function Chat({ rfqId, currentTenantId }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const messagesEndRef = useRef(null)
  const { addNotification } = useNotification()

  useEffect(() => {
    // Инициализация сокета
    const token = localStorage.getItem('token')
    const newSocket = io('http://localhost:8000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    setSocket(newSocket)

    // Присоединяемся к комнате RFQ
    newSocket.emit('join:rfq', rfqId)

    // Загружаем историю
    newSocket.emit('messages:load', { rfqId })

    // Слушаем новые сообщения
    newSocket.on('message:receive', (message) => {
      setMessages(prev => [...prev, message])

      if (message.senderId !== currentTenantId) {
        addNotification(
          `💬 Новое сообщение от ${message.sender?.name || 'партнёра'}`,
          'info'
        )
      }
    })

    // Слушаем загрузку истории
    newSocket.on('messages:loaded', (history) => {
      setMessages(history)
    })

    // Очистка при размонтировании
    return () => {
      newSocket.disconnect()
    }
  }, [rfqId, currentTenantId, addNotification]) // ← Добавили зависимости

  // Автоскролл вниз при новом сообщении
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    socket.emit('message:send', {
      rfqId,
      content: newMessage.trim()
    })
    setNewMessage('')
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        💬 Чат по запросу #{rfqId.slice(0, 8)}...
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`message ${msg.senderId === currentTenantId ? 'own' : 'other'}`}
          >
            <div>{msg.content}</div>
            <div className="message-meta">
              <span>{msg.sender?.name}</span>
              <span>{formatTime(msg.createdAt)}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Напишите сообщение..."
          disabled={!socket}
        />
        <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
          Отправить
        </button>
      </form>
    </div>
  )
}