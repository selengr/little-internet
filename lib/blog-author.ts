/** Shared author assets for blog UI */
export const BLOG_AUTHOR_NAME = 'Reza Karbakhsh'
export const BLOG_AUTHOR_IMAGE = '/images/authors/reza.jpg'
export const BLOG_AUTHOR_IMAGE_PNG = '/images/authors/reza-edited.png'
export const BLOG_AUTHOR_IMAGE_ORIGINAL = '/images/authors/reza-original.jpg'
export const BLOG_CS_IT_BANNER = '/images/banners/s3-us-west-2.avif'

/** Always serve author photo from this site (Notion URL fields may point at stale prod URLs). */
export function resolveAuthorImage(_fromNotion?: string | null) {
  return BLOG_AUTHOR_IMAGE
}

/** Prefer local `/images/...` paths when Notion stores a full site URL. */
export function resolveBannerImage(fromNotion?: string | null) {
  if (!fromNotion) return null
  if (fromNotion.includes('s3-us-west-2') || fromNotion.includes('https2F')) {
    return BLOG_CS_IT_BANNER
  }
  if (fromNotion.startsWith('/')) return fromNotion
  try {
    const { pathname } = new URL(fromNotion)
    if (pathname.includes('s3-us-west-2') || pathname.includes('https2F')) {
      return BLOG_CS_IT_BANNER
    }
    if (pathname.startsWith('/images/')) return pathname
  } catch {
    // keep raw value
  }
  return fromNotion
}
