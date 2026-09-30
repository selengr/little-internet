import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/**
 * Rounded loading placeholder with a soft light sweep (same feel as the /crypto skeleton).
 * `tone` is the page's foreground colour (e.g. `var(--jk-fg)`), so bones match each theme.
 * Render <ShimmerKeyframes /> once per skeleton.
 */
export function ShimmerBone({
  tone,
  className,
  style,
}: {
  tone: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      aria-hidden
      className={cn('relative overflow-hidden rounded-md', className)}
      style={{ background: `color-mix(in srgb, ${tone} 7%, transparent)`, ...style }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: 'translateX(-100%)',
          animation: 'shimmer-bone 1.6s ease-in-out infinite',
          background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${tone} 8%, transparent), transparent)`,
        }}
      />
    </div>
  )
}

export function ShimmerKeyframes() {
  return (
    <style>{`
      @keyframes shimmer-bone { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) {
        [style*="shimmer-bone"] { animation: none !important; opacity: 0; }
      }
    `}</style>
  )
}
