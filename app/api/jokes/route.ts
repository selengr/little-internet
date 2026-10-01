import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://v2.jokeapi.dev'
const UA = 'fun-apis/1.0 (https://github.com)'

export const dynamic = 'force-dynamic'

const SERVED = 'Programming,Misc,Pun,Spooky,Christmas'

// JokeAPI's own flags don't cover everything a public personal site shouldn't show (its "Dark"
// category in particular), so jokes touching these subjects are skipped and another one is drawn.
const SENSITIVE = /suicid|self[- ]?harm|kill (?:my|him|her|them)self|\brape|molest|abus(?:e|ed|ing)\b|holocaust|genocide|terroris|pedo|cancer|funeral|dead (?:baby|babies|kid|child)/i

function isSensitive(json: unknown) {
  if (!json || typeof json !== 'object') return false
  const j = json as { joke?: string; setup?: string; delivery?: string }
  return SENSITIVE.test([j.joke, j.setup, j.delivery].filter(Boolean).join(' '))
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const endpoint = searchParams.get('endpoint') ?? 'joke'

  let url: URL

  if (endpoint === 'info') {
    url = new URL(`${BASE}/info`)
  } else if (endpoint === 'categories') {
    url = new URL(`${BASE}/categories`)
  } else {
    // The Dark category is never served on this public site; "Any" and "Dark" both map to the rest.
    const asked = searchParams.get('category') ?? 'Any'
    const category = asked === 'Any' || asked === 'Dark' ? SERVED : asked
    url = new URL(`${BASE}/joke/${encodeURIComponent(category)}`)
  }

  searchParams.forEach((value, key) => {
    if (key === 'endpoint' || key === 'category') return
    url.searchParams.set(key, value)
  })

  if (!url.searchParams.has('safe-mode')) {
    url.searchParams.set('safe-mode', '')
  }
  if (!url.searchParams.has('blacklistFlags')) {
    url.searchParams.set('blacklistFlags', 'nsfw,religious,political,racist,sexist,explicit')
  }

  try {
    let res = await fetch(url.toString(), {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      cache: 'no-store',
    })
    let json = await res.json()

    // Draw again (a few times) when the joke is about something we don't want to show.
    for (let i = 0; i < 6 && res.ok && endpoint === 'joke' && isSensitive(json); i++) {
      res = await fetch(url.toString(), {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        cache: 'no-store',
      })
      json = await res.json()
    }
    if (res.ok && endpoint === 'joke' && isSensitive(json)) {
      return NextResponse.json({ error: true, message: 'No suitable joke found' }, { status: 502 })
    }

    if (!res.ok) {
      return NextResponse.json(json, { status: res.status })
    }

    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: true, message: 'Failed to fetch jokes' }, { status: 502 })
  }
}
