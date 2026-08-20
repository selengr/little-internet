'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { BlogPostMeta } from '@/types/blog'
import { BLOG_AUTHOR_IMAGE } from '@/lib/blog-author'
import { formatBlogDate } from '@/lib/blog-date'
import { BlogTagList } from '@/components/blog/blog-tag'
import styles from './blog-card.module.css'

const STRIPE_BARS = [
  { weight: 2.45, tone: 'light' as const },
  { weight: 0.4, tone: 'light' as const },
  { weight: 1.55, tone: 'light' as const },
  { weight: 2.5, tone: 'light' as const },
  { weight: 0.5, tone: 'light' as const },
  { weight: 1.3, tone: 'light' as const },
  { weight: 1.9, tone: 'light' as const },
  { weight: 1.4, tone: 'light' as const },
  { weight: 0.5, tone: 'deep' as const },
  { weight: 1.9, tone: 'deep' as const },
  { weight: 1.05, tone: 'deep' as const },
  { weight: 1.8, tone: 'deep' as const },
  { weight: 0.75, tone: 'deep' as const },
  { weight: 0.9, tone: 'deep' as const },
  { weight: 2.4, tone: 'deep' as const },
  { weight: 1.8, tone: 'deep' as const },
]

const STRIPE_TOTAL = STRIPE_BARS.reduce((sum, bar) => sum + bar.weight, 0)

export function BlogCard({ post }: { post: BlogPostMeta }) {
  const [hovered, setHovered] = useState(false)
  const banner = post.bannerImage || post.coverUrl || '/images/banners/https___west.avif'
  const date = formatBlogDate(post.date)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={styles.card}
      data-hovered={hovered ? 'true' : 'false'}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.imageWrap}>
        <Image
          src={banner}
          alt=""
          fill
          className={styles.image}
          sizes="(max-width: 712px) 100vw, 48vw"
          unoptimized={banner.startsWith('http')}
        />

        <div className={styles.stripeOverlay} aria-hidden>
          <div className={styles.stripeStage}>
            {STRIPE_BARS.map((bar, i) => (
              <motion.span
                key={i}
                className={bar.tone === 'light' ? styles.stripeBarLight : styles.stripeBarDeep}
                style={{ width: `${(bar.weight / STRIPE_TOTAL) * 100}%` }}
                initial={false}
                animate={{ scaleX: hovered ? 1 : 0 }}
                transition={{
                  duration: 0.5,
                  delay: hovered ? i * 0.03 : (STRIPE_BARS.length - 1 - i) * 0.018,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <section className={styles.body}>
        <h2 className={styles.title}>{post.title}</h2>

        <div className={styles.details}>
          {post.summary && <p className={styles.description}>{post.summary}</p>}

          <div className={styles.metaRow}>
            {date && <time dateTime={post.date ?? undefined}>{date}</time>}
            {post.readingMinutes != null && (
              <>
                {date && (
                  <span className={styles.metaDot} aria-hidden>
                    ·
                  </span>
                )}
                <span>{post.readingMinutes} min read</span>
              </>
            )}
            {(date || post.readingMinutes != null) && (
              <span className={styles.metaDot} aria-hidden>
                ·
              </span>
            )}
            <span>{post.views} views</span>
          </div>
        </div>

        {post.tags.length > 0 && <BlogTagList tags={post.tags.slice(0, 6)} align="start" />}

        <div className={styles.footer}>
          <div className={styles.authorAvatar}>
            <Image
              src={post.authorImage || BLOG_AUTHOR_IMAGE}
              alt=""
              fill
              className="object-cover object-[center_20%]"
              unoptimized
            />
          </div>
          <span className={styles.authorName}>{post.authorName}</span>
        </div>
      </section>
    </Link>
  )
}
