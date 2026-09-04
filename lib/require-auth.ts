import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-session'
import type { PublicUser } from '@/lib/users-file'

export async function requireUser(): Promise<
  { user: PublicUser; error?: undefined } | { user?: undefined; error: NextResponse }
> {
  const user = await getSessionUser()
  if (!user) {
    return {
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { user }
}

export async function requireAdmin(): Promise<
  { user: PublicUser; error?: undefined } | { user?: undefined; error: NextResponse }
> {
  const result = await requireUser()
  if (result.error) return result
  if (result.user.role !== 'admin') {
    return {
      error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
    }
  }
  return result
}
