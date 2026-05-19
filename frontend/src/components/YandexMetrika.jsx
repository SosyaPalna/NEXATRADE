import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function YandexMetrika() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ym) {
      // Отправляем хит при каждом изменении маршрута
      window.ym(109307938, 'hit', window.location.href, {
        referer: document.referrer,
        title: document.title,
      })
    }
  }, [location])

  return null
}
