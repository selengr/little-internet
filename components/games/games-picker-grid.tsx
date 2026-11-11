'use client'

import type { ReactNode } from 'react'

/** Card grid layout for the arcade picker (exit animation lives on the parent in the hub). */
export function GamesPickerGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">{children}</div>
}
