import { useEffect, useRef } from 'react'
import { api } from '../api'

const BASE_TITLE = 'NexaTrade — B2B маркетплейс'
const POLL_INTERVAL_MS = 30000

function stripBadge(title) {
  return title.replace(/^\(\d+\+?\)\s*/, '')
}

function updateTitle(count) {
  const current = stripBadge(document.title || BASE_TITLE)
  if (count > 0) {
    const label = count > 99 ? '99+' : String(count)
    document.title = `(${label}) ${current}`
  } else {
    document.title = current
  }
}

function getFaviconLink() {
  return document.querySelector('link[rel*="icon"]')
}

function createBadgeFavicon(originalHref, count) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return originalHref

  const img = new Image()
  img.crossOrigin = 'anonymous'

  const draw = () => {
    // Clear
    ctx.clearRect(0, 0, size, size)

    // Try to draw original favicon
    try {
      ctx.drawImage(img, 0, 0, size, size)
    } catch {
      // Fallback: brand square
      ctx.fillStyle = '#005BAC'
      ctx.beginPath()
      ctx.roundRect(4, 4, 56, 56, 12)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('N', size / 2, size / 2)
    }

    if (count > 0) {
      const label = count > 9 ? '9+' : String(count)
      const badgeRadius = label.length > 1 ? 16 : 14
      const bx = size - badgeRadius - 2
      const by = badgeRadius + 2

      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(bx, by, badgeRadius, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${label.length > 1 ? 14 : 16}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, bx, by + 1)
    }

    const link = getFaviconLink()
    if (link) {
      link.href = canvas.toDataURL('image/png')
    }
  }

  img.onload = draw
  img.onerror = draw
  img.src = originalHref
}

export default function useChatUnreadBadge() {
  const originalFaviconRef = useRef(null)

  useEffect(() => {
    const link = getFaviconLink()
    originalFaviconRef.current = link?.href || '/favicon.svg'

    let cancelled = false

    const fetchUnread = async () => {
      try {
        const res = await api.get('/chat/rooms')
        const rooms = res.data.rooms || []
        const count = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0)
        if (cancelled) return
        updateTitle(count)
        createBadgeFavicon(originalFaviconRef.current, count)
      } catch {
        // silently ignore
      }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.title = stripBadge(document.title || BASE_TITLE)
      const link = getFaviconLink()
      if (link && originalFaviconRef.current) {
        link.href = originalFaviconRef.current
      }
    }
  }, [])
}
