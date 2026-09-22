'use client'

import { useEffect } from 'react'

const SESSION_KEY = 'li-visitor-logged'

function detectOs(ua: string, platform: string): string {
  if (/Android/i.test(ua)) return 'Android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Mac OS X|Macintosh/i.test(ua) || platform === 'MacIntel') return 'macOS'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/CrOS/i.test(ua)) return 'Chrome OS'
  if (/Linux/i.test(ua)) return 'Linux'
  return platform || 'unknown'
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/OPR\/|Opera/i.test(ua)) return 'Opera'
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome'
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari'
  return 'other'
}

function detectDevice(ua: string, mobileHint: boolean | null, width: number): string {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet'
  if (mobileHint === true || /Mobi|iPhone|Android.*Mobile/i.test(ua)) return 'mobile'
  if (width > 0 && width < 768) return 'mobile'
  return 'desktop'
}

function collectSnapshot() {
  const ua = navigator.userAgent
  const uaData = (
    navigator as Navigator & {
      userAgentData?: { mobile?: boolean; platform?: string }
    }
  ).userAgentData

  const width = window.screen.width
  const height = window.screen.height

  return {
    device: detectDevice(ua, uaData?.mobile ?? null, width),
    os: uaData?.platform || detectOs(ua, navigator.platform),
    browser: detectBrowser(ua),
    screen: `${width}×${height}`,
    language: navigator.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    path: window.location.pathname + window.location.search,
    referrer: document.referrer || null,
  }
}

/** Logs a short visitor snapshot once per session → data/visitors.txt */
export function VisitorLogger() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return
    } catch {
      /* still try once */
    }

    const client = collectSnapshot()
    fetch('/api/visitor-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client }),
      keepalive: true,
    })
      .then(res => {
        if (!res.ok) return
        try {
          sessionStorage.setItem(SESSION_KEY, '1')
        } catch {
          /* ignore */
        }
      })
      .catch(() => {})
  }, [])

  return null
}
