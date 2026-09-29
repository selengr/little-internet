import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getBlogConfigStatus, listPublishedPosts } from '@/lib/blog'
import { BLOG_AUTHOR_IMAGE } from '@/lib/blog-author'
import Banner from '@/components/views/banner/banner'
import { BlogCard } from '@/components/blog/blog-card'
import { BlogGridSkeleton } from '@/components/blog/blog-card-skeleton'
import { CustomScrollbar } from '@/components/custom-scrollbar'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

export const metadata = {
  title: 'Blog',
  description:
    'Personal writing by Reza Karbakhsh — notes on building, learning, AI, and ideas worth keeping on Little Internet.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog · Little Internet',
    description:
      'Personal writing by Reza Karbakhsh — notes on building, learning, AI, and ideas worth keeping.',
    url: '/blog',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

function BlogListNav() {
  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none" dir="ltr">
      <div
        className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
        style={NAV_GLASS}
      >
        <ThemeToggle />
        <span className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
          BLOG
        </span>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-black/10 dark:border-white/20 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] transition-all duration-200 tracking-wide"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Back home
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}

/** Fetches from Notion; streamed in behind a skeleton so the nav and banner render immediately. */
async function BlogPostGrid() {
  // Run the config check and the posts query in parallel rather than one after the other.
  const [status, result] = await Promise.all([
    getBlogConfigStatus(),
    listPublishedPosts(48).then(
      posts => ({ posts, error: null }),
      (err: unknown) => ({
        posts: [],
        error: err instanceof Error ? err.message : 'Failed to load posts',
      }),
    ),
  ])

  if (!status.ready) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Blog unavailable</h2>
        <p className="mt-4 text-[15px] text-muted-foreground leading-relaxed">{status.message}</p>
        <p className="mt-6 text-[13px] text-muted-foreground leading-relaxed">
          On Vercel: Project → Settings → Environment Variables → add{' '}
          <code className="text-foreground">NOTION_API_KEY</code> and{' '}
          <code className="text-foreground">NOTION_BLOG_DATABASE_ID</code> for Production, then
          redeploy.
        </p>
      </div>
    )
  }

  const { posts, error } = result

  if (error) return <p className="text-sm text-red-500 text-center">{error}</p>

  if (posts.length === 0) {
    return (
      <p className="text-[15px] text-muted-foreground text-center py-20">No published posts yet.</p>
    )
  }

  return (
    <div className="flex flex-wrap justify-between items-stretch gap-y-12 gap-x-[4%] mt-4">
      {posts.map(post => (
        <div key={post.id} className="w-full min-[712px]:w-[48%]">
          <BlogCard post={post} />
        </div>
      ))}
    </div>
  )
}

export default function BlogPage() {
  return (
    <main
      className="relative min-h-screen bg-background text-foreground overflow-x-clip"
      dir="ltr"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
    >
      <CustomScrollbar mobileOnly />
      <BlogListNav />

      <section className="relative">
        <Banner
          banner="/images/banners/fikeus-west-2.avif"
          user={BLOG_AUTHOR_IMAGE}
          blog
          title="Writing"
          videoReady
        >
          <p
            className="text-center text-[17px] sm:text-[19px] leading-[1.5] text-muted-foreground tracking-[-0.01em]"
            dir="ltr"
          >
            Hi, I write here about what I&apos;m building, what I&apos;m learning,
            and the ideas I want to keep.
          </p>
        </Banner>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-5 sm:px-8 pt-10 sm:pt-14 pb-28">
        <Suspense fallback={<BlogGridSkeleton />}>
          <BlogPostGrid />
        </Suspense>
      </section>
    </main>
  )
}
