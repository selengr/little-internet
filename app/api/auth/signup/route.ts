import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createUser, toPublicUser } from '@/lib/users-file'
import { attachSessionCookie } from '@/lib/auth-session'

// DB path kept for later — Mongo is not running yet.
// import { connectDB } from "@/lib/mongodb";
// import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const firstName = String(body.firstName ?? '').trim()
    const lastName = String(body.lastName ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const rememberMe = Boolean(body.rememberMe)

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

    // --- Mongo (commented until DB is available) ---
    // await connectDB();
    // const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   return NextResponse.json({ message: "User already exists" }, { status: 400 });
    // }
    // const hashedPassword = await bcrypt.hash(password, 10);
    // const user = await User.create({
    //   firstName,
    //   lastName,
    //   email,
    //   password: hashedPassword,
    // });
    // const publicUser = {
    //   id: String(user._id),
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    //   email: user.email,
    //   role: "user" as const,
    //   createdAt: user.createdAt?.toISOString?.() ?? new Date().toISOString(),
    //   updatedAt: user.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    // };

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await createUser({
      firstName,
      lastName,
      email,
      passwordHash: hashedPassword,
    })
    const publicUser = toPublicUser(user)

    const response = NextResponse.json({
      message: 'Account created successfully',
      user: publicUser,
    })

    return attachSessionCookie(response, publicUser, rememberMe)
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_EXISTS') {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 })
    }

    console.error('[auth/signup]', error)
    return NextResponse.json({ message: 'Could not create account' }, { status: 500 })
  }
}
