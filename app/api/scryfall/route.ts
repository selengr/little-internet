import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'LittleInternet/1.0 (games-v2)',
}

type Face = { image_uris?: { art_crop?: string; normal?: string } }

type CardJson = {
  id?: string
  name?: string
  set_name?: string
  prices?: { usd?: string | null }
  image_uris?: { art_crop?: string; normal?: string }
  card_faces?: Face[]
}

function artOf(card: CardJson) {
  return (
    card.image_uris?.art_crop ||
    card.image_uris?.normal ||
    card.card_faces?.[0]?.image_uris?.art_crop ||
    card.card_faces?.[0]?.image_uris?.normal ||
    ''
  )
}

async function randomPriced() {
  const query = encodeURIComponent('game:paper usd>0.2')
  const res = await fetch(`https://api.scryfall.com/cards/random?q=${query}`, {
    headers: HEADERS,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('scryfall')
  const card = (await res.json()) as CardJson
  const usd = Number(card.prices?.usd)
  const art = artOf(card)
  if (!card.id || !card.name || !art || !Number.isFinite(usd) || usd <= 0) return null
  return {
    id: card.id,
    name: card.name,
    set: card.set_name || '',
    art,
    usd,
  }
}

export async function GET(_request: NextRequest) {
  try {
    const pair: NonNullable<Awaited<ReturnType<typeof randomPriced>>>[] = []
    for (let attempt = 0; attempt < 8 && pair.length < 2; attempt += 1) {
      const card = await randomPriced()
      if (!card) continue
      if (pair.some(existing => existing.id === card.id || existing.usd === card.usd)) continue
      pair.push(card)
    }
    if (pair.length < 2) {
      return Response.json({ error: 'Could not draw two cards.' }, { status: 502 })
    }
    return Response.json({ left: pair[0], right: pair[1] })
  } catch {
    return Response.json({ error: 'The card shop is unreachable.' }, { status: 502 })
  }
}
