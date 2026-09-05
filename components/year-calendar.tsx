"use client"

import type React from "react"

import { useState } from "react"
import { Tilt } from "@/components/ui/tilt"
import { cn } from "@/lib/utils"

const WAVE_PRESETS = [
  { id: "ember", label: "Ember", color: "#f97316" },
  { id: "mint", label: "Mint", color: "#34d399" },
  { id: "sky", label: "Sky", color: "#38bdf8" },
  { id: "violet", label: "Violet", color: "#a78bfa" },
] as const

const DAILY_QUOTES = [
  { text: "Time is the only currency you spend without knowing the balance.", by: "Unknown" },
  { text: "The future depends on what you do today.", by: "Gandhi" },
  { text: "You may delay, but time will not.", by: "Benjamin Franklin" },
  { text: "Lost time is never found again.", by: "Benjamin Franklin" },
  { text: "Do not wait. The time will never be just right.", by: "Napoleon Hill" },
  { text: "Yesterday is gone. Tomorrow has not yet come. We have only today.", by: "Mother Teresa" },
  { text: "The two most powerful warriors are patience and time.", by: "Leo Tolstoy" },
  { text: "Your day is a blank page. Write something worth reading.", by: "Unknown" },
  { text: "A year from now you will wish you had started today.", by: "Karen Lamb" },
  { text: "Small daily improvements are the key to staggering long-term results.", by: "Unknown" },
  { text: "Don’t count the days. Make the days count.", by: "Muhammad Ali" },
  { text: "The best time to plant a tree was 20 years ago. The second best is now.", by: "Chinese proverb" },
]

const DAILY_MOVES = [
  "Ship one tiny thing before midnight.",
  "Write three lines you would want to read next year.",
  "Delete one distraction from tomorrow’s plan.",
  "Send the message you’ve been rehearsing.",
  "Learn one new word and use it once.",
  "Take a 20-minute walk with no phone.",
  "Finish the tab you’ve left open for a week.",
  "Thank someone who made your week lighter.",
  "Move one task from someday to today.",
  "Spend 15 minutes on the hard thing first.",
  "Capture one idea before it evaporates.",
  "Leave one corner of your day intentionally empty.",
]

