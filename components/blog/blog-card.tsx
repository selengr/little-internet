'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import type { BlogPostMeta } from '@/types/blog'
import { BLOG_AUTHOR_IMAGE } from '@/lib/blog-author'
import { formatBlogDate } from '@/lib/blog-date'
import { BlogTagList } from '@/components/blog/blog-tag'
import styles from './blog-card.module.css'

/** Stripe weights — mirrors the original Lottie bar rhythm. */
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

function BlogCardStripes() {
  return (
    <div className={styles.stripeStage} aria-hidden>
      {STRIPE_BARS.map((bar, i) => (
        <motion.span
          key={i}
          className={bar.tone === 'light' ? styles.stripeBarLight : styles.stripeBarDeep}
          style={{ flexGrow: bar.weight }}
          initial={{ scaleX: 0, opacity: 0.6 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ scaleX: 0, opacity: 0 }}
          transition={{
            duration: 0.62,
            delay: i * 0.028,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  )
}

export function BlogCard({ post }: { post: BlogPostMeta }) {
  const [hovered, setHovered] = useState(false)
  const banner = post.bannerImage || post.coverUrl || '/images/banners/https___west.avif'
  const date = formatBlogDate(post.date)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={styles.card}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
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

        <AnimatePresence>
          {hovered && (
            <motion.div
              className={styles.stripeOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <BlogCardStripes />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className={styles.imageSheen}
          aria-hidden
          initial={false}
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? '120%' : '-30%' }}
          transition={{ duration: hovered ? 0.85 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
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
