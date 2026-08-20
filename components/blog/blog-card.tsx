import Link from 'next/link'
import Image from 'next/image'
import type { BlogPostMeta } from '@/types/blog'
import { BLOG_AUTHOR_IMAGE } from '@/lib/blog-author'
import { BlogTagList } from '@/components/blog/blog-tag'

function formatDate(iso: string | null) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function BlogCard({ post }: { post: BlogPostMeta }) {
  const banner = post.bannerImage || post.coverUrl || '/images/banners/https___west.avif'
  const date = formatDate(post.date)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-[22px] bg-[#f5f5f7]/80 dark:bg-white/[0.04] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={banner}
          alt=""
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={banner.startsWith('http')}
        />
        {post.featured && (
          <span className="absolute top-3.5 left-3.5 text-[10px] font-medium uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-black/55 text-white backdrop-blur-sm">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3.5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground tracking-wide">
          {date && <time dateTime={post.date ?? undefined}>{date}</time>}
          {post.readingMinutes != null && (
            <>
              <span className="opacity-40" aria-hidden>
                ·
              </span>
              <span>{post.readingMinutes} min</span>
            </>
          )}
          <span className="opacity-40" aria-hidden>
            ·
          </span>
          <span>{post.views} views</span>
        </div>

        <h2 className="text-[1.35rem] sm:text-[1.5rem] font-semibold tracking-[-0.03em] leading-snug text-balance">
          {post.title}
        </h2>

        {post.summary && (
          <p className="text-[15px] text-muted-foreground leading-[1.55] line-clamp-3">
            {post.summary}
          </p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {post.tags.slice(0, 3).map(tag => (
              <BlogTag key={tag} tag={tag} size="sm" />
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2.5 pt-2">
          <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-[#e8e8ed]">
            <Image
              src={post.authorImage || BLOG_AUTHOR_IMAGE}
              alt=""
              fill
              className="object-cover object-[center_20%]"
              unoptimized
            />
          </div>
          <span className="text-[13px] text-muted-foreground truncate">{post.authorName}</span>
        </div>
      </div>
    </Link>
  )
}
