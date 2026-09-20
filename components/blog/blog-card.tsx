import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import type { BlogPostMeta } from '@/types/blog'
import { BLOG_AUTHOR_IMAGE } from '@/lib/blog-author'
import { formatBlogDate } from '@/lib/blog-date'
import { BlogTagList } from '@/components/blog/blog-tag'
import styles from './blog-card.module.css'

export function BlogCard({ post }: { post: BlogPostMeta }) {
  const banner = post.bannerImage || post.coverUrl || '/images/banners/https___west.avif'
  const date = formatBlogDate(post.date)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={styles.card}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
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
          </div>
        </div>

        {post.tags.length > 0 && <BlogTagList tags={post.tags.slice(0, 6)} align="start" />}

        <div className={styles.footer}>
          <span className={styles.footerViews}>{post.views} views</span>
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
          <span className={styles.footerArrow} aria-hidden>
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </section>
    </Link>
  )
}
