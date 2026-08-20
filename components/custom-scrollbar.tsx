'use client'

import { useEffect, useState } from 'react'

export function CustomScrollbar() {
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
      className="pointer-events-none fixed bottom-[100px] left-8 z-40 h-[174px] w-[3px] rounded-full bg-border md:left-10 lg:left-12 2xl:left-20"
    >
      <div
        className="absolute bottom-0 w-full rounded-full bg-foreground/75 transition-all duration-150 ease-out dark:bg-foreground/85"
        style={{ height: `${scrollPercentage}%` }}
      />
    </div>
  )
}
