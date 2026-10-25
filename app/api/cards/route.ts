import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const BASE = 'https://deckofcardsapi.com/api/deck'

type ApiCard = {
  code: string
  value: string
  suit: string
  images?: { svg?: string }
  image?: string
}

function mapCard(card: ApiCard) {
  return {
    code: card.code,
    value: card.value,
    suit: card.suit,
    svg: card.images?.svg || card.image || '',
  }
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')

  try {
    if (action === 'shuffle') {
      const res = await fetch(`${BASE}/new/shuffle/?deck_count=1`, { cache: 'no-store' })
      if (!res.ok) throw new Error('shuffle failed')
      const json = (await res.json()) as { deck_id?: string; remaining?: number; success?: boolean }
      if (!json.success || !json.deck_id) throw new Error('shuffle failed')
      return Response.json({ deckId: json.deck_id, remaining: json.remaining ?? 52 })
    }

    if (action === 'draw') {
      const deckId = request.nextUrl.searchParams.get('deck')
      const count = Math.min(8, Math.max(1, Number(request.nextUrl.searchParams.get('count') || 1)))
      if (!deckId || !/^[\w-]+$/.test(deckId)) {
        return Response.json({ error: 'Missing deck.' }, { status: 400 })
      }
      const res = await fetch(`${BASE}/${deckId}/draw/?count=${count}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('draw failed')
      const json = (await res.json()) as {
        success?: boolean
        remaining?: number
        cards?: ApiCard[]
        error?: string
      }
      if (!json.success || !json.cards?.length) {
        return Response.json({ error: json.error || 'Deck is empty.' }, { status: 409 })
      }
      return Response.json({
        cards: json.cards.map(mapCard),
        remaining: json.remaining ?? 0,
      })
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 })
  } catch {
    return Response.json({ error: 'The deck is unreachable.' }, { status: 502 })
  }
}
