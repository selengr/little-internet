'use client'

import { type ReactNode, useRef } from 'react'
import { useScroll, type MotionValue } from 'framer-motion'

type ScrollChapterProps = {
  id?: string
  /** How much vertical scroll this chapter consumes (sticky pin). */
  runwayVh?: number
  className?: string
  children: (scroll: { progress: MotionValue<number> }) => ReactNode
}

export function ScrollChapter({
  id,
  runwayVh = 160,
  className,
  children,
}: ScrollChapterProps) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  return (
    <section
      id={id}
      ref={ref}
      className={className}
      style={{ height: `${runwayVh}vh` }}
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">{children({ progress: scrollYProgress })}</div>
    </section>
  )
}
