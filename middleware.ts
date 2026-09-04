import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { readSessionFromRequest, SESSION_COOKIE } from '@/lib/auth-session'

const PROTECTED_PREFIXES = ['/account']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = await readSessionFromRequest(req)

  const needsAuth = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (needsAuth && !session) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/auth' && session) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  if (session) {
    response.headers.set('x-user-id', session.userId)
    response.headers.set('x-user-role', session.role)
  } else if (req.cookies.get(SESSION_COOKIE)) {
    response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  }

  return response
}

export const config = {
  matcher: ['/auth', '/account/:path*'],
}
