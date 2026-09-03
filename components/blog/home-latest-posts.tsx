'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { BlogPostMeta } from '@/types/blog'
import { BLOG_AUTHOR_IMAGE, resolveAuthorImage } from '@/lib/blog-author'
import { BlogTagList } from '@/components/blog/blog-tag'
import { PixelIcon } from '@/components/pixel-icon'
import { RevealText } from '@/components/reveal-text'
import { cn } from '@/lib/utils'

const LATEST_COUNT = 5

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-muted-foreground bg-muted">
      {children}
    </span>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

function postBanner(post: BlogPostMeta) {
  return post.bannerImage || post.coverUrl || '/images/banners/fikeus-west-2.avif'
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 340, damping: 32 },
  },
}

function HeroPostCard({ post, index }: { post: BlogPostMeta; index: number }) {
  const banner = postBanner(post)
  const date = formatDate(post.date)
  const authorImage = resolveAuthorImage(post.authorImage)

  return (
    <motion.article variants={item} className="h-full">
      <Link
        href="/blog"
        className="group relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-[1.35rem] border border-border/70 bg-card shadow-sm transition-shadow duration-500 hover:shadow-xl hover:shadow-black/[0.06]"
      >
        <div className="absolute left-5 top-5 z-20 flex items-center gap-2">
          <span className="rounded-full border border-white/25 bg-black/45 px-2.5 py-1 text-[10px] font-medium tracking-[0.22em] text-white backdrop-blur-md">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <div className="absolute right-5 top-5 z-20 flex items-center gap-3">
          <div className="relative size-12 overflow-hidden rounded-full border-2 border-white/80 bg-white/10 shadow-lg ring-2 ring-black/10 sm:size-14">
            <Image
              src={authorImage || BLOG_AUTHOR_IMAGE}
              alt={post.authorName}
              fill
              className="object-cover object-[center_20%]"
              unoptimized
            />
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <Image
            src={banner}
            alt=""
            fill
            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
            sizes="(max-width: 1024px) 100vw, 58vw"
            unoptimized={banner.startsWith('http')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5 transition-opacity duration-500 group-hover:from-black/90" />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-wide text-white/55">
            <span className="font-medium text-white/75">{post.authorName}</span>
            {date && (
              <>
                <span aria-hidden>·</span>
                <time dateTime={post.date ?? undefined}>{date}</time>
              </>
            )}
            {post.readingMinutes != null && (
              <>
                <span aria-hidden>·</span>
                <span>{post.readingMinutes} min</span>
              </>
            )}
          </div>
          <h3 className="text-2xl sm:text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white text-balance">
            {post.title}
          </h3>
          {post.summary && (
            <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-white/65">{post.summary}</p>
          )}
          {post.tags.length > 0 && (
            <div className="mt-4 opacity-90 [&_span]:text-white/90">
              <BlogTagList tags={post.tags.slice(0, 3)} align="start" />
            </div>
          )}
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.14em] uppercase text-white/80 transition-colors group-hover:text-white">
            View blog
            <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}

function CompactPostCard({ post, index }: { post: BlogPostMeta; index: number }) {
  const banner = postBanner(post)
  const date = formatDate(post.date)

  return (
    <motion.article variants={item}>
      <Link
        href="/blog"
        className="group flex gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-3 transition-all duration-500 hover:border-foreground/15 hover:bg-card hover:shadow-lg hover:shadow-black/[0.04]"
      >
        <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl sm:h-[96px] sm:w-[96px]">
          <Image
            src={banner}
            alt=""
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="96px"
            unoptimized={banner.startsWith('http')}
          />
          <span className="absolute left-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold tracking-widest text-white backdrop-blur-sm">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <div className="mb-1 flex items-center gap-2 text-[10px] tracking-wide text-muted-foreground">
            {date && <time dateTime={post.date ?? undefined}>{date}</time>}
            {post.readingMinutes != null && <span>{post.readingMinutes} min</span>}
          </div>
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-foreground transition-colors group-hover:text-foreground/90">
            {post.title}
          </h3>
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-foreground">
            View blog
            <ArrowUpRight className="size-3 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="min-h-[420px] animate-pulse rounded-[1.35rem] bg-muted lg:col-span-7" />
      <div className="grid gap-4 lg:col-span-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

export function HomeLatestPosts() {
  const [posts, setPosts] = useState<BlogPostMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/blog?action=posts&limit=${LATEST_COUNT}`, { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setReady(false)
          setPosts([])
          return
        }
        setPosts((json.posts ?? []).slice(0, LATEST_COUNT))
        setReady(true)
      } catch {
        if (!cancelled) {
          setReady(false)
          setPosts([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!loading && (!ready || posts.length === 0)) return null

  const hero = posts[0]
  const rest = posts.slice(1, LATEST_COUNT)

  return (
    <section
      id="writing"
      className="relative overflow-hidden border-t border-border py-28 px-6 md:px-12 lg:px-20"
    >
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-violet-500/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-amber-400/[0.05] blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <PixelIcon type="writing" size={40} />
            <div className="mt-4">
              <Tag>BLOG</Tag>
            </div>
            <RevealText className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {'My writing.'}
            </RevealText>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 self-start rounded-full border border-border px-4 py-2.5 text-xs tracking-[0.14em] uppercase text-muted-foreground transition-all hover:border-foreground/25 hover:text-foreground hover:bg-muted/40 md:self-auto"
          >
            All posts
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className={cn(
              'grid gap-5',
              posts.length === 1 ? 'max-w-3xl' : 'lg:grid-cols-12',
            )}
          >
            {hero && (
              <div className={cn(posts.length === 1 ? 'w-full' : 'lg:col-span-7')}>
                <HeroPostCard post={hero} index={0} />
              </div>
            )}

            {rest.length > 0 && (
              <div className="grid content-start gap-4 lg:col-span-5">
                {rest.map((post, i) => (
                  <CompactPostCard key={post.id} post={post} index={i + 1} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
