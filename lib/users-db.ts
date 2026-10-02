import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

export type StoredUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}

export type PublicUser = Omit<StoredUser, 'password'>

type UserDoc = {
  _id: unknown
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'user' | 'admin'
  createdAt?: Date
  updatedAt?: Date
}

function serialize(doc: UserDoc): StoredUser {
  return {
    id: String(doc._id),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    password: doc.password,
    role: doc.role,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { password: _password, ...publicUser } = user
  return publicUser
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  await connectDB()
  const normalized = email.trim().toLowerCase()
  const doc = await User.findOne({ email: normalized }).lean<UserDoc>()
  return doc ? serialize(doc) : null
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  if (!mongoose.isValidObjectId(id)) return null
  await connectDB()
  const doc = await User.findById(id).lean<UserDoc>()
  return doc ? serialize(doc) : null
}

export async function createUser(input: {
  firstName: string
  lastName: string
  email: string
  passwordHash: string
}): Promise<StoredUser> {
  await connectDB()
  const normalizedEmail = input.email.trim().toLowerCase()

  const existing = await User.findOne({ email: normalizedEmail }).lean<UserDoc>()
  if (existing) {
    throw new Error('USER_EXISTS')
  }

  const doc = await User.create({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizedEmail,
    password: input.passwordHash,
    role: 'user',
  })

  return serialize(doc as unknown as UserDoc)
}
