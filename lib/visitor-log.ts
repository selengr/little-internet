import { promises as fs } from 'fs'
import path from 'path'

export const VISITORS_PATH = path.join(process.cwd(), 'data', 'visitors.txt')

export type VisitorSnapshot = {
  device?: string | null
  os?: string | null
  browser?: string | null
  screen?: string | null
  language?: string | null
  timezone?: string | null
  path?: string | null
  referrer?: string | null
}

export type VisitorServerInfo = {
  at: string
  ip: string | null
  country: string | null
  city: string | null
}

function val(v: unknown): string {
  if (v == null || v === '') return '—'
  return String(v)
}

/** Compact one-block entry — only what you need to recognize the visitor. */
export function formatVisitorEntry(
  server: VisitorServerInfo,
  snap: VisitorSnapshot,
): string {
  const place = [server.city, server.country].filter(Boolean).join(', ') || '—'
  return [
    '----------',
    `time:     ${val(server.at)}`,
    `ip:       ${val(server.ip)}`,
    `place:    ${place}`,
    `page:     ${val(snap.path)}`,
    `from:     ${val(snap.referrer)}`,
    `device:   ${val(snap.device)}`,
    `os:       ${val(snap.os)}`,
    `browser:  ${val(snap.browser)}`,
    `screen:   ${val(snap.screen)}`,
    `language: ${val(snap.language)}`,
    `timezone: ${val(snap.timezone)}`,
    '',
  ].join('\n')
}

export async function appendVisitorEntry(entry: string): Promise<string> {
  await fs.mkdir(path.dirname(VISITORS_PATH), { recursive: true })
  await fs.appendFile(VISITORS_PATH, entry, 'utf8')
  return VISITORS_PATH
}
