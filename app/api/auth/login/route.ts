import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { findUserByEmail, toPublicUser } from '@/lib/users-file'
import { attachSessionCookie } from '@/lib/auth-session'

// DB path kept for later — Mongo is not running yet.
// import { connectDB } from "@/lib/mongodb";
// import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const rememberMe = Boolean(body.rememberMe)

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    // --- Mongo (commented until DB is available) ---
    // await connectDB();
    // const user = await User.findOne({ email });
    // if (!user) {
    //   return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    // }
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    // }
    // const publicUser = {
    //   id: String(user._id),
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    //   email: user.email,
    //   role: "user" as const,
    //   createdAt: user.createdAt?.toISOString?.() ?? new Date().toISOString(),
    //   updatedAt: user.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    // };

    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    const publicUser = toPublicUser(user)
    const response = NextResponse.json({
      message: 'Login success',
      user: publicUser,
    })

    return attachSessionCookie(response, publicUser, rememberMe)
  } catch (error) {
    console.error('[auth/login]', error)
    return NextResponse.json({ message: 'Could not sign in' }, { status: 500 })
  }
}
