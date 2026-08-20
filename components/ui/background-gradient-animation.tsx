'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

type BackgroundGradientAnimationProps = {
  gradientBackgroundStart?: string
  gradientBackgroundEnd?: string
  firstColor?: string
  secondColor?: string
  thirdColor?: string
  fourthColor?: string
  fifthColor?: string
  pointerColor?: string
  size?: string
  blendingValue?: string
  children?: ReactNode
  className?: string
  interactive?: boolean
  containerClassName?: string
}

export function BackgroundGradientAnimation({
  gradientBackgroundStart = 'rgb(10, 10, 16)',
  gradientBackgroundEnd = 'rgb(18, 12, 36)',
  firstColor = '139, 92, 246',
  secondColor = '251, 191, 36',
  thirdColor = '56, 189, 248',
  fourthColor = '244, 114, 182',
  fifthColor = '52, 211, 153',
  pointerColor = '167, 139, 250',
  size = '85%',
  blendingValue = 'soft-light',
  children,
  className,
  interactive = true,
  containerClassName,
}: BackgroundGradientAnimationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const interactiveRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const rafRef = useRef<number>(0)

  const cssVars = {
    '--gradient-background-start': gradientBackgroundStart,
    '--gradient-background-end': gradientBackgroundEnd,
    '--first-color': firstColor,
    '--second-color': secondColor,
    '--third-color': thirdColor,
    '--fourth-color': fourthColor,
    '--fifth-color': fifthColor,
    '--pointer-color': pointerColor,
    '--gradient-size': size,
    '--blending-value': blendingValue,
  } as CSSProperties

  useEffect(() => {
    if (!interactive) return

    const tick = () => {
      const p = pointerRef.current
      p.x += (p.tx - p.x) / 14
      p.y += (p.ty - p.y) / 14
      if (interactiveRef.current) {
        interactiveRef.current.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [interactive])

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()
    pointerRef.current.tx = event.clientX - rect.left - rect.width / 2
    pointerRef.current.ty = event.clientY - rect.top - rect.height / 2
  }

  return (
    <div
      ref={rootRef}
      style={cssVars}
      onPointerMove={interactive ? handlePointerMove : undefined}
      className={cn(
        'relative overflow-hidden bg-[linear-gradient(135deg,var(--gradient-background-start),var(--gradient-background-end))]',
        containerClassName,
      )}
    >
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id="blogGradientGoo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {children}

      <div
        className={cn(
          'gradient-blobs pointer-events-none absolute inset-0 h-full w-full',
          '[filter:url(#blogGradientGoo)_blur(48px)]',
          'max-[999px]:[filter:blur(56px)]',
        )}
      >
        <div className="gradient-blob gradient-blob-1 absolute opacity-75" />
        <div className="gradient-blob gradient-blob-2 absolute opacity-70" />
        <div className="gradient-blob gradient-blob-3 absolute opacity-65" />
        <div className="gradient-blob gradient-blob-4 absolute opacity-55" />
        <div className="gradient-blob gradient-blob-5 absolute opacity-60" />

        {interactive && (
          <div
            ref={interactiveRef}
            className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-75 will-change-transform"
            style={{
              background:
                'radial-gradient(circle at center, rgba(var(--pointer-color), 0.85) 0, rgba(var(--pointer-color), 0) 58%)',
              mixBlendMode: 'var(--blending-value)' as CSSProperties['mixBlendMode'],
            }}
          />
        )}
      </div>

      <div
        className={cn('pointer-events-none absolute inset-0 opacity-[0.35]', className)}
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  )
}
