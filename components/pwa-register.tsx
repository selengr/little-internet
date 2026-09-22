'use client'

import { useEffect } from 'react'

/** Registers the site service worker once on the client (production / HTTPS). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    // Allow local testing; skip only insecure non-local origins.
    if (!window.isSecureContext && !isLocal) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(err => {
        console.warn('[pwa] service worker registration failed', err)
      })
    }

    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}
