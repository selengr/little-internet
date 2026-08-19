import { createApi } from 'unsplash-js'
import type { AssetBasic, AssetFull, CollectionBasic, TopicBasic } from 'unsplash-js'
import type {
  UnsplashCollectionView,
  UnsplashPhotoView,
  UnsplashTopicView,
  UnsplashUserView,
} from '@/types/unsplash'

export const UNSPLASH_API = 'https://api.unsplash.com'

export const PHOTO_CATEGORIES = [
  { id: 'nature', label: 'Nature', query: 'nature', emoji: '🌿' },
  { id: 'travel', label: 'Travel', query: 'travel', emoji: '✈️' },
  { id: 'people', label: 'People', query: 'people portrait', emoji: '👤' },
  { id: 'architecture', label: 'Architecture', query: 'architecture', emoji: '🏛️' },
  { id: 'animals', label: 'Animals', query: 'animals wildlife', emoji: '🐾' },
  { id: 'food', label: 'Food', query: 'food', emoji: '🍽️' },
  { id: 'technology', label: 'Technology', query: 'technology', emoji: '💻' },
  { id: 'fashion', label: 'Fashion', query: 'fashion', emoji: '👗' },
  { id: 'cars', label: 'Cars', query: 'cars automotive', emoji: '🚗' },
  { id: 'space', label: 'Space', query: 'space galaxy', emoji: '🌌' },
  { id: 'minimal', label: 'Minimal', query: 'minimal', emoji: '◻️' },
  { id: 'dark', label: 'Dark', query: 'dark moody', emoji: '🌑' },
] as const

export const SEARCH_SUGGESTIONS = [
  'mountains',
  'coffee',
  'city night',
  'cyberpunk',
  'ocean',
  'forest',
  'minimal desk',
] as const

export function getUnsplashClient() {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim()
  if (!accessKey) {
    throw new Error(
      'Missing UNSPLASH_ACCESS_KEY. Add it to .env.local locally, and to Vercel Environment Variables for production.',
    )
  }
  return createApi({ accessKey })
}

export function unsplashError(error: unknown): string {
  if (typeof error === 'string' && error.trim()) return error.trim()
  if (error && typeof error === 'object' && 'errors' in error) {
    const errors = (error as { errors?: string[] }).errors
    if (errors?.length) return errors.join(', ')
  }
  return 'Unsplash request failed'
}

function mapUser(user: AssetBasic['user']): UnsplashUserView {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio ?? null,
    location: user.location ?? null,
    avatar: user.profile_image?.medium ?? user.profile_image?.small ?? '',
    profileUrl: user.links?.html ?? `https://unsplash.com/@${user.username}`,
    totalCollections: user.total_collections,
  }
}

export function mapPhoto(photo: AssetBasic | AssetFull): UnsplashPhotoView {
  const photographer = mapUser(photo.user)
  const full = photo as AssetFull
  const likes =
    full.downloads ??
    photo.statistics?.views?.total ??
    photo.statistics?.downloads?.total ??
    0

  return {
    id: photo.id,
    description: photo.description ?? null,
    alt: photo.description ?? `Photo by ${photographer.name}`,
    width: photo.width,
    height: photo.height,
    color: photo.color ?? '#1a1a1a',
    blurHash: photo.blur_hash ?? null,
    createdAt: photo.created_at,
    likes,
    urls: {
      thumb: photo.urls.thumb,
      small: photo.urls.small,
      regular: photo.urls.regular,
      full: photo.urls.full,
    },
    photographer,
    links: {
      html: photo.links.html,
      download: photo.links.download,
      downloadLocation: photo.links.download_location,
    },
    tags: (full.tags ?? []).map(t => ('title' in t ? t.title : '')).filter(Boolean),
  }
}

export function mapCollection(collection: CollectionBasic): UnsplashCollectionView {
  return {
    id: collection.id,
    title: collection.title,
    description: collection.description ?? null,
    totalPhotos: collection.total_photos,
    coverUrl:
      collection.cover_photo?.urls?.regular ??
      collection.cover_photo?.urls?.small ??
      null,
    coverColor: collection.cover_photo?.color ?? null,
  }
}

export function mapTopic(topic: TopicBasic): UnsplashTopicView {
  return {
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    description: topic.description ?? null,
    coverUrl: topic.cover_photo?.urls?.regular ?? topic.cover_photo?.urls?.small ?? null,
    totalPhotos: topic.total_photos ?? 0,
  }
}

export function formatPhotoCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

const SAVED_KEY = 'unsplash-saved-photos'

export function loadSavedPhotos(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function toggleSavedPhoto(id: string): boolean {
  const saved = loadSavedPhotos()
  const exists = saved.includes(id)
  const next = exists ? saved.filter(x => x !== id) : [id, ...saved]
  localStorage.setItem(SAVED_KEY, JSON.stringify(next.slice(0, 200)))
  return !exists
}

export function isPhotoSaved(id: string) {
  return loadSavedPhotos().includes(id)
}
