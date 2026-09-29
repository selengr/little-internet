import type { CSSProperties } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import styles from './blog-card.module.css'

// Exact sizes live in inline styles (not arbitrary Tailwind values) so they always apply.
const bar = (width: string, height: string): CSSProperties => ({ width, height })

/** Placeholder with the same box sizes as BlogCard, so the grid doesn't shift when posts load. */
export function BlogCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      {/* Same as .imageWrap: 198px tall, 1rem radius */}
      <Skeleton style={{ width: '100%', height: 198, borderRadius: '1rem' }} />

      <section className={styles.body}>
        {/* Same as .title: clamp font-size, two 1.2em lines + 4px padding top and bottom */}
        <div
          className="flex flex-col justify-center"
          style={{
            fontSize: 'clamp(1.35rem, 2.4vw, 2rem)',
            minHeight: 'calc(1.2em * 2 + 8px)',
            padding: '4px 0',
            gap: '0.4em',
          }}
        >
          <Skeleton style={bar('92%', '0.8em')} />
          <Skeleton style={bar('58%', '0.8em')} />
        </div>

        <div className={styles.details}>
          {/* Same as .description: 14px, two 1.45em lines + 4px padding top and bottom */}
          <div
            className="flex flex-col justify-center"
            style={{ fontSize: 14, minHeight: 'calc(1.45em * 2 + 8px)', padding: '4px 0', gap: 8 }}
          >
            <Skeleton style={bar('100%', '12px')} />
            <Skeleton style={bar('76%', '12px')} />
          </div>
          {/* .metaRow gets its height from a 12px text line; the zero-width space reproduces it */}
          <div className={styles.metaRow}>
            <span>{'​'}</span>
            <Skeleton style={bar('80px', '12px')} />
            <Skeleton style={bar('56px', '12px')} />
            <Skeleton style={bar('48px', '12px')} />
          </div>
        </div>

        {/* Same as the tag list: 4px top padding, 6px gap, 18px pills */}
        <div className="flex" style={{ paddingTop: 4, gap: 6 }}>
          <Skeleton style={{ ...bar('48px', '18px'), borderRadius: 3 }} />
          <Skeleton style={{ ...bar('64px', '18px'), borderRadius: 3 }} />
          <Skeleton style={{ ...bar('40px', '18px'), borderRadius: 3 }} />
        </div>

        <div className={styles.footer}>
          <Skeleton style={{ width: 28, height: 28, borderRadius: 9999, flexShrink: 0 }} />
          <Skeleton style={bar('112px', '12px')} />
        </div>
      </section>
    </div>
  )
}

export function BlogGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="flex flex-wrap justify-between items-stretch gap-y-12 gap-x-[4%] mt-4"
      role="status"
      aria-label="Loading posts"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-full min-[712px]:w-[48%]">
          <BlogCardSkeleton />
        </div>
      ))}
    </div>
  )
}
