"use client"

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react"
import {
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * The four "spin" toys of the Diversions section. Each one is a different device with its own
 * physics rather than a re-skinned wheel:
 *   CatEyeSpinner   – a pupil that dilates, rings that counter-rotate, a blink, and a new iris colour
 *   DogBallSpinner  – a ball thrown out of frame that comes back bouncing on a lawn
 *   JokeDieSpinner  – a 3D die whose six faces are the six joke categories
 *   PoemInkSpinner  – an ink drop that blooms into a symmetric Rorschach-style blot
 *
 * The parent decides the outcome up front (`target`) and flips `spinning` on for SPIN_MS; each toy
 * choreographs itself to arrive at that outcome exactly when the parent reveals the content.
 */

export const SPIN_MS = 2200

type SpinnerProps = {
  spinning: boolean
  /** Outcome chosen by the parent before the spin starts. */
  target: number | null
  onSpin: () => void
  label: string
  /** Render at this many px instead of the default 112/144 (the drawing scales with it). */
  size?: number
}

const SEC = SPIN_MS / 1000

/**
 * A 144px design canvas, scaled down on small screens. Every toy is drawn in the same space.
 */
function Stage({
  label,
  onSpin,
  spinning,
  className,
  children,
  onPointerMove,
  onPointerLeave,
  buttonRef,
  size,
}: {
  size?: number
  label: string
  onSpin: () => void
  spinning: boolean
  className?: string
  children: ReactNode
  onPointerMove?: (e: React.PointerEvent<HTMLButtonElement>) => void
  onPointerLeave?: () => void
  buttonRef?: React.Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onSpin}
      disabled={spinning}
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn(
        "group relative block shrink-0 cursor-pointer overflow-hidden border border-black/10 outline-none transition-transform duration-300 hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-foreground/50 disabled:cursor-wait dark:border-white/10",
        size ? "" : "size-[112px] rounded-[30px] sm:size-36",
        className,
      )}
      style={size ? { width: size, height: size, borderRadius: size * 0.21 } : undefined}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-[144px] w-[144px] origin-top-left",
          !size && "scale-[0.7778] sm:scale-100",
        )}
        style={size ? { transform: `scale(${size / 144})` } : undefined}
      >
        {children}
      </div>
    </button>
  )
}

// ─── 1. Cat eye ─────────────────────────────────────────────────────────────────────────────────

const IRISES = [
  { a: "#fde68a", b: "#d97706", rim: "#78350f" }, // amber
  { a: "#bbf7d0", b: "#16a34a", rim: "#14532d" }, // emerald
  { a: "#bfdbfe", b: "#2563eb", rim: "#1e3a8a" }, // sapphire
  { a: "#fed7aa", b: "#ea580c", rim: "#7c2d12" }, // copper
  { a: "#e9d5ff", b: "#9333ea", rim: "#581c87" }, // lilac
  { a: "#cffafe", b: "#0891b2", rim: "#164e63" }, // ice
]
export const CAT_EYE_COUNT = IRISES.length
export const CAT_IRISES = IRISES

const IRIS_FIBERS = Array.from({ length: 56 }, (_, i) => {
  const a = (i / 56) * Math.PI * 2
  const r1 = 11 + (i % 3) * 2
  const r2 = 29 - (i % 4)
  return { x1: 60 + Math.cos(a) * r1, y1: 60 + Math.sin(a) * r1, x2: 60 + Math.cos(a) * r2, y2: 60 + Math.sin(a) * r2 }
})

const ALMOND = "M6 60 C 28 18, 92 18, 114 60 C 92 102, 28 102, 6 60 Z"