function countWeekdaysLeft(from: Date, year: number, weekday: number) {
  const end = new Date(year, 11, 31)
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)
  let count = 0
  while (cursor <= end) {
    if (cursor.getDay() === weekday) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

export function YearCalendar({ className }: { className?: string }) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [cardTilt, setCardTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isCardHovered, setIsCardHovered] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [waveColor, setWaveColor] = useState<string>(WAVE_PRESETS[0].color)

  const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }

  const totalDays = isLeapYear(currentYear) ? 366 : 365

  const startOfYear = new Date(currentYear, 0, 1)
  const dayOfYear =
    Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const daysRemaining = totalDays - dayOfYear
  const yearProgress = Math.min(100, Math.round((dayOfYear / totalDays) * 100))

  const fridaysLeft = countWeekdaysLeft(now, currentYear, 5)

  const quote = DAILY_QUOTES[(dayOfYear - 1) % DAILY_QUOTES.length]
  const dailyMove = DAILY_MOVES[(dayOfYear - 1) % DAILY_MOVES.length]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseLeave = () => {
    setMousePos(null)
  }

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const tiltX = (mouseY - centerY) / centerY
    const tiltY = (mouseX - centerX) / centerX

    setCardTilt({ x: tiltX, y: tiltY })
  }

  const handleCardMouseLeave = () => {
    setCardTilt({ x: 0, y: 0 })
    setIsCardHovered(false)
  }

  const handleCardMouseEnter = () => {
    setIsCardHovered(true)
  }

  const handleCardClick = () => {
    setIsFlipped(!isFlipped)
  }

  const shadowX = -cardTilt.y * 30
  const shadowY = -cardTilt.x * 30
  const shadowBlur = 40 + Math.abs(cardTilt.x) * 20 + Math.abs(cardTilt.y) * 20

  const dynamicShadow = `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, 0.4), ${shadowX * 0.5}px ${shadowY * 0.5}px ${shadowBlur * 0.6}px rgba(0, 0, 0, 0.25)`

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Tilt
        rotationFactor={8}
        springOptions={{ stiffness: 300, damping: 20 }}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        onMouseEnter={handleCardMouseEnter}
      >
        <div
          className="relative cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={handleCardClick}
        >
          <div
            className="relative transition-transform duration-700 ease-in-out"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div
              className="w-[360px] max-w-[calc(100vw-3rem)] px-4 py-6 bg-foreground flex flex-col my-0 gap-4 border-0 rounded-xl transition-shadow duration-200 overflow-hidden"
              style={{
                boxShadow: dynamicShadow,
                backfaceVisibility: "hidden",
                ["--wave-color" as string]: waveColor,
              }}
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
            >
              <div
                className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-2"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {Array.from({ length: totalDays }, (_, i) => {
                  const dayNumber = i + 1
                  const isPast = dayNumber <= dayOfYear

                  let gradientStyle: React.CSSProperties = {}
                  if (mousePos && isPast) {
                    const col = i % 30
                    const row = Math.floor(i / 30)
                    const dotX = col * (4 + 8) + 2
                    const dotY = row * (4 + 8) + 2

                    const distance = Math.sqrt(
                      Math.pow(mousePos.x - dotX, 2) + Math.pow(mousePos.y - dotY, 2),
                    )

                    if (distance < 150) {
                      const intensity = 1 - distance / 150
                      const hue = 180 + intensity * 100
                      gradientStyle = {
                        backgroundColor: `hsl(${hue}, 100%, ${70 + intensity * 30}%)`,
                        boxShadow: `0 0 ${8 + intensity * 12}px hsla(${hue}, 100%, 70%, ${0.8 + intensity * 0.2})`,
                      }
                    }
                  }

                  const delayMs = !isPast ? (i - dayOfYear) * 80 : 0
                  const shouldAnimate = !isPast && isCardHovered

                  return (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full transition-all duration-150 ${
                        isPast
                          ? "bg-background shadow-[0_0_4px_rgba(255,255,255,0.6)]"
                          : "bg-zinc-700"
                      }`}
                      style={{
                        ...gradientStyle,
                        animation: shouldAnimate
                          ? `waveColor 2s ease-in-out ${delayMs}ms infinite`
                          : "none",
                      }}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-sm text-background font-mono">
                <span>{currentYear}</span>
                <span>{daysRemaining} days remaining</span>
              </div>
            </div>

            <div
              className="absolute inset-0 px-5 py-5 bg-foreground flex flex-col justify-between gap-3 border-0 rounded-xl overflow-hidden"
              style={{
                boxShadow: dynamicShadow,
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="space-y-3 text-left min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em] text-background/45 font-mono">
                  Today’s move
                </p>
                <p className="text-background text-sm leading-snug font-light">{dailyMove}</p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-background/10 px-2.5 py-2 min-w-0">
                    <div className="font-mono text-lg tabular-nums text-background leading-none">
                      {yearProgress}%
                    </div>
                    <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-background/45 truncate">
                      of {currentYear}
                    </div>
                  </div>
                  <div className="rounded-lg bg-background/10 px-2.5 py-2 min-w-0">
                    <div className="font-mono text-lg tabular-nums text-background leading-none">
                      {fridaysLeft}
                    </div>
                    <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-background/45 truncate">
                      Fridays left
                    </div>
                  </div>
                </div>
              </div>

              <blockquote className="border-l border-background/25 pl-3 text-left min-w-0">
                <p className="text-background/80 text-[13px] leading-relaxed font-light italic">
                  “{quote.text}”
                </p>
                <footer className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-background/40 font-mono">
                  {quote.by}
                </footer>
              </blockquote>

              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-background/40 font-mono">
                  Wave
                </span>
                <div className="flex items-center justify-end gap-2 shrink-0">
                  {WAVE_PRESETS.map(preset => {
                    const active = waveColor === preset.color
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        aria-label={preset.label}
                        title={preset.label}
                        onClick={e => {
                          e.stopPropagation()
                          setWaveColor(preset.color)
                        }}
                        className={cn(
                          "size-6 rounded-full border transition-shadow",
                          active
                            ? "border-background ring-2 ring-inset ring-background/50"
                            : "border-background/25",
                        )}
                        style={{ backgroundColor: preset.color }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tilt>
    </div>
  )
}
