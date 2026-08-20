/** Shared author assets for blog UI */
export const BLOG_AUTHOR_NAME = 'Reza Karbakhsh'
export const BLOG_AUTHOR_IMAGE = '/images/authors/reza.jpg'
export const BLOG_AUTHOR_IMAGE_PNG = '/images/authors/reza-edited.png'
export const BLOG_AUTHOR_IMAGE_ORIGINAL = '/images/authors/reza-original.jpg'

/** Always serve author photo from this site (Notion URL fields may point at stale prod URLs). */
export function resolveAuthorImage(_fromNotion?: string | null) {
  return BLOG_AUTHOR_IMAGE
}

/** Prefer local `/images/...` paths when Notion stores a full site URL. */
export function resolveBannerImage(fromNotion?: string | null) {
  if (!fromNotion) return null
  if (fromNotion.startsWith('/')) return fromNotion
  try {
    const { pathname } = new URL(fromNotion)
    if (pathname.startsWith('/images/')) return pathname
  } catch {
    // keep raw value
  }
  return fromNotion
}
