"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { BookOpen } from "lucide-react"
import type { Artwork } from "@/types/artwork"
import { cn } from "@/lib/utils"

interface ArtworkCardProps {
  artwork: Artwork
  isActive: boolean
  dragOffset: number
  index: number
  currentIndex: number
  onSelect?: (artwork: Artwork) => void
}

export function ArtworkCard({ artwork, isActive, dragOffset, index, currentIndex, onSelect }: ArtworkCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imgSrc, setImgSrc] = useState(artwork.image)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgSrc(artwork.image)
    setImgFailed(false)
  }, [artwork.image])
  const distance = index - currentIndex
  const parallaxOffset = dragOffset * (0.1 * (distance + 1))

  return (
    <motion.div
      className={cn('relative flex-shrink-0', onSelect && 'cursor-pointer')}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect && isActive ? 0 : undefined}
      onClick={() => {
        if (onSelect && isActive) onSelect(artwork)
      }}
      onKeyDown={e => {
        if (onSelect && isActive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(artwork)
        }
      }}
      animate={{
        scale: isActive ? 1 : 0.85,
        opacity: isActive ? 1 : 0.5,
        rotateY: distance * 5,
      }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      style={{
        x: parallaxOffset,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="group relative overflow-hidden rounded-2xl"
        animate={{
          y: isHovered && isActive ? -10 : 0,
          boxShadow: isHovered && isActive ? "0 40px 80px -20px rgba(0,0,0,0.8)" : "0 20px 40px -10px rgba(0,0,0,0.5)",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Glassmorphism frame */}
        <div className="absolute inset-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm" />

        {/* Image container */}
        <div className="relative h-[300px] w-[300px] overflow-hidden rounded-2xl p-3 md:h-[350px] md:w-[350px]">
          {!imgFailed ? (
            <motion.img
              key={imgSrc}
              src={imgSrc}
              alt={artwork.title}
              className="h-full w-full rounded-xl object-cover bg-stone-800"
              animate={{
                scale: isHovered && isActive ? 1.05 : 1,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              draggable={false}
              onError={() => {
                if (artwork.coverFallback && imgSrc !== artwork.coverFallback) {
                  setImgSrc(artwork.coverFallback)
                  return
                }
                setImgFailed(true)
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-violet-900/40 to-amber-900/30 p-6 text-center">
              <BookOpen className="size-10 text-white/30 mb-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40" />
            </div>
          )}

          {/* Gradient overlay for text */}
          <motion.div
            className="absolute inset-x-3 bottom-3 rounded-b-xl bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            initial={{ opacity: 0, height: "30%" }}
            animate={{
              opacity: isActive ? 1 : 0,
              height: isHovered ? "50%" : "30%",
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Artwork info */}
          <motion.div
            className="absolute inset-x-3 bottom-3 select-none p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isActive ? 1 : 0,
              y: isActive ? 0 : 20,
            }}
            transition={{ duration: 0.4, delay: isActive ? 0.1 : 0 }}
          >
            <motion.p
              className="mb-1 font-mono text-xs uppercase tracking-widest text-white/50"
              animate={{ y: isHovered ? -5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {artwork.year > 0 ? artwork.year : "Book"}
            </motion.p>
            <motion.h2
              className="font-serif text-2xl font-bold text-white md:text-3xl"
              animate={{ y: isHovered ? -5 : 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {artwork.title}
            </motion.h2>
            <motion.p
              className="mt-2 text-sm text-white/70"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 10,
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              by {artwork.artist}
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Reflection effect */}
      <motion.div
        className="absolute -bottom-20 left-3 right-3 h-20 overflow-hidden rounded-2xl opacity-20 blur-sm"
        style={{
          background: `linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)`,
          transform: "scaleY(-1)",
        }}
        animate={{ opacity: isActive ? 0.15 : 0.05 }}
      />
    </motion.div>
  )
}
