"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Tilt } from "@/components/ui/tilt"
import { cn } from "@/lib/utils"

export function YearCalendar({ className }: { className?: string }) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [cardTilt, setCardTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isCardHovered, setIsCardHovered] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [hexColor, setHexColor] = useState("#f97316")
  const [rgbColor, setRgbColor] = useState({ r: "249", g: "115", b: "22" })
  const [hslColor, setHslColor] = useState({ h: "27", s: "96", l: "53" })
  const [colorFormat, setColorFormat] = useState<"hex" | "rgb" | "hsl">("hex")
  const hexInputRef = useRef<HTMLInputElement>(null)
  const rgbRInputRef = useRef<HTMLInputElement>(null)
  const hslHInputRef = useRef<HTMLInputElement>(null)

  const getCurrentWaveColor = () => {
    if (colorFormat === "hex") {
      return hexColor
    } else if (colorFormat === "rgb") {
      return `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`
    } else {
      return `hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)`
    }
  }

  useEffect(() => {
    if (isFlipped) {
      if (colorFormat === "hex" && hexInputRef.current) {
        hexInputRef.current.focus()
      } else if (colorFormat === "rgb" && rgbRInputRef.current) {
        rgbRInputRef.current.focus()
      } else if (colorFormat === "hsl" && hslHInputRef.current) {
        hslHInputRef.current.focus()
      }
    }
  }, [isFlipped, colorFormat])

  const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }

  const totalDays = isLeapYear(currentYear) ? 366 : 365

  const startOfYear = new Date(currentYear, 0, 1)
  const dayOfYear =
    Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const daysRemaining = totalDays - dayOfYear

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
    <div
      className={cn(
        "flex items-center justify-center px-6 py-20 md:py-28 bg-[rgba(240,238,233,1)] dark:bg-[#0a0a0b]",
        className,
      )}
    >
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
              className="w-[360px] max-w-[calc(100vw-3rem)] px-4 py-6 bg-foreground flex flex-col my-0 gap-4 border-0 rounded-xl transition-shadow duration-200"
              style={{
                boxShadow: dynamicShadow,
                backfaceVisibility: "hidden",
                ["--wave-color" as string]: getCurrentWaveColor(),
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
              className="absolute top-0 left-0 w-[360px] max-w-[calc(100vw-3rem)] px-4 py-6 bg-foreground flex flex-col my-0 gap-4 border-0 rounded-xl"
              style={{
                boxShadow: dynamicShadow,
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="flex flex-col gap-4 items-center justify-center min-h-[200px]">
                <h3 className="text-background font-mono text-sm">Days Remaining Flow Color</h3>

                <div className="flex gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setColorFormat("hex")
                    }}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                      colorFormat === "hex"
                        ? "bg-background text-foreground"
                        : "bg-zinc-700 text-background"
                    }`}
                  >
                    HEX
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setColorFormat("rgb")
                    }}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                      colorFormat === "rgb"
                        ? "bg-background text-foreground"
                        : "bg-zinc-700 text-background"
                    }`}
                  >
                    RGB
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setColorFormat("hsl")
                    }}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                      colorFormat === "hsl"
                        ? "bg-background text-foreground"
                        : "bg-zinc-700 text-background"
                    }`}
                  >
                    HSL
                  </button>
                </div>

                {colorFormat === "hex" && (
                  <input
                    ref={hexInputRef}
                    type="text"
                    value={hexColor}
                    onChange={e => {
                      e.stopPropagation()
                      setHexColor(e.target.value)
                    }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-[280px] px-4 py-2 bg-zinc-800 text-background font-mono text-sm rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-background/50"
                    placeholder="#f97316"
                  />
                )}

                {colorFormat === "rgb" && (
                  <div
                    className="flex gap-2 w-full max-w-[280px]"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex-1">
                      <label className="text-background text-xs font-mono mb-1 block">R</label>
                      <input
                        ref={rgbRInputRef}
                        type="number"
                        min="0"
                        max="255"
                        value={rgbColor.r}
                        onChange={e => {
                          e.stopPropagation()
                          setRgbColor({ ...rgbColor, r: e.target.value })
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full px-2 py-2 bg-zinc-800 text-background font-mono text-sm rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-background/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-background text-xs font-mono mb-1 block">G</label>
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={rgbColor.g}
                        onChange={e => {
                          e.stopPropagation()
                          setRgbColor({ ...rgbColor, g: e.target.value })
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full px-2 py-2 bg-zinc-800 text-background font-mono text-sm rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-background/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-background text-xs font-mono mb-1 block">B</label>
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={rgbColor.b}
                        onChange={e => {
                          e.stopPropagation()
                          setRgbColor({ ...rgbColor, b: e.target.value })
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full px-2 py-2 bg-zinc-800 text-background font-mono text-sm rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-background/50"
                      />
                    </div>
                  </div>
                )}

                {colorFormat === "hsl" && (
                  <div
                    className="flex gap-2 w-full max-w-[280px]"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex-1">
                      <label className="text-background text-xs font-mono mb-1 block">H</label>
                      <input
                        ref={hslHInputRef}
                        type="number"
                        min="0"
                        max="360"
                        value={hslColor.h}
                        onChange={e => {
                          e.stopPropagation()
                          setHslColor({ ...hslColor, h: e.target.value })
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full px-2 py-2 bg-zinc-800 text-background font-mono text-sm rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-background/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-background text-xs font-mono mb-1 block">S%</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={hslColor.s}
                        onChange={e => {
                          e.stopPropagation()
                          setHslColor({ ...hslColor, s: e.target.value })
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full px-2 py-2 bg-zinc-800 text-background font-mono text-sm rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-background/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-background text-xs font-mono mb-1 block">L%</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={hslColor.l}
                        onChange={e => {
                          e.stopPropagation()
                          setHslColor({ ...hslColor, l: e.target.value })
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full px-2 py-2 bg-zinc-800 text-background font-mono text-sm rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-background/50"
                      />
                    </div>
                  </div>
                )}

                <div
                  className="w-16 h-16 rounded-lg border-2 border-background/20"
                  style={{
                    backgroundColor: getCurrentWaveColor(),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Tilt>
    </div>
  )
}
