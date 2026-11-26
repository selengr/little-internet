/** ?pins=1 shows only pinned tables on the arcade picker. */
export function pinsOnlyFromSearchParam(raw: string | null | undefined): boolean {
  if (!raw) return false
  const v = raw.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function pinsParamValue(active: boolean): string | null {
  return active ? '1' : null
}