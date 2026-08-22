'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type CustomScrollbarProps = {
  mobileOnly?: boolean
}

export function CustomScrollbar({ mobileOnly = false }: CustomScrollbarProps) {
  const [scrollPercentage, setScrollPercentage] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setScrollPercentage(percentage)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed z-40 w-[3px] rounded-full bg-border',
        mobileOnly
          ? 'left-5 bottom-[35px] h-[124px] md:hidden'
          : 'bottom-[35px] left-6 h-[124px] md:left-10 lg:bottom-[100px] lg:left-12 lg:h-[174px] 2xl:left-20',
      )}
    >
      <div
        className="absolute bottom-0 w-full rounded-full bg-foreground/75 transition-all duration-150 ease-out dark:bg-foreground/85"
        style={{ height: `${scrollPercentage}%` }}
      />
    </div>
  )
}
