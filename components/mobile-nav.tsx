"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { NAV_GLASS, NAV_GLASS_CLASS } from "@/lib/nav-glass"

const NAV_LINKS = [
  { label: "Markets",      href: "#markets" },
  { label: "Photos",       href: "#photos" },
  { label: "English",      href: "#english" },
  { label: "Tools",        href: "#tools" },
  { label: "World",        href: "#countries" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-3xl">

        {/* Main bar */}
        <nav
          className={`flex items-center justify-between px-5 py-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <span className="font-pixel text-xs tracking-[0.25em] text-black/70 dark:text-white/70">LITTLE INTERNET</span>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {NAV_LINKS.map(l =>
              l.href.startsWith('/') ? (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-[11px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors duration-200 tracking-wide"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-[11px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors duration-200 tracking-wide"
                >
                  {l.label}
                </a>
              ),
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/location"
              className="text-[11px] px-4 py-2 rounded-xl border border-black/10 dark:border-white/20 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] transition-all duration-200 tracking-wide hidden md:inline-flex items-center gap-1.5"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              <MapPin className="size-3.5" />
              WHERE AM I?
            </Link>

            {/* Burger — mobile only */}
            <button
              onClick={() => setOpen(v => !v)}
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span
                className="block h-px bg-black/60 dark:bg-white/60 transition-all duration-300 origin-center"
                style={{
                  width: "18px",
                  transform: open ? "translateY(6px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="block h-px bg-black/60 dark:bg-white/60 transition-all duration-300"
                style={{
                  width: "18px",
                  opacity: open ? 0 : 1,
                  transform: open ? "scaleX(0)" : "none",
                }}
              />
              <span
                className="block h-px bg-black/60 dark:bg-white/60 transition-all duration-300 origin-center"
                style={{
                  width: "18px",
                  transform: open ? "translateY(-6px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        <div
          className="md:hidden mt-2 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: open ? "560px" : "0px", opacity: open ? 1 : 0 }}
        >
          <div
            className={`rounded-2xl border border-black/[0.06] dark:border-white/[0.08] px-2 py-2 flex flex-col ${NAV_GLASS_CLASS}`}
            style={NAV_GLASS}
          >
            {NAV_LINKS.map(l =>
              l.href.startsWith('/') ? (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={close}
                  className="px-4 py-3 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.08] rounded-xl transition-colors tracking-wide"
                  style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={close}
                  className="px-4 py-3 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.08] rounded-xl transition-colors tracking-wide"
                  style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
                >
                  {l.label}
                </a>
              ),
            )}
            <div className="mt-1 px-2 pb-1 flex flex-col gap-1.5">
              <Link
                href="/location"
                onClick={close}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/20 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] transition-all duration-200 tracking-wide"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                <MapPin className="size-3.5" />
                WHERE AM I?
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
