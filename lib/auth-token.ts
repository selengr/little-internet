export const SESSION_COOKIE = 'fun_apis_session'

export type SessionPayload = {
  userId: string
  email: string
  role: 'user' | 'admin'
  exp: number
}

function getSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-auth-secret-change-me'
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function encodeJson(value: unknown) {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(value)))
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(fromBase64Url(value))) as T
}

async function getKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(body: string) {
  const key = await getKey()
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return toBase64Url(signature)
}

async function verify(body: string, signature: string) {
  const key = await getKey()
  return crypto.subtle.verify('HMAC', key, fromBase64Url(signature), new TextEncoder().encode(body))
}

export async function createSessionToken(payload: SessionPayload) {
  const body = encodeJson(payload)
  return `${body}.${await sign(body)}`
}

export async function parseToken(token: string): Promise<SessionPayload | null> {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  try {
    const ok = await verify(body, signature)
    if (!ok) return null

    const payload = decodeJson<SessionPayload>(body)
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

export async function readSessionFromRequest(req: Request): Promise<SessionPayload | null> {
  const header = req.headers.get('cookie') || ''
  const match = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))
  if (!match?.[1]) return null
  return parseToken(decodeURIComponent(match[1]))
}
