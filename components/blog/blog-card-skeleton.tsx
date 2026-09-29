import { Skeleton } from '@/components/ui/skeleton'
import styles from './blog-card.module.css'

/** Placeholder with the same box sizes as BlogCard, so the grid doesn't shift when posts load. */
export function BlogCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      <Skeleton className="h-[198px] w-full rounded-2xl" />

      <section className={styles.body}>
        {/* Two title lines: matches .title (clamp font-size, 1.2 line-height, 4px padding) */}
        <div
          className="flex flex-col justify-center gap-[0.4em] py-1"
          style={{ fontSize: 'clamp(1.35rem, 2.4vw, 2rem)', minHeight: 'calc(1.2em * 2 + 8px)' }}
        >
          <Skeleton className="h-[0.8em] w-[92%]" />
          <Skeleton className="h-[0.8em] w-[58%]" />
        </div>

        <div className={styles.details}>
          {/* Two summary lines: matches .description (14px, 1.45 line-height) */}
          <div
            className="flex flex-col justify-center gap-2 py-1 text-[14px]"
            style={{ minHeight: 'calc(1.45em * 2 + 8px)' }}
          >
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[76%]" />
          </div>
          <div className={styles.metaRow}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>

        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-[18px] w-12 rounded-[3px]" />
          <Skeleton className="h-[18px] w-16 rounded-[3px]" />
          <Skeleton className="h-[18px] w-10 rounded-[3px]" />
        </div>

        <div className={styles.footer}>
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-3 w-28" />
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
