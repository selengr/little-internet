import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

const BASE = 'https://opentdb.com/api.php'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // OpenTDB is a free, shared public service with its own per-IP throttling —
  // staying well under that as a group of visitors is just being a good citizen.
  const limited = checkRateLimit(request, { key: 'trivia', limit: 30, windowMs: 60_000 })
  if (limited) return limited

  const { searchParams } = request.nextUrl
  const amountRaw = Number(searchParams.get('amount') ?? 10)
  const amount = Number.isFinite(amountRaw) ? Math.min(Math.max(amountRaw, 1), 50) : 10
  const category = searchParams.get('category')
  const difficulty = searchParams.get('difficulty')

  const url = new URL(BASE)
  url.searchParams.set('amount', String(amount))
  url.searchParams.set('type', 'multiple')
  if (category) url.searchParams.set('category', category)
  if (difficulty) url.searchParams.set('difficulty', difficulty)

  try {
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    const json = await res.json()
    return NextResponse.json(json, { status: res.ok ? 200 : 502 })
  } catch {
    return NextResponse.json(
      { response_code: -1, results: [], error: 'Failed to reach the trivia service' },
      { status: 502 },
    )
  }
}
