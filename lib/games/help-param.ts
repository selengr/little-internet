export function shouldOpenArcadeHelp(raw: string | null) {
  return raw === '1' || raw === 'true' || raw === 'open'
}
