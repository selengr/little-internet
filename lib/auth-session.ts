import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { PublicUser } from '@/lib/users-file'
import { findUserById, toPublicUser } from '@/lib/users-file'
import {
  SESSION_COOKIE,
  createSessionToken,
  parseToken,
  sessionMaxAgeSeconds,
} from '@/lib/auth-token'

export { SESSION_COOKIE, readSessionFromRequest, parseToken } from '@/lib/auth-token'
export type { SessionPayload } from '@/lib/auth-token'

export async function attachSessionCookie(
  response: NextResponse,
  user: PublicUser,
  rememberMe = false,
) {
  const maxAge = sessionMaxAgeSeconds(rememberMe)
  const token = await createSessionToken({
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

  const payload = await parseToken(token)
  if (!payload) return null

  const user = await findUserById(payload.userId)
  if (!user) return null

  return toPublicUser(user)
}
