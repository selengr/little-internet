import { NextRequest, NextResponse } from 'next/server'
import {
  appendVisitorEntry,
  formatVisitorEntry,
  type VisitorSnapshot,
} from '@/lib/visitor-log'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function pickIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || null
  return req.headers.get('x-real-ip')?.trim() || null
}

function pickSnapshot(raw: unknown): VisitorSnapshot {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const o = raw as Record<string, unknown>
  const str = (k: string) =>
    typeof o[k] === 'string' ? (o[k] as string).slice(0, 300) : null
  return {
    device: str('device'),
    os: str('os'),
    browser: str('browser'),
    screen: str('screen'),
    language: str('language'),
    timezone: str('timezone'),
    path: str('path'),
    referrer: str('referrer'),
  }
}

export async function POST(req: NextRequest) {
  let body: { client?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const snap = pickSnapshot(body.client)
  if (!snap.path) {
    const referer = req.headers.get('referer')
    if (referer) {
      try {
        snap.path = new URL(referer).pathname
      } catch {
        /* ignore */
      }
    }
  }
  if (!snap.referrer) {
    snap.referrer = req.headers.get('referer')
  }

  const server = {
    at: new Date().toISOString(),
    ip: pickIp(req),
    country: req.headers.get('x-vercel-ip-country'),
    city: req.headers.get('x-vercel-ip-city'),
  }

  try {
    const file = await appendVisitorEntry(formatVisitorEntry(server, snap))
    return NextResponse.json({ ok: true, file })
  } catch (err) {
    console.error('[visitor-log]', err)
    return NextResponse.json(
      { ok: false, error: 'Could not write visitor log' },
      { status: 500 },
    )
  }
}
