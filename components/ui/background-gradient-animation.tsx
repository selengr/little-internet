'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type InkDrop = {
  id: number
  x: number
  y: number
  radius: number
  maxRadius: number
  opacity: number
  color: string
}

type BackgroundGradientAnimationProps = {
  gradientBackgroundStart?: string
  gradientBackgroundEnd?: string
  firstColor?: string
  secondColor?: string
  thirdColor?: string
  fourthColor?: string
  fifthColor?: string
  pointerColor?: string
  dropColors?: string[]
  size?: string
  blendingValue?: string
  children?: ReactNode
  className?: string
  interactive?: boolean
  containerClassName?: string
}

const MAX_DROPS = 18

export function BackgroundGradientAnimation({
  gradientBackgroundStart = 'rgb(14, 13, 12)',
  gradientBackgroundEnd = 'rgb(28, 22, 18)',
  firstColor = '160, 120, 72',
  secondColor = '90, 110, 88',
  thirdColor = '72, 98, 118',
  fourthColor = '140, 72, 48',
  fifthColor = '118, 98, 78',
  pointerColor = '175, 145, 95',
  dropColors,
  size = '88%',
  blendingValue = 'soft-light',
  children,
  className,
  interactive = true,
  containerClassName,
}: BackgroundGradientAnimationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const dropsRef = useRef<InkDrop[]>([])
  const rafRef = useRef<number>(0)
  const lastSpawnRef = useRef(0)
  const dropIdRef = useRef(0)
  const colorIdxRef = useRef(0)
  const [drops, setDrops] = useState<InkDrop[]>([])

  const palette = dropColors ?? [pointerColor, firstColor, thirdColor, fourthColor, secondColor]

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

  const spawnDrop = (clientX: number, clientY: number, burst = false) => {
    if (!rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const color = palette[colorIdxRef.current % palette.length]
    colorIdxRef.current += 1

    const drop: InkDrop = {
      id: dropIdRef.current++,
      x,
      y,
      radius: burst ? 18 : 10,
      maxRadius: burst ? 140 : 96,
      opacity: burst ? 0.42 : 0.32,
      color,
    }

    const next = [...dropsRef.current, drop].slice(-MAX_DROPS)
    dropsRef.current = next
    setDrops(next)
  }

  useEffect(() => {
    if (!interactive) return

    const tick = (now: number) => {
      const p = pointerRef.current
      p.x += (p.tx - p.x) / 20
      p.y += (p.ty - p.y) / 20

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`
      }

      let changed = false
      const alive: InkDrop[] = []

      for (const drop of dropsRef.current) {
        const nextRadius = drop.radius + (drop.maxRadius - drop.radius) * 0.028
        const nextOpacity = drop.opacity * 0.972
        if (nextOpacity > 0.015 && nextRadius < drop.maxRadius * 1.05) {
          alive.push({ ...drop, radius: nextRadius, opacity: nextOpacity })
          changed = true
        }
      }

      if (changed || alive.length !== dropsRef.current.length) {
        dropsRef.current = alive
        setDrops([...alive])
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

    const now = performance.now()
    if (now - lastSpawnRef.current > 48) {
      lastSpawnRef.current = now
      spawnDrop(event.clientX, event.clientY)
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    spawnDrop(event.clientX, event.clientY, true)
  }

  return (
    <div
      ref={rootRef}
      style={cssVars}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerDown={interactive ? handlePointerDown : undefined}
      className={cn(
        'relative overflow-hidden bg-[linear-gradient(145deg,var(--gradient-background-start),var(--gradient-background-end))]',
        containerClassName,
      )}
    >
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id="blogGradientGoo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
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
          '[filter:url(#blogGradientGoo)_blur(52px)]',
          'max-[999px]:[filter:blur(60px)]',
        )}
      >
        <div className="gradient-blob gradient-blob-1 absolute opacity-50" />
        <div className="gradient-blob gradient-blob-2 absolute opacity-45" />
        <div className="gradient-blob gradient-blob-3 absolute opacity-40" />
        <div className="gradient-blob gradient-blob-4 absolute opacity-38" />
        <div className="gradient-blob gradient-blob-5 absolute opacity-42" />
      </div>

      {interactive && (
        <>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {drops.map(drop => (
              <div
                key={drop.id}
                className="absolute rounded-full"
                style={{
                  left: drop.x,
                  top: drop.y,
                  width: drop.radius * 2,
                  height: drop.radius * 2,
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle at 40% 38%, rgba(${drop.color}, ${drop.opacity}) 0%, rgba(${drop.color}, ${drop.opacity * 0.45}) 38%, rgba(${drop.color}, 0) 72%)`,
                  filter: 'blur(10px)',
                  mixBlendMode: blendingValue as CSSProperties['mixBlendMode'],
                  willChange: 'width, height, opacity',
                }}
              />
            ))}
          </div>

          <div
            ref={glowRef}
            className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 opacity-50 will-change-transform"
            style={{
              background:
                'radial-gradient(circle at center, rgba(var(--pointer-color), 0.55) 0%, rgba(var(--pointer-color), 0) 68%)',
              filter: 'blur(18px)',
              mixBlendMode: blendingValue as CSSProperties['mixBlendMode'],
            }}
          />
        </>
      )}

      <div
        className={cn('pointer-events-none absolute inset-0', className)}
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 42%, transparent 0%, rgba(0,0,0,0.62) 100%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  )
}
