import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Banner from '@/components/views/banner/banner'
import { BlogMarkdown } from '@/components/blog/blog-markdown'
import { BlogNav } from '@/components/blog/blog-nav'
import { BlogTagList } from '@/components/blog/blog-tag'
import { ViewCounter } from '@/components/blog/view-counter'
import { CustomScrollbar } from '@/components/custom-scrollbar'
import { getPostBySlug, listPublishedPosts } from '@/lib/blog'
import { BLOG_AUTHOR_IMAGE } from '@/lib/blog-author'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await getPostBySlug(slug)
    if (!post) return { title: 'Post' }
    return {
      title: post.title,
      description: post.summary ?? post.introduction ?? undefined,
      openGraph: post.bannerImage
        ? { images: [{ url: post.bannerImage }] }
        : undefined,
    }
  } catch {
    return { title: 'Post' }
  }
}

export async function generateStaticParams() {
  try {
    const posts = await listPublishedPosts(48)
    return posts.map(p => ({ slug: p.slug }))
  } catch {
    return []
  }
}

function formatDate(iso: string | null) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  let post
  try {
    post = await getPostBySlug(slug)
  } catch {
    notFound()
  }
  if (!post || post.status !== 'Published') notFound()

  const date = formatDate(post.date)
  const banner = post.bannerImage || '/images/banners/https___west.avif'
  const author = post.authorImage || BLOG_AUTHOR_IMAGE

  return (
    <main
      className="relative min-h-screen bg-background text-foreground overflow-x-clip"
      dir="ltr"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
    >
      <CustomScrollbar mobileOnly />
      <BlogNav label="POST" />

      <section className="relative">
        <Banner banner={banner} user={author} blog title={post.title} videoReady>
          <div className="flex flex-col items-center text-center gap-4" dir="ltr">
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[13px] sm:text-[14px] text-muted-foreground tracking-wide">
              <span className="text-foreground/80 font-medium">{post.authorName}</span>
              {date && (
                <>
                  <span className="opacity-35" aria-hidden>
                    ·
                  </span>
                  <time dateTime={post.date ?? undefined}>{date}</time>
                </>
              )}
              {post.readingMinutes != null && (
                <>
                  <span className="opacity-35" aria-hidden>
                    ·
                  </span>
                  <span>{post.readingMinutes} min read</span>
                </>
              )}
              <span className="opacity-35" aria-hidden>
                ·
              </span>
              <ViewCounter pageId={post.id} initial={post.views} />
            </div>

            {post.tags.length > 0 && <BlogTagList tags={post.tags} />}

            {post.summary && (
              <p className="max-w-[640px] text-[17px] sm:text-[19px] leading-[1.5] text-muted-foreground tracking-[-0.01em] text-balance">
                {post.summary}
              </p>
            )}
          </div>
        </Banner>
      </section>

      <article className="mx-auto w-full max-w-[860px] px-5 sm:px-8 pt-10 sm:pt-14 pb-28">
        {post.introduction && (
          <section className="mb-12">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Introduction
            </h2>
            <BlogMarkdown markdown={post.introduction} />
          </section>
        )}

        <div className="text-[17px] sm:text-[18px] leading-[1.65] tracking-[-0.01em] [&_.blog-prose]:text-[inherit] [&_.blog-prose]:leading-[inherit]">
          <BlogMarkdown markdown={post.markdown} />
        </div>

        {post.conclusion && (
          <section className="mt-14 pt-10 border-t border-border/40">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Conclusion
            </h2>
            <BlogMarkdown markdown={post.conclusion} />
          </section>
        )}

        <footer className="mt-16 flex items-center gap-3.5 pt-10 border-t border-border/35">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={author}
            alt=""
            width={52}
            height={52}
            className="size-[52px] rounded-full object-cover bg-[#f5f5f7]"
          />
          <div>
            <p className="text-[15px] font-semibold tracking-tight">{post.authorName}</p>
            <p className="text-[13px] text-muted-foreground">Author</p>
          </div>
        </footer>
      </article>
    </main>
  )
}
