const LL_UPCOMING = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/'
const UA = 'LittleInternet/1.0 (+https://rezakarbakhsh.ir)'

export type LaunchCard = {
  id: number
  name: string
  net: string
  provider: string
  location: string
  mission?: string
  image?: string
}

type LlLaunch = {
  id?: number
  name?: string
  net?: string
  mission?: { name?: string; description?: string }
  launch_service_provider?: { name?: string }
  pad?: { location?: { name?: string }; image?: string | null }
  image?: string | null
}

export async function fetchUpcomingLaunches(limit = 6): Promise<LaunchCard[]> {
  const url = `${LL_UPCOMING}?limit=${limit}&mode=list`
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const json = (await res.json()) as { results?: LlLaunch[] }
    const results = json.results ?? []
    return results
      .filter(l => typeof l.id === 'number' && l.name && l.net)
      .map(l => ({
        id: l.id as number,
        name: l.name as string,
        net: l.net as string,
        provider: l.launch_service_provider?.name ?? 'Unknown provider',
        location: l.pad?.location?.name ?? 'Launch site',
        mission: l.mission?.name,
        image: (l.image || l.pad?.image) ?? undefined,
      }))
  } catch {
    return []
  }
}
