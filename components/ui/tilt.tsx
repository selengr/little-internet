"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
  type SpringOptions,
} from "framer-motion"

type TiltProps = {
  children: React.ReactNode
  className?: string
  style?: MotionStyle
  rotationFactor?: number
  isRevese?: boolean
  springOptions?: SpringOptions
  /** When false, renders children flat (used on touch devices). */
  enabled?: boolean
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void
}

export function Tilt({
  children,
  className,
  style,
  rotationFactor = 15,
  isRevese = false,
  springOptions,
  enabled = true,
  onMouseMove,
  onMouseLeave,
  onMouseEnter,
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [canTilt, setCanTilt] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setCanTilt(false)
      return
    }
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)")
    const sync = () => setCanTilt(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [enabled])

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const xSpring = useSpring(x, springOptions)
  const ySpring = useSpring(y, springOptions)

  const rotateX = useTransform(
    ySpring,
    [-0.5, 0.5],
    isRevese ? [rotationFactor, -rotationFactor] : [-rotationFactor, rotationFactor],
  )
  const rotateY = useTransform(
    xSpring,
    [-0.5, 0.5],
    isRevese ? [-rotationFactor, rotationFactor] : [rotationFactor, -rotationFactor],
  )

  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canTilt || !ref.current) {
      onMouseMove?.(e)
      return
    }

    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const xPos = mouseX / width - 0.5
    const yPos = mouseY / height - 0.5

    x.set(xPos)
    y.set(yPos)
    onMouseMove?.(e)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    x.set(0)
    y.set(0)
    onMouseLeave?.(e)
  }

  if (!canTilt) {
    return (
      <div className={className} style={style as React.CSSProperties}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        ...style,
        transform,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      {children}
    </motion.div>
  )
}
