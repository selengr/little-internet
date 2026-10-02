import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createUser, toPublicUser } from '@/lib/users-db'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { key: 'signup', limit: 5, windowMs: 60_000 })
  if (limited) return limited

  try {
    const body = await req.json()
    const firstName = String(body.firstName ?? '').trim()
    const lastName = String(body.lastName ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Invalid email address' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 },
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await createUser({
      firstName,
      lastName,
      email,
      passwordHash: hashedPassword,
    })
    const publicUser = toPublicUser(user)

    // Account only — no session. Client switches to Sign in next.
    return NextResponse.json({
      message: 'Account created successfully',
      user: publicUser,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_EXISTS') {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 })
    }

    console.error('[auth/signup]', error)

    if (error instanceof Error && error.message.includes('MONGODB_URI')) {
      return NextResponse.json(
        { message: 'Accounts are not available right now' },
        { status: 503 },
      )
    }

    return NextResponse.json({ message: 'Could not create account' }, { status: 500 })
  }
}
