'use client'

import * as React from 'react'
import { useTheme } from '@/components/theme-provider'
import { Moon, Sun } from 'lucide-react'

const navBtnClass =
  'inline-flex items-center justify-center rounded-xl border border-black/10 dark:border-white/20 ' +
  'bg-[#f8f8f8] dark:bg-[#2f3437] ' +
  'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white ' +
  'hover:border-black/20 dark:hover:border-white/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] ' +
  'transition-all duration-200 px-2.5 py-2.5'

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <span
        className={`${navBtnClass} opacity-0 pointer-events-none`}
        aria-hidden
      >
        <Sun className="size-3.5" />
      </span>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative ${navBtnClass}`}
      aria-label="Toggle theme"
    >
      <Sun className="size-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
