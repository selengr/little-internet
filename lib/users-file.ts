import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

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

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')

async function ensureStore(): Promise<void> {
  await fs.mkdir(path.dirname(USERS_PATH), { recursive: true })
  try {
    await fs.access(USERS_PATH)
  } catch {
    await fs.writeFile(USERS_PATH, '[]\n', 'utf8')
  }
}

async function readUsers(): Promise<StoredUser[]> {
  await ensureStore()
  const raw = await fs.readFile(USERS_PATH, 'utf8')
  try {
    const parsed = JSON.parse(raw) as StoredUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await ensureStore()
  await fs.writeFile(USERS_PATH, `${JSON.stringify(users, null, 2)}\n`, 'utf8')
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { password: _password, ...publicUser } = user
  return publicUser
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const users = await readUsers()
  const normalized = email.trim().toLowerCase()
  return users.find(user => user.email.toLowerCase() === normalized) ?? null
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const users = await readUsers()
  return users.find(user => user.id === id) ?? null
}

export async function createUser(input: {
  firstName: string
  lastName: string
  email: string
  passwordHash: string
}): Promise<StoredUser> {
  const users = await readUsers()
  const normalizedEmail = input.email.trim().toLowerCase()

  if (users.some(user => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('USER_EXISTS')
  }

  const now = new Date().toISOString()
  const user: StoredUser = {
    id: randomUUID(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizedEmail,
    password: input.passwordHash,
    role: 'user',
    createdAt: now,
    updatedAt: now,
  }

  users.push(user)
  await writeUsers(users)
  return user
}
