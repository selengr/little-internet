'use client'

/** Screen-reader announcement when the picker vs a table changes. */
export function GamesLiveRegion({ message }: { message: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  )
}
