'use client'

import { useEffect } from 'react'

/* Registers /sw.js so the app can be installed and still open without a
 * connection. Skipped in development, where the dev server and HMR do not
 * mix with a caching worker. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // a failed registration must never break the app
      })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
    }
  }, [])

  return null
}
