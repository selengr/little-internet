import Link from 'next/link'
import { ArrowRight, Mic2 } from 'lucide-react'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

export function PronunciationStudioSuggest({ word }: { word?: string | null }) {
  const trimmed = word?.trim()
  const href = trimmed ? `/studio?q=${encodeURIComponent(trimmed)}` : '/studio'

  return (
    <aside className="mt-16 md:mt-20 flex justify-center px-1" aria-label="Pronunciation Studio">
      <div
        className={`w-full max-w-3xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
        style={NAV_GLASS}
      >
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.06]">
            <Mic2 className="size-4 text-black/55 dark:text-white/65" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50">
              PRONUNCIATION STUDIO
            </p>
            <p className="mt-1 text-[13px] leading-snug text-black/70 dark:text-white/72">
              {trimmed ? (
                <>
                  Hear <span className="font-medium text-black/85 dark:text-white/90">{trimmed}</span>{' '}
                  in real video clips — not a robot voice.
                </>
              ) : (
                <>Hear words in real video clips — US, UK, and more — in Magic Studio.</>
              )}
            </p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-black/10 px-3 py-2 text-[11px] tracking-wide text-black/70 transition-all duration-200 hover:border-black/20 hover:bg-black/[0.03] hover:text-black dark:border-white/20 dark:text-white/70 dark:hover:border-white/30 dark:hover:bg-white/[0.08] dark:hover:text-white sm:self-center"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Open Studio
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </aside>
  )
}
