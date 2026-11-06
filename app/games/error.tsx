'use client'

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
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Try again
      </button>
    </div>
  )
}
