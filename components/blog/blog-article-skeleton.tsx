import styles from './blog-card-skeleton.module.css'

const PARAGRAPHS = [
  ['96%', '100%', '88%', '62%'],
  ['100%', '93%', '97%', '45%'],
  ['91%', '100%', '70%'],
]

/** Outline-style placeholder for a post body while its markdown streams in. */
export function BlogArticleSkeleton() {
  return (
    <div className={styles.card} role="status" aria-label="Loading post" style={{ borderRadius: 0 }}>
      <div className="flex flex-col gap-12 py-2">
        {PARAGRAPHS.map((lines, i) => (
          <div key={i} className="flex flex-col gap-[1.1em]">
            <div className={styles.line} style={{ width: i === 0 ? '46%' : '38%', height: 3 }} />
            <div className="flex flex-col gap-[0.95em] pt-2">
              {lines.map((w, j) => (
                <div key={j} className={styles.line} style={{ width: w }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
