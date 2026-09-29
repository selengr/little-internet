// TEMPORARY: side-by-side measurement of BlogCard vs BlogCardSkeleton. Delete after checking.
import { listPublishedPosts } from '@/lib/blog'
import { BlogCard } from '@/components/blog/blog-card'
import { BlogCardSkeleton } from '@/components/blog/blog-card-skeleton'

export const dynamic = 'force-dynamic'

export default async function SkeletonCheck() {
  const posts = await listPublishedPosts(48)
  return (
    <main
      className="bg-background text-foreground"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
    >
      <section className="mx-auto w-full max-w-[1200px] px-5 sm:px-8 pt-10 pb-28">
        <div className="flex flex-wrap justify-between items-start gap-y-12 gap-x-[4%]">
          {posts.map(post => (
            <div key={post.id} className="w-full min-[712px]:w-[48%]" data-check="real">
              <BlogCard post={post} />
            </div>
          ))}
          {[0, 1].map(i => (
            <div key={i} className="w-full min-[712px]:w-[48%]" data-check="skeleton">
              <BlogCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
