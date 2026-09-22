import { NextRequest, NextResponse } from 'next/server'
import { searchPronunciations } from '@/lib/sayitvid'
import type { SayItVidAccent } from '@/types/sayitvid'

export const dynamic = 'force-dynamic'

const ACCENTS = new Set<SayItVidAccent>(['all', 'us', 'uk', 'aus'])

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = searchParams.get('q') ?? ''
  const accentRaw = (searchParams.get('accent') ?? 'all').toLowerCase()
  const accent = (ACCENTS.has(accentRaw as SayItVidAccent)
    ? accentRaw
    : 'all') as SayItVidAccent
  const limit = Number(searchParams.get('limit') ?? '12')
  const offset = Number(searchParams.get('offset') ?? '0')

  try {
    const result = await searchPronunciations({
      q,
      accent,
      limit: Number.isFinite(limit) ? limit : 12,
      offset: Number.isFinite(offset) ? offset : 0,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          code: result.code ?? 'bad_request',
          quota: result.body && 'quota' in result.body ? result.body.quota : undefined,
        },
        { status: result.status },
      )
    }

    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json(
      { error: 'Could not search right now. Please try again.', code: 'upstream' },
      { status: 502 },
    )
  }
}
