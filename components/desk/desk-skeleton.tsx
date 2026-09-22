'use client'

import { cn } from '@/lib/utils'

function DeskBone({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-sm bg-white/[0.05]', className)}>
      <div className="absolute inset-0 -translate-x-full animate-[dk-shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </div>
  )
}

export function DeskSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] px-1.5 sm:px-2 space-y-1" aria-busy aria-label="Loading charts">
      <style>{`
        @keyframes dk-shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded border border-white/[0.07] bg-[#0d1117] px-2.5 py-2">
        <DeskBone className="size-5 rounded-full" />
        <DeskBone className="h-4 w-16" />
        <DeskBone className="h-6 w-28" />
        <DeskBone className="h-3 w-14 hidden sm:block" />
        <DeskBone className="h-3 w-20 hidden md:block" />
        <DeskBone className="h-3 w-16 hidden lg:block" />
        <DeskBone className="ml-auto size-5 rounded" />
      </div>

      <div className="grid grid-cols-12 gap-1 items-stretch lg:min-h-[calc(100vh-7rem)]">
        <aside className="col-span-12 lg:col-span-2 rounded border border-white/[0.07] bg-[#0d1117] overflow-hidden">
          <div className="px-2 py-2 border-b border-white/[0.06]">
            <DeskBone className="h-7 w-full rounded" />
          </div>
          <div className="px-2 py-1.5 border-b border-white/[0.04] flex gap-2">
            <DeskBone className="h-2.5 flex-1" />
            <DeskBone className="h-2.5 w-10" />
            <DeskBone className="h-2.5 w-8" />
          </div>
          <div className="divide-y divide-white/[0.03]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-2">
                <DeskBone className="size-2.5 rounded-sm shrink-0" />
                <DeskBone className="h-3 flex-1" />
                <DeskBone className="h-3 w-12" />
                <DeskBone className="h-3 w-10" />
              </div>
            ))}
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-7 rounded border border-white/[0.07] bg-[#0d1117] overflow-hidden flex flex-col">
          <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 border-b border-white/[0.06]">
            {Array.from({ length: 6 }).map((_, i) => (
              <DeskBone key={i} className="h-5 w-8" />
            ))}
            <div className="ml-auto flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <DeskBone key={i} className="h-5 w-9" />
              ))}
            </div>
          </div>
          <div className="relative p-2 flex-1 min-h-[280px]">
            <DeskBone className="aspect-[11/7] max-lg:aspect-[11/8] w-full rounded" />
            <div className="pointer-events-none absolute inset-x-8 bottom-10 top-14 flex items-end justify-between gap-1 opacity-40">
              {[40, 62, 35, 78, 48, 70, 30, 85, 55, 66, 42, 74, 38, 60, 50].map((h, i) => (
                <div
                  key={i}
                  className="w-full max-w-[10px] rounded-sm bg-[#f0b90b]/25"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-3 rounded border border-white/[0.07] bg-[#0d1117] overflow-hidden flex flex-col">
          <div className="flex border-b border-white/[0.06]">
            <DeskBone className="h-8 flex-1 m-1 rounded-sm" />
            <DeskBone className="h-8 flex-1 m-1 rounded-sm" />
          </div>
          <div className="px-2 py-2 space-y-1.5 flex-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={`a-${i}`} className="grid grid-cols-3 gap-2">
                <DeskBone className="h-3" />
                <DeskBone className="h-3" />
                <DeskBone className="h-3" />
              </div>
            ))}
            <div className="py-2 my-1 border-y border-white/[0.06] flex justify-between gap-3">
              <DeskBone className="h-5 w-24" />
              <DeskBone className="h-2 w-16 self-center" />
            </div>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={`b-${i}`} className="grid grid-cols-3 gap-2">
                <DeskBone className="h-3" />
                <DeskBone className="h-3" />
                <DeskBone className="h-3" />
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] p-3 space-y-2">
            <DeskBone className="h-3 w-20" />
            <DeskBone className="h-16 w-full rounded" />
          </div>
        </aside>
      </div>
    </div>
  )
}
