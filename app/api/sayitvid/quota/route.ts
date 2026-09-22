import { NextResponse } from 'next/server'
import { fetchSayItVidQuota } from '@/lib/sayitvid'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await fetchSayItVidQuota()

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      )
    }

    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json(
      { error: 'Could not check remaining searches.', code: 'upstream' },
      { status: 502 },
    )
  }
}
