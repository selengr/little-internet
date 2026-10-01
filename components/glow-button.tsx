'use client'

import { useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const CSS = `
  @property --gb-a { syntax: '<color>'; inherits: true; initial-value: #6366f1; }
  @property --gb-b { syntax: '<color>'; inherits: true; initial-value: #38bdf8; }
  @property --gb-ang { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
  @keyframes gb-breathe { 0%,100% { opacity: .45 } 50% { opacity: 1 } }
  @keyframes gb-orbit { to { --gb-ang: 360deg } }
  @keyframes gb-sweep { 0%,62% { transform: translateX(-140%) skewX(-22deg) } 100% { transform: translateX(380%) skewX(-22deg) } }
  @keyframes gb-ripple { from { transform: translate(-50%,-50%) scale(0); opacity: .55 } to { transform: translate(-50%,-50%) scale(1); opacity: 0 } }

  .gb {
    background-image: linear-gradient(100deg, var(--gb-a), var(--gb-b));
    transition: --gb-a .9s ease, --gb-b .9s ease, transform .2s ease, box-shadow .4s ease, filter .2s ease;
    box-shadow: 0 8px 24px -10px color-mix(in srgb, var(--gb-b) 70%, transparent);
  }
  .gb:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px -10px color-mix(in srgb, var(--gb-b) 90%, transparent),
                0 0 0 3px color-mix(in srgb, var(--gb-a) 22%, transparent);
  }
  .gb:active:not(:disabled) { transform: translateY(0) scale(.97); }
  .gb-inner {
    animation: gb-breathe 3.6s ease-in-out infinite;
    box-shadow: inset 0 0 18px rgba(255,255,255,.55), inset 0 1px 0 rgba(255,255,255,.75);
  }
  .gb-sweep { animation: gb-sweep 5.5s ease-in-out infinite; }
  .gb-ring {
    padding: 2px;
    background: conic-gradient(from var(--gb-ang), transparent 0 52%, rgba(255,255,255,.95) 82%, transparent 100%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
    transition: opacity .3s ease;
  }
  .gb[data-busy='true'] .gb-ring { opacity: 1; animation: gb-orbit 1.1s linear infinite; }
  .gb[data-busy='true'] .gb-inner { animation-duration: 1.2s; }
  @media (prefers-reduced-motion: reduce) {
    .gb-inner, .gb-sweep, .gb[data-busy='true'] .gb-ring { animation: none !important; }
    .gb-inner { opacity: .8; }
  }
`

/**
 * The main "give me another" button of the fact, joke and poem pages: a gradient pill with light that
 * breathes inside its border, a sheen that sweeps across now and then, a spotlight that follows the
 * pointer, a ripple where it is pressed, and a ring of light that circles the edge while busy.
 */
export function GlowButton({
  from,
  to,
  ink = '#ffffff',
  busy,
  onClick,
  children,
  className,
  style,
  size = 'md',
  icon,
}: {
  size?: 'md' | 's'
  /** Replaces the arrow. */
  icon?: React.ReactNode
  from: string
  to: string
  ink?: string
  busy?: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const nextId = useRef(0)

  return (
    <button
      ref={ref}
      type="button"
      disabled={busy}
      data-busy={busy ? 'true' : 'false'}
      onClick={e => {
        const r = e.currentTarget.getBoundingClientRect()
        const id = nextId.current++
        setRipples(list => [...list, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
        setTimeout(() => setRipples(list => list.filter(x => x.id !== id)), 650)
        onClick()
      }}
      onPointerMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--bx', `${e.clientX - r.left}px`)
        e.currentTarget.style.setProperty('--by', `${e.clientY - r.top}px`)
      }}
      className={cn(
        'gb group/gb relative isolate inline-flex items-center justify-center overflow-hidden rounded-full font-medium tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait',
        size === 's' ? 'h-9 px-4 text-[11px]' : 'h-12 w-full px-7 text-[13px] sm:w-auto',
        className,
      )}
      style={{ '--gb-a': from, '--gb-b': to, color: ink, ...style } as React.CSSProperties}
    >
      <style>{CSS}</style>

      {/* Every light effect lives in this layer, clipped to the pill shape, so none of them can show
          outside the rounded corners. (The halo around the button is a box-shadow on the button.) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
        style={{ clipPath: 'inset(0 round 9999px)', transform: 'translateZ(0)' }}
      >
      {/* Light that lives inside the border */}
        <span aria-hidden className="gb-inner pointer-events-none absolute inset-0 rounded-full" />
        {/* A sheen sweeping across */}
        <span
          aria-hidden
          className="gb-sweep pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/35 to-transparent"
        />
        {/* Spotlight under the pointer */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/gb:opacity-100"
          style={{
            background: 'radial-gradient(110px circle at var(--bx, 50%) var(--by, 50%), rgba(255,255,255,.55), transparent 70%)',
                    }}
        />
        {/* A point of light circling the edge while busy */}
        <span aria-hidden className="gb-ring pointer-events-none absolute inset-0 rounded-full opacity-0" />
        {/* Ripples from the press point */}
        {ripples.map(r => (
          <span
            key={r.id}
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-white"
            style={{ left: r.x, top: r.y, width: 220, height: 220, animation: 'gb-ripple .65s ease-out forwards' }}
          />
        ))}

      </span>

      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon ?? (
          <ArrowRight className="size-4 transition-transform duration-300 group-hover/gb:translate-x-1" />
        )}
      </span>
    </button>
  )
}
