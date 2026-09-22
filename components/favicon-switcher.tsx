'use client'

import { useEffect } from 'react'
import { useTheme } from '@/components/theme-provider'

const LIGHT_ICON = '/icon-light-32x32.png'
const DARK_ICON = '/icon-dark-32x32.png'

export function FaviconSwitcher() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const href = resolvedTheme === 'light' ? LIGHT_ICON : DARK_ICON
    const links = document.querySelectorAll<HTMLLinkElement>(
      "link[rel='icon'], link[rel='shortcut icon']",
    )

    if (links.length === 0) {
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = href
      document.head.appendChild(link)
      return
    }

    links.forEach((link) => {
      link.href = `${href}?v=rk`
    })
  }, [resolvedTheme])

  return null
}
