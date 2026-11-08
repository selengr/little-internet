'use client'

import Link from 'next/link'

export default function GamesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-28 text-center">
      <p className="text-lg font-semibold text-foreground">Could not load the arcade</p>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || 'Something went wrong.'}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Try again
        </button>
        <Link
          href="/games"
          className="inline-flex rounded-full border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to picker
        </Link>
      </div>
    </div>
  )
}
