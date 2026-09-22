'use client'

import * as React from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark' | undefined
  themes: Theme[]
  systemTheme: 'light' | 'dark' | undefined
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
)

const MEDIA = '(prefers-color-scheme: dark)'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia(MEDIA).matches ? 'dark' : 'light'
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  root.style.colorScheme = resolved
}

export type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  enableSystem = true,
  storageKey = 'light-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored)
      }
    } catch {
      /* ignore */
    }
    setSystemTheme(getSystemTheme())
  }, [storageKey])

  React.useEffect(() => {
    const media = window.matchMedia(MEDIA)
    const onChange = () => setSystemTheme(getSystemTheme())
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: 'light' | 'dark' | undefined = !mounted
    ? undefined
    : theme === 'system'
      ? systemTheme
      : theme

  React.useEffect(() => {
    if (!resolvedTheme) return
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  function setTheme(next: Theme) {
    setThemeState(next)
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      /* ignore */
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        themes: enableSystem ? ['light', 'dark', 'system'] : ['light', 'dark'],
        systemTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    return {
      theme: 'light' as Theme,
      setTheme: (_: Theme) => {},
      resolvedTheme: undefined as 'light' | 'dark' | undefined,
      themes: ['light', 'dark', 'system'] as Theme[],
      systemTheme: undefined as 'light' | 'dark' | undefined,
    }
  }
  return ctx
}
