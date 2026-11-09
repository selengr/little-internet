'use client'

import { FilterX } from 'lucide-react'

export function GamesPickerEmpty({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-muted/30 px-6 py-14 text-center sm:col-span-3">
      <FilterX className="size-8 text-muted-foreground/70" aria-hidden />
      <p className="mt-3 text-sm font-semibold text-foreground">No tables match</p>
      <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">Try another mood or clear your search.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 rounded-full border border-border bg-card px-4 py-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
      >
        Clear filters
      </button>
    </div>
  )
}
