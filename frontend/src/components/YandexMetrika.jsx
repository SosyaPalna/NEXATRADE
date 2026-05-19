import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const COUNTER_ID = 109307938

export default function YandexMetrika() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ym) {
      window.ym(COUNTER_ID, 'hit', window.location.href, {
        referer: document.referrer,
        title: document.title,
      })
    }
  }, [location])

  return null
}
