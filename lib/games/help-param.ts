/** True when the URL query opens the arcade help sheet (?help=1). */
export function shouldOpenArcadeHelp(raw: string | null) {
  return raw === '1' || raw === 'true' || raw === 'open'
}
