import { ARCADE_TIPS, type ArcadeTip } from '@/lib/games/arcade-tips'

/** Shorter list for the help sheet — unique texts, newest general tips preferred. */
export function featuredArcadeTips(limit = 24): ArcadeTip[] {
  const seen = new Set<string>()
  const out: ArcadeTip[] = []
  for (let i = ARCADE_TIPS.length - 1; i >= 0 && out.length < limit; i--) {
    const tip = ARCADE_TIPS[i]
    if (!tip || seen.has(tip.text)) continue
    seen.add(tip.text)
    out.push(tip)
  }
  return out.reverse()
}
