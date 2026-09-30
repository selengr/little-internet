import { NextRequest, NextResponse } from 'next/server'
import type { AssetBasic, AssetFull, CollectionBasic } from 'unsplash-js'
import {
  getUnsplashClient,
  mapCollection,
  mapPhoto,
  mapTopic,
  unsplashError,
} from '@/lib/unsplash'

export const dynamic = 'force-dynamic'

function err(message: string, status = 502) {
  return NextResponse.json({ error: message }, { status })
}

async function handle(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const action = searchParams.get('action') ?? 'latest'

  try {
    const client = getUnsplashClient()
    const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1)
    const perPage = Math.min(Math.max(Number(searchParams.get('per_page') ?? '12') || 12, 1), 30)

    if (action === 'hero' || action === 'random') {
      const query = searchParams.get('query') ?? undefined
      const orientation = searchParams.get('orientation') as
        | 'landscape'
        | 'portrait'
        | 'squarish'
        | undefined

      const { data, error } = await client.GET('/photos/random', {
        params: {
          query: {
            count: 1,
            query,
            orientation,
          },
        },
      })

      if (error) return err(unsplashError(error))
      const photo = Array.isArray(data) ? data[0] : data
      if (!photo) return err('No photo found', 404)

      return NextResponse.json({ photo: mapPhoto(photo) })
    }

    if (action === 'latest') {
      const { data, error } = await client.GET('/photos', {
        params: {
          query: { page, per_page: perPage },
        },
      })

      if (error) return err(unsplashError(error))

      return NextResponse.json({
        photos: (data ?? []).map(mapPhoto),
        page,
      })
    }

    if (action === 'search') {
      const query = searchParams.get('query')?.trim()
      if (!query) return err('query is required', 400)

      const orientation = searchParams.get('orientation') as
        | 'landscape'
        | 'portrait'
        | 'squarish'
        | undefined
      const color = searchParams.get('color') ?? undefined
      const orderBy = (searchParams.get('order_by') ?? 'relevant') as 'relevant' | 'latest'

      const { data, error } = await client.GET('/search/photos', {
        params: {
          query: {
            query,
            page,
            per_page: perPage,
            orientation,
            color: color as never,
            order_by: orderBy,
          },
        },
      })

      if (error) return err(unsplashError(error))

      return NextResponse.json({
        photos: (data?.results ?? []).map(mapPhoto),
        total: data?.total ?? 0,
        page,
        query,
      })
    }

    if (action === 'collections') {
      const { data, error } = await client.GET('/collections', {
        params: {
          query: { page, per_page: perPage },
        },
      })

      if (error) return err(unsplashError(error))

      return NextResponse.json({
        collections: (data ?? []).map((c: CollectionBasic) => mapCollection(c)),
        page,
      })
    }

    if (action === 'collection') {
      const id = searchParams.get('id')
      if (!id) return err('id is required', 400)

      const { data, error } = await client.GET('/collections/{collectionId}/photos', {
        params: {
          path: { collectionId: id },
          query: { page, per_page: perPage },
        },
      })

      if (error) return err(unsplashError(error))

      return NextResponse.json({
        photos: (data ?? []).map(mapPhoto),
        page,
        collectionId: id,
      })
    }

    if (action === 'photo') {
      const id = searchParams.get('id')
      if (!id) return err('id is required', 400)

      const { data, error } = await client.GET('/photos/{assetSlug}', {
        params: { path: { assetSlug: id } },
      })

      if (error) return err(unsplashError(error))
      if (!data) return err('Photo not found', 404)

      return NextResponse.json({ photo: mapPhoto(data as AssetFull) })
    }

    if (action === 'user') {
      const username = searchParams.get('username')
      if (!username) return err('username is required', 400)

      const [userRes, photosRes] = await Promise.all([
        client.GET('/users/{username}', { params: { path: { username } } }),
        client.GET('/users/{username}/photos', {
          params: {
            path: { username },
            query: { page, per_page: perPage, order_by: 'popular' },
          },
        }),
      ])

      if (userRes.error) return err(unsplashError(userRes.error))
      if (!userRes.data) return err('User not found', 404)

      const user = userRes.data
      const totalPhotos = Number(photosRes.response?.headers.get('X-Total') ?? 0) || undefined

      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          bio: user.bio ?? null,
          location: user.location ?? null,
          avatar: user.profile_image?.medium ?? user.profile_image?.small ?? '',
          profileUrl: user.links?.html ?? `https://unsplash.com/@${user.username}`,
          totalPhotos,
          totalCollections: user.total_collections,
        },
        photos: (photosRes.data ?? []).map(mapPhoto),
        page,
      })
    }

    if (action === 'topics') {
      const { data, error } = await client.GET('/topics', {
        params: {
          query: { page, per_page: perPage },
        },
      })

      if (error) return err(unsplashError(error))

      return NextResponse.json({
        topics: (data ?? []).map(mapTopic),
        page,
      })
    }

    if (action === 'trending') {
      const { data, error } = await client.GET('/search/photos', {
        params: {
          query: {
            query: 'popular',
            page,
            per_page: perPage,
            order_by: 'latest',
          },
        },
      })

      if (error) return err(unsplashError(error))

      return NextResponse.json({
        photos: (data?.results ?? []).map(mapPhoto),
        page,
      })
    }

    if (action === 'download') {
      const id = searchParams.get('id')
      if (!id) return err('id is required', 400)

      const { data, error } = await client.GET('/photos/{id}/download', {
        params: { path: { id } },
      })

      if (error) return err(unsplashError(error))
      if (!data?.url) return err('Download unavailable', 404)

      return NextResponse.json({ url: data.url })
    }

    return err('Unknown action', 400)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unsplash request failed'
    const status = message.includes('Missing UNSPLASH_ACCESS_KEY') ? 500 : 502
    return err(message, status)
  }
}

// Browse-style lookups change slowly, so let the CDN and browser reuse them. hero/random are
// meant to differ every time and download is a tracked action, so those stay uncached.
const CACHEABLE = new Set(['latest', 'search', 'collections', 'collection', 'trending', 'topics', 'photo', 'user'])

export async function GET(request: NextRequest) {
  const res = await handle(request)
  const action = request.nextUrl.searchParams.get('action') ?? 'latest'
  if (res.ok && CACHEABLE.has(action)) {
    res.headers.set('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=3600')
  }
  return res
}
