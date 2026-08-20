const ABSOLUTE: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** Blog listing dates: relative within 30 days, absolute after that. */
export function formatBlogDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso

    const diffMs = Date.now() - date.getTime()
    if (diffMs >= 0) {
      const diffDays = Math.floor(diffMs / 86_400_000)
      if (diffDays <= 30) {
        if (diffDays > 0) return relativeFormatter.format(-diffDays, 'day')
        const diffHours = Math.floor(diffMs / 3_600_000)
        if (diffHours > 0) return relativeFormatter.format(-diffHours, 'hour')
        const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000))
        return relativeFormatter.format(-diffMinutes, 'minute')
      }
    }

    return new Intl.DateTimeFormat('en', ABSOLUTE).format(date)
  } catch {
    return iso
  }
}