export function CatEyeSpinner({ spinning, target, onSpin, label, size }: SpinnerProps) {
  const reduce = useReducedMotion()
  const uid = useId().replace(/:/g, "")
  const [shown, setShown] = useState(0)
  const [turn, setTurn] = useState(0)
  const pupil = useAnimationControls()
  const lids = useAnimationControls()
  const spinningRef = useRef(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // The eye follows the pointer.
  const lookX = useMotionValue(0)
  const lookY = useMotionValue(0)
  const gazeX = useSpring(lookX, { stiffness: 140, damping: 16 })
  const gazeY = useSpring(lookY, { stiffness: 140, damping: 16 })

  useEffect(() => {
    spinningRef.current = spinning
    if (!spinning) return
    setTurn(t => t + 1)
    if (reduce) {
      setShown(target ?? 0)
      return
    }
    // Hypnotic dilation, then a blink during which the iris colour changes.
    void pupil.start({
      scaleX: [0.16, 0.9, 0.3, 1, 0.26, 1, 0.4, 0.16],
      transition: { duration: SEC * 0.92, ease: "easeInOut" },
    })
    void lids.start({
      scaleY: [0, 0, 1, 0],
      transition: { duration: SEC, times: [0, 0.8, 0.88, 1], ease: "easeInOut" },
    })
    const t = setTimeout(() => setShown(target ?? 0), SPIN_MS * 0.85)
    return () => clearTimeout(t)
  }, [spinning, target, reduce, pupil, lids])

  // An occasional idle blink, so the eye reads as alive before anyone touches it.
  useEffect(() => {
    if (reduce) return
    let t: ReturnType<typeof setTimeout>
    const loop = () => {
      t = setTimeout(() => {
        if (!spinningRef.current) void lids.start({ scaleY: [0, 1, 0], transition: { duration: 0.28 } })
        loop()
      }, 3200 + Math.random() * 3600)
    }
    loop()
    return () => clearTimeout(t)
  }, [reduce, lids])

  const iris = IRISES[shown]
  const boxVars = { "--ia": iris.a, "--ib": iris.b, "--ir": iris.rim } as React.CSSProperties
  const stop = (v: string): React.CSSProperties => ({ stopColor: `var(${v})`, transition: "stop-color 0.6s ease" })

  return (
    <Stage
      label={label}
      onSpin={onSpin}
      spinning={spinning}
      buttonRef={buttonRef}
      size={size}
      className="bg-[radial-gradient(circle_at_50%_40%,#2a2a33,#0b0b0f_75%)]"
      onPointerMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        lookX.set(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))) * 7)
        lookY.set(Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2))) * 4)
      }}
      onPointerLeave={() => {
        lookX.set(0)
        lookY.set(0)
      }}
    >
      <style>{`@keyframes cat-fibers { to { transform: rotate(360deg); } }`}</style>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full" style={boxVars} aria-hidden>
        <defs>
          <radialGradient id={`${uid}-iris`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={stop("--ia")} />
            <stop offset="62%" style={stop("--ib")} />
            <stop offset="100%" style={stop("--ir")} />
          </radialGradient>
          <radialGradient id={`${uid}-wet`} cx="50%" cy="38%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${uid}-eye`}>
            <path d={ALMOND} />
          </clipPath>
        </defs>

        {/* The eye socket: a soft halo of the current iris colour. */}
        <ellipse cx="60" cy="60" rx="56" ry="38" style={{ fill: "var(--ib)", transition: "fill 0.6s ease" }} opacity="0.16" />
        <path d={ALMOND} fill="#0a0a0c" />

        <g clipPath={`url(#${uid}-eye)`}>
          <motion.g style={{ x: gazeX, y: gazeY }}>
            <circle cx="60" cy="60" r="31" fill={`url(#${uid}-iris)`} />
            <g style={{ transformOrigin: "60px 60px", animation: "cat-fibers 70s linear infinite" }} opacity="0.4">
              {IRIS_FIBERS.map((f, i) => (
                <line key={i} {...f} stroke="var(--ir)" strokeWidth="0.7" />
              ))}
            </g>
            {/* Two rings that counter-rotate while the eye "thinks". */}
            <motion.g
              animate={{ rotate: turn * 720 }}
              transition={{ duration: reduce ? 0 : SEC * 0.92, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              <circle cx="60" cy="60" r="25" fill="none" stroke="var(--ir)" strokeOpacity="0.55" strokeWidth="1.1" strokeDasharray="3 5" />
            </motion.g>
            <motion.g
              animate={{ rotate: turn * -540 }}
              transition={{ duration: reduce ? 0 : SEC * 0.92, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              <circle cx="60" cy="60" r="18" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.9" strokeDasharray="1 4" />
            </motion.g>
            <motion.ellipse
              cx="60"
              cy="60"
              rx="29"
              ry="31"
              fill="#050506"
              initial={{ scaleX: 0.16 }}
              animate={pupil}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          </motion.g>

          <circle cx="60" cy="60" r="31" fill={`url(#${uid}-wet)`} />
          {/* Glints stay put while the eye moves under them. */}
          <ellipse cx="47" cy="47" rx="6" ry="4.2" fill="#fff" opacity="0.92" transform="rotate(-28 47 47)" />
          <circle cx="71" cy="72" r="2.4" fill="#fff" opacity="0.7" />

          <motion.rect
            x="0"
            y="0"
            width="120"
            height="62"
            fill="#0a0a0c"
            initial={{ scaleY: 0 }}
            animate={lids}
            style={{ transformBox: "fill-box", transformOrigin: "top" }}
          />
          <motion.rect
            x="0"
            y="58"
            width="120"
            height="62"
            fill="#0a0a0c"
            initial={{ scaleY: 0 }}
            animate={lids}
            style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
          />
        </g>
        <path d={ALMOND} fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2" />
      </svg>
    </Stage>
  )
}

// ─── 2. Fetch ───────────────────────────────────────────────────────────────────────────────────

const BALLS = [
  { a: "#eaff72", b: "#9fc316", seam: "#ffffff" }, // tennis
  { a: "#fda4af", b: "#e11d48", seam: "#fff1f2" }, // red
  { a: "#93c5fd", b: "#2563eb", seam: "#eff6ff" }, // blue (dogs see blue best)
  { a: "#fdba74", b: "#ea580c", seam: "#fff7ed" }, // orange
  { a: "#f9a8d4", b: "#db2777", seam: "#fdf2f8" }, // pink
  { a: "#fde68a", b: "#ca8a04", seam: "#fffbeb" }, // gold
]
export const DOG_BALL_COUNT = BALLS.length
export const DOG_BALLS = BALLS

// Nine beats of a throw: launch, apex, bounce, apex, bounce, apex, bounce, apex, rest.
const THROW_TIMES = [0, 0.22, 0.44, 0.58, 0.72, 0.82, 0.9, 0.96, 1]
const THROW_EASE = ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeIn"] as const

export function DogBallSpinner({ spinning, target, onSpin, label, size }: SpinnerProps) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(0)
  const [spin, setSpin] = useState(0)
  const ball = useAnimationControls()
  const shadow = useAnimationControls()
  const puff = useAnimationControls()
  const spinningRef = useRef(false)

  useEffect(() => {
    spinningRef.current = spinning
    if (!spinning) return
    setSpin(s => s + 1)
    if (reduce) {
      setShown(target ?? 0)
      return
    }
    const d = SEC * 0.97
    void ball.start({
      y: [0, -162, 0, -62, 0, -26, 0, -9, 0],
      scaleX: [1, 0.92, 1.24, 0.96, 1.12, 0.99, 1.07, 1, 1],
      scaleY: [1, 1.1, 0.72, 1.05, 0.83, 1.02, 0.91, 1, 1],
      transition: { duration: d, times: THROW_TIMES, ease: [...THROW_EASE] },
    })
    void shadow.start({
      scaleX: [1, 0.35, 1, 0.65, 1, 0.85, 1, 0.95, 1],
      opacity: [0.4, 0.1, 0.45, 0.25, 0.42, 0.3, 0.4, 0.36, 0.4],
      transition: { duration: d, times: THROW_TIMES, ease: [...THROW_EASE] },
    })
    void puff.start({
      opacity: [0, 0, 0.9, 0, 0.8, 0, 0.6, 0, 0],
      scale: [0.3, 0.3, 1, 1.9, 1, 1.6, 0.9, 1.3, 0.3],
      transition: { duration: d, times: THROW_TIMES, ease: "easeOut" },
    })
    // Swap the colour while the ball is out of frame, so each throw is a new ball.
    const t = setTimeout(() => setShown(target ?? 0), SPIN_MS * 0.22)
    return () => clearTimeout(t)
  }, [spinning, target, reduce, ball, shadow, puff])

  // Every few seconds the ball hops a little: an invitation to play.
  useEffect(() => {
    if (reduce) return
    let t: ReturnType<typeof setTimeout>
    const loop = () => {
      t = setTimeout(() => {
        if (!spinningRef.current) {
          void ball.start({ y: [0, -14, 0], scaleY: [1, 1.05, 0.9, 1], transition: { duration: 0.5, ease: "easeOut" } })
        }
        loop()
      }, 3600 + Math.random() * 2400)
    }
    loop()
    return () => clearTimeout(t)
  }, [reduce, ball])

  const b = BALLS[shown]

  return (
    <Stage
      size={size}
      label={label}
      onSpin={onSpin}
      spinning={spinning}
      className="bg-gradient-to-b from-[#9bd4ff] via-[#d6efff] to-[#fff4c2]"
    >
      {/* Sun, hills and a mown lawn: flat, graphic shapes. */}
      <div className="absolute left-[92px] top-[14px] size-[30px] rounded-full bg-[#ffd94a] shadow-[0_0_0_7px_rgba(255,217,74,0.28),0_0_0_15px_rgba(255,217,74,0.14)]" />
      <div className="absolute -left-4 top-[74px] h-[60px] w-[110px] rounded-[100%] bg-[#6fd08c]" />
      <div className="absolute -right-6 top-[82px] h-[60px] w-[120px] rounded-[100%] bg-[#58c27a]" />
      <div
        className="absolute inset-x-0 bottom-0 h-[52px]"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 16px, rgba(255,255,255,0) 16px 32px), linear-gradient(#34b863, #1f9a4d)",
        }}
      />

      <motion.div
        aria-hidden
        className="absolute bottom-[22px] left-1/2 h-[9px] w-[40px] -translate-x-1/2 rounded-full bg-black blur-[3px]"
        initial={{ opacity: 0.4 }}
        animate={shadow}
      />
      {([-1, 1] as const).map(side => (
        <motion.span
          key={side}
          aria-hidden
          className="absolute bottom-[24px] size-[11px] rounded-full bg-white/90"
          style={{ left: `calc(50% + ${side * 26}px)` }}
          initial={{ opacity: 0 }}
          animate={puff}
        />
      ))}

      <motion.div
        className="absolute bottom-[24px] left-1/2 -ml-[23px] size-[46px]"
        style={{ transformOrigin: "50% 100%" }}
        animate={ball}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: spin * 600 }}
          transition={{ duration: reduce ? 0 : SEC * 0.95, ease: [0.2, 0.7, 0.3, 1] }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 34% 30%, ${b.a}, ${b.b} 78%)`,
              transition: "background 0.3s",
            }}
          />
          <svg viewBox="0 0 46 46" className="absolute inset-0 size-full" aria-hidden>
            <path d="M9 7 C 22 16, 22 30, 9 39" fill="none" stroke={b.seam} strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />
            <path d="M37 7 C 24 16, 24 30, 37 39" fill="none" stroke={b.seam} strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />
          </svg>
        </motion.div>
        {/* Light stays fixed while the ball turns, which is what makes it look round. */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_26%,rgba(255,255,255,0.65),rgba(255,255,255,0)_45%),radial-gradient(circle_at_72%_82%,rgba(0,0,0,0.3),rgba(0,0,0,0)_55%)]" />
      </motion.div>
    </Stage>
  )
}

// ─── 3. Die ─────────────────────────────────────────────────────────────────────────────────────

const FACES = [
  { cat: "Programming", emoji: "💻", label: "Code", from: "#a5b4fc", to: "#4338ca" },
  { cat: "Pun", emoji: "😏", label: "Pun", from: "#fde68a", to: "#d97706" },
  { cat: "Misc", emoji: "🎲", label: "Misc", from: "#99f6e4", to: "#0f766e" },
  { cat: "Dark", emoji: "🌑", label: "Dark", from: "#94a3b8", to: "#0f172a" },
  { cat: "Spooky", emoji: "👻", label: "Spooky", from: "#ddd6fe", to: "#6d28d9" },
  { cat: "Christmas", emoji: "🎄", label: "Xmas", from: "#fecaca", to: "#15803d" },
] as const
export const DIE_CATEGORIES: string[] = FACES.map(f => f.cat)
export const DIE_FACES = FACES
/** Flavours that are actually served: the Dark face is kept on the die for its look, but never rolled. */
export const JOKE_CATEGORIES: string[] = DIE_CATEGORIES.filter(c => c !== 'Dark')

const DIE = 62
const FACE_PLACEMENT = [
  "rotateY(0deg)",
  "rotateY(90deg)",
  "rotateY(180deg)",
  "rotateY(-90deg)",
  "rotateX(90deg)",
  "rotateX(-90deg)",
]
/** Cube rotation (x, y) that brings each face to the front. */
const FACE_TO_FRONT: [number, number][] = [
  [0, 0],
  [0, -90],
  [0, 180],
  [0, 90],
  [-90, 0],
  [90, 0],
]

export function JokeDieSpinner({
  spinning,
  category,
  onSpin,
  label,
  size,
}: Omit<SpinnerProps, "target"> & { category: string | null }) {
  const reduce = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const hop = useAnimationControls()
  const shadow = useAnimationControls()
  const running = useRef<{ stop: () => void }[]>([])
  const spinningRef = useRef(false)

  useEffect(() => {
    spinningRef.current = spinning
    if (!spinning || category == null) return
    const k = Math.max(0, DIE_CATEGORIES.indexOf(category))
    const [tx, ty] = FACE_TO_FRONT[k]
    const laps = () => (reduce ? 0 : 2 + Math.floor(Math.random() * 2))
    const toX = tx + 360 * (Math.round((rx.get() - tx) / 360) + laps())
    const toY = ty + 360 * (Math.round((ry.get() - ty) / 360) + laps())
    const d = reduce ? 0.01 : SEC * 0.95
    running.current = [
      animate(rx, toX, { duration: d, ease: [0.12, 0.75, 0.22, 1] }),
      animate(ry, toY, { duration: d, ease: [0.12, 0.75, 0.22, 1] }),
    ]
    if (!reduce) {
      const beats = [0, 0.25, 0.5, 0.65, 0.8, 0.9, 1]
      void hop.start({
        y: [0, -70, 0, -26, 0, -8, 0],
        scaleY: [1, 1.04, 0.93, 1.02, 0.97, 1, 1],
        transition: { duration: d, times: beats, ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeIn"] },
      })
      void shadow.start({
        scaleX: [1, 0.55, 1, 0.8, 1, 0.94, 1],
        opacity: [0.45, 0.15, 0.5, 0.3, 0.46, 0.4, 0.45],
        transition: { duration: d, times: beats, ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeIn"] },
      })
    }
  }, [spinning, category, reduce, rx, ry, hop, shadow])

  useEffect(() => () => running.current.forEach(c => c.stop()), [])

  // A small hop now and then says "pick me up".
  useEffect(() => {
    if (reduce) return
    let t: ReturnType<typeof setTimeout>
    const loop = () => {
      t = setTimeout(() => {
        if (!spinningRef.current) void hop.start({ y: [0, -12, 0], transition: { duration: 0.55, ease: "easeOut" } })
        loop()
      }, 4200 + Math.random() * 2600)
    }
    loop()
    return () => clearTimeout(t)
  }, [reduce, hop])

  return (
    <Stage
      size={size}
      label={label}
      onSpin={onSpin}
      spinning={spinning}
      className="bg-[radial-gradient(ellipse_at_50%_28%,#4b3a8f,#1a1438_62%,#0d0a1f)]"
    >
      {/* A faint grid floor and a spotlight. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[58px] opacity-40"
        style={{
          background:
            "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px) 0 0 / 100% 12px, linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px) 0 0 / 18px 100%",
          transform: "perspective(120px) rotateX(58deg)",
          transformOrigin: "50% 100%",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />
      <div className="absolute left-1/2 top-[-30px] h-[130px] w-[110px] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_155deg,rgba(255,255,255,0.14)_180deg,transparent_205deg)]" />

      <motion.div
        aria-hidden
        className="absolute bottom-[20px] left-1/2 h-[10px] w-[58px] -translate-x-1/2 rounded-full bg-black blur-[4px]"
        initial={{ opacity: 0.45 }}
        animate={shadow}
      />

      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 520 }}>
        <motion.div animate={hop} style={{ transformStyle: "preserve-3d", marginTop: 6 }}>
          {/* A fixed isometric tilt, so the landed face always reads as one side of a cube. */}
          <div style={{ transformStyle: "preserve-3d", transform: "rotateX(-22deg) rotateY(-30deg)" }}>
          <motion.div
            style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", width: DIE, height: DIE, position: "relative" }}
          >
            {FACES.map((f, i) => (
              <div
                key={f.cat}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] ring-1 ring-inset ring-white/35"
                style={{
                  transform: `${FACE_PLACEMENT[i]} translateZ(${DIE / 2}px)`,
                  background: `linear-gradient(145deg, ${f.from}, ${f.to})`,
                  backfaceVisibility: "hidden",
                  boxShadow: "inset 0 -10px 18px rgba(0,0,0,0.25), inset 0 6px 10px rgba(255,255,255,0.3)",
                }}
              >
                <span className="text-[26px] leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]">{f.emoji}</span>
                <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/90 drop-shadow-sm">
                  {f.label}
                </span>
              </div>
            ))}
          </motion.div>
          </div>
        </motion.div>
      </div>
    </Stage>
  )
}

// ─── 4. Ink ─────────────────────────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Blob = { x: number; y: number; r: number; axis?: boolean }

/** Half a blot, mirrored on render: that symmetry is what makes it read as a Rorschach test. */
function makeBlot(seed: number): Blob[] {
  const rand = mulberry32(seed)
  const blobs: Blob[] = [{ x: 0, y: 0, r: 15 + rand() * 7, axis: true }]
  // A spine of overlapping circles along the axis, so the blot is one connected shape.
  const spine = 2 + Math.floor(rand() * 3)
  for (let i = 0; i < spine; i++) blobs.push({ x: 0, y: (rand() - 0.5) * 66, r: 7 + rand() * 9, axis: true })
  const wings = 11 + Math.floor(rand() * 5)
  for (let i = 0; i < wings; i++) {
    const a = rand() * Math.PI * 2
    const d = 12 + Math.pow(rand(), 0.75) * 34
    blobs.push({ x: -(Math.abs(Math.cos(a)) * d + 3), y: Math.sin(a) * d * 1.15, r: 4.5 + rand() * 10 })
  }
  const flecks = 3 + Math.floor(rand() * 3)
  for (let i = 0; i < flecks; i++) {
    const a = rand() * Math.PI * 2
    blobs.push({ x: -(Math.abs(Math.cos(a)) * 56 + 6), y: Math.sin(a) * 50, r: 3.4 + rand() * 2.2 })
  }
  return blobs
}

export function PoemInkSpinner({ spinning, target, onSpin, label, size }: SpinnerProps) {
  const reduce = useReducedMotion()
  const uid = useId().replace(/:/g, "")
  const [seed, setSeed] = useState(7)
  const [bloom, setBloom] = useState(0)

  useEffect(() => {
    if (!spinning) return
    setSeed(target ?? 1)
    setBloom(b => b + 1)
  }, [spinning, target])

  const blot = useMemo(() => makeBlot(seed), [seed])
  const c = 72
  const drawn = useMemo(
    () =>
      blot.flatMap((b, i) =>
        b.axis
          ? [{ key: `${i}`, x: c + b.x, y: c + b.y, r: b.r, i }]
          : [
              { key: `${i}l`, x: c + b.x, y: c + b.y, r: b.r, i },
              { key: `${i}r`, x: c - b.x, y: c + b.y, r: b.r, i },
            ],
      ),
    [blot],
  )
  const first = bloom === 0

  return (
    <Stage
      size={size}
      label={label}
      onSpin={onSpin}
      spinning={spinning}
      className="bg-[radial-gradient(circle_at_50%_45%,#fbf6ea,#e9dfca_80%)] dark:bg-[radial-gradient(circle_at_50%_45%,#23212c,#121117_80%)]"
    >
      <svg viewBox="0 0 144 144" className="absolute inset-0 size-full text-[#241f4a] dark:text-[#c9cdfa]" aria-hidden>
        <defs>
          <filter id={`${uid}-ink`} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -10"
              result="goo"
            />
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed={seed % 97} result="noise" />
            <feDisplacementMap in="goo" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Faint ripples where the drop lands. */}
        {!first && !reduce &&
          [0, 1].map(n => (
            <motion.circle
              key={`${bloom}-ring-${n}`}
              cx={c}
              cy={c}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              initial={{ r: 6, opacity: 0 }}
              animate={{ r: 66, opacity: [0, 0.35, 0] }}
              transition={{ delay: 0.42 + n * 0.22, duration: 1.3, ease: "easeOut" }}
            />
          ))}

        <motion.g
          animate={first || reduce ? undefined : { scale: [1, 1.012, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <g filter={`url(#${uid}-ink)`} fill="currentColor">
            {drawn.map(b => (
              <motion.circle
                key={`${bloom}-${b.key}`}
                initial={first || reduce ? false : { cx: c, cy: c, r: 0 }}
                animate={{ cx: b.x, cy: b.y, r: b.r }}
                transition={{ delay: 0.42 + b.i * 0.045, type: "spring", stiffness: 38, damping: 10, mass: 0.9 }}
              />
            ))}
          </g>
        </motion.g>

        {/* The falling drop. */}
        {!first && !reduce && (
          <motion.ellipse
            key={`${bloom}-drop`}
            cx={c}
            rx="4.5"
            fill="currentColor"
            initial={{ cy: -14, ry: 8, opacity: 1 }}
            animate={{ cy: c, ry: [8, 11, 5], opacity: [1, 1, 0] }}
            transition={{ duration: 0.46, ease: [0.5, 0, 0.9, 0.6], times: [0, 0.7, 1] }}
          />
        )}
      </svg>
      {/* Paper grain. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-multiply dark:opacity-[0.12] dark:mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(rgba(60,40,10,0.35) 0.6px, transparent 0.8px), radial-gradient(rgba(60,40,10,0.25) 0.5px, transparent 0.7px)",
          backgroundSize: "5px 5px, 7px 7px",
          backgroundPosition: "0 0, 2px 3px",
        }}
      />
    </Stage>
  )
}
