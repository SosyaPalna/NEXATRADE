import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const COUNTER_ID = 109307938

function initMetrika() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve()

    // Если уже загружена — просто резолвим
    if (window.ym) {
      resolve()
      return
    }

    // Создаём глобальную очередь
    window.ym = window.ym || function () {
      (window.ym.a = window.ym.a || []).push(arguments)
    }
    window.ym.l = 1 * new Date()

    // Загружаем скрипт
    const script = document.createElement('script')
    script.async = 1
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}`
    script.onload = () => {
      // Инициализация счётчика
      window.ym(COUNTER_ID, 'init', {
        ssr: true,
        webvisor: true,
        trackHash: true,
        clickmap: true,
        ecommerce: 'dataLayer',
        accurateTrackBounce: true,
        trackLinks: true,
      })
      resolve()
    }
    script.onerror = () => resolve() // не ломаем приложение если метрика не загрузилась

    const firstScript = document.getElementsByTagName('script')[0]
    firstScript.parentNode.insertBefore(script, firstScript)
  })
}

export default function YandexMetrika() {
  const location = useLocation()

  useEffect(() => {
    initMetrika().then(() => {
      if (window.ym) {
        window.ym(COUNTER_ID, 'hit', window.location.href, {
          referer: document.referrer,
          title: document.title,
        })
      }
    })
  }, [location])

  return null
}
