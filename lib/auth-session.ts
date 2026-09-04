import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { PublicUser } from '@/lib/users-file'
import { findUserById, toPublicUser } from '@/lib/users-file'

export const SESSION_COOKIE = 'fun_apis_session'

type SessionPayload = {
  userId: string
  email: string
  role: PublicUser['role']
  exp: number
}

function getSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-auth-secret-change-me'
}

function encode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(body: string) {
  return createHmac('sha256', getSecret()).update(body).digest('base64url')
}

function createToken(payload: SessionPayload) {
  const body = encode(JSON.stringify(payload))
  return `${body}.${sign(body)}`
}

function parseToken(token: string): SessionPayload | null {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  const expected = sign(body)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null

  try {
    const payload = JSON.parse(decode(body)) as SessionPayload
    if (!payload?.userId || !payload?.exp) return null
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export function sessionMaxAgeSeconds(rememberMe: boolean) {
  return rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7
}

export function attachSessionCookie(
  response: NextResponse,
  user: PublicUser,
  rememberMe = false,
) {
  const maxAge = sessionMaxAgeSeconds(rememberMe)
  const token = createToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + maxAge * 1000,
  })

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  })

  return response
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null

  const payload = parseToken(token)
  if (!payload) return null

  const user = await findUserById(payload.userId)
  if (!user) return null

  return toPublicUser(user)
}

export function readSessionFromRequest(req: Request): SessionPayload | null {
  const header = req.headers.get('cookie') || ''
  const match = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))
  if (!match?.[1]) return null
  return parseToken(decodeURIComponent(match[1]))
}
