'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share2, X } from 'lucide-react'
import type { UnsplashPhotoView, UnsplashUserView } from '@/types/unsplash'

interface PhotoDetailModalProps {
  photo: UnsplashPhotoView | null
  onClose: () => void
  onDownload: () => void
  onShare: () => void
  onPhotographerClick: (user: UnsplashUserView) => void
}

export function PhotoDetailModal({
  photo,
  onClose,
  onDownload,
  onShare,
  onPhotographerClick,
}: PhotoDetailModalProps) {
  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-none sm:rounded-3xl border border-white/10 bg-[#0c0c0e] shadow-2xl sm:grid-cols-[1.2fr_0.8fr] max-h-[100dvh] sm:max-h-[90vh]"
          >
            <div className="relative min-h-[40vh] sm:min-h-0 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.urls.regular}
                alt={photo.alt}
                className="h-full w-full object-contain sm:object-cover max-h-[50vh] sm:max-h-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 rounded-full border border-white/15 bg-black/50 p-2 text-white/80 backdrop-blur-md hover:bg-black/70 sm:hidden"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col overflow-y-auto p-6 sm:p-8">
              <div className="mb-6 hidden sm:flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 p-2 text-white/60 hover:bg-white/5 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <h2 className="text-2xl font-light tracking-tight text-white mb-1">
                {photo.description ?? photo.alt}
              </h2>

              <button
                type="button"
                onClick={() => onPhotographerClick(photo.photographer)}
                className="mt-4 flex items-center gap-3 text-left group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photographer.avatar}
                  alt=""
                  className="size-10 rounded-full ring-2 ring-white/10"
                />
                <div>
                  <p className="text-sm font-medium text-white group-hover:underline">
                    {photo.photographer.name}
                  </p>
                  <p className="text-xs text-white/45">@{photo.photographer.username}</p>
                </div>
              </button>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">Likes</p>
                  <p className="font-mono text-white">{photo.likes.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">Size</p>
                  <p className="font-mono text-white">{photo.width} × {photo.height}</p>
                </div>
              </div>

              {photo.tags.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.slice(0, 8).map(tag => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-8 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onDownload}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-white/90"
                >
                  <Download className="size-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={onShare}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5"
                >
                  <Share2 className="size-4" />
                  Share
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface PhotographerPanelProps {
  user: UnsplashUserView | null
  photos: UnsplashPhotoView[]
  loading?: boolean
  onClose: () => void
  onPhotoClick: (photo: UnsplashPhotoView) => void
}

export function PhotographerPanel({
  user,
  photos,
  loading,
  onClose,
  onPhotoClick,
}: PhotographerPanelProps) {
  return (
    <AnimatePresence>
      {user && (
        <motion.div
          className="fixed inset-0 z-[110] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0c0c0e] p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar} alt="" className="size-16 rounded-full ring-2 ring-white/10" />
                <div>
                  <h3 className="text-xl font-light text-white">{user.name}</h3>
                  <p className="text-sm text-white/45">@{user.username}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-full border border-white/10 p-2 text-white/60">
                <X className="size-4" />
              </button>
            </div>

            {user.bio && <p className="text-sm text-white/55 leading-relaxed mb-6">{user.bio}</p>}

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-2xl font-light text-white">{user.totalPhotos ?? '—'}</p>
                <p className="text-xs text-white/40 mt-1">Photos</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-2xl font-light text-white">{user.totalCollections ?? '—'}</p>
                <p className="text-xs text-white/40 mt-1">Collections</p>
              </div>
            </div>

            <h4 className="text-[11px] uppercase tracking-[0.2em] text-white/35 mb-4">Portfolio</h4>
            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-white/10 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {photos.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPhotoClick(p)}
                    className="overflow-hidden rounded-xl ring-1 ring-white/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.urls.small} alt={p.alt} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
