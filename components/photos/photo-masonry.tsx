'use client'

import { cn } from '@/lib/utils'
import type { UnsplashPhotoView } from '@/types/unsplash'

function MasonrySkeleton() {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'break-inside-avoid rounded-2xl bg-white/10 animate-pulse',
            i % 3 === 0 ? 'h-72' : i % 3 === 1 ? 'h-52' : 'h-64',
          )}
        />
      ))}
    </div>
  )
}

interface PhotoMasonryProps {
  photos: UnsplashPhotoView[]
  loading?: boolean
  onPhotoClick: (photo: UnsplashPhotoView) => void
  onDownload?: (photo: UnsplashPhotoView) => void
  className?: string
}

export function PhotoMasonry({
  photos,
  loading,
  onPhotoClick,
  onDownload,
  className,
}: PhotoMasonryProps) {
  if (loading && photos.length === 0) {
    return <MasonrySkeleton />
  }

  if (!loading && photos.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-16 text-center">
        <p className="text-white/50 text-sm">No photos found. Try another search or category.</p>
      </div>
    )
  }

  return (
    <div className={cn('columns-2 md:columns-3 lg:columns-4 gap-3', className)}>
      {photos.map(photo => {
        const ratio = photo.height / photo.width
        return (
          <article
            key={photo.id}
            className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-black/20 ring-1 ring-white/10"
          >
            <button
              type="button"
              onClick={() => onPhotoClick(photo)}
              className="block w-full text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.urls.small}
                alt={photo.alt}
                className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ aspectRatio: `${photo.width}/${photo.height}`, minHeight: ratio > 1.2 ? 220 : 140 }}
                loading="lazy"
              />
            </button>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onPhotoClick(photo)
                }}
                className="min-w-0 flex-1 text-left pointer-events-auto"
              >
                <p className="truncate text-xs font-medium text-white">{photo.photographer.name}</p>
              </button>
              <div className="flex items-center gap-1.5 pointer-events-auto">
                {onDownload && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      onDownload(photo)
                    }}
                    className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1.5 text-[11px] text-white/80 backdrop-blur-md hover:bg-white/10"
                  >
                    ↓
                  </button>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export { MasonrySkeleton }
