import cardStyles from './blog-card.module.css'
import styles from './blog-card-skeleton.module.css'

/**
 * Outline-only placeholder for BlogCard. Each section keeps the real card's exact height
 * (measured: 464.39px total), so nothing shifts when the posts arrive.
 */
export function BlogCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      <div className={styles.image} />

      <section className={cardStyles.body}>
        {/* Title box: same clamp font-size, two 1.2em lines + 4px padding as .title */}
        <div
          className="flex flex-col justify-center"
          style={{
            fontSize: 'clamp(1.35rem, 2.4vw, 2rem)',
            minHeight: 'calc(1.2em * 2 + 8px)',
            padding: '4px 0',
            gap: '0.6em',
          }}
        >
          <div className={styles.line} style={{ width: '85%', height: 3 }} />
          <div className={styles.line} style={{ width: '50%', height: 3 }} />
        </div>

        <div className={cardStyles.details}>
          {/* Summary box: 14px, two 1.45em lines + 4px padding as .description */}
          <div
            className="flex flex-col justify-center"
            style={{ fontSize: 14, minHeight: 'calc(1.45em * 2 + 8px)', padding: '4px 0', gap: 12 }}
          >
            <div className={styles.line} style={{ width: '100%' }} />
            <div className={styles.line} style={{ width: '70%' }} />
          </div>
          {/* .metaRow takes its height from a 12px text line; the zero-width space keeps it */}
          <div className={cardStyles.metaRow}>
            <div className={styles.line} style={{ width: 150 }} />
            <span>{'​'}</span>
          </div>
        </div>

        {/* Tag row: 4px top padding, 6px gap, 18px pills */}
        <div className="flex" style={{ paddingTop: 4, gap: 6 }}>
          <div className={styles.pill} style={{ width: 44 }} />
          <div className={styles.pill} style={{ width: 58 }} />
          <div className={styles.pill} style={{ width: 38 }} />
        </div>

        <div className={cardStyles.footer}>
          <div className={styles.avatar} />
          <div className={styles.line} style={{ width: 96 }} />
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
