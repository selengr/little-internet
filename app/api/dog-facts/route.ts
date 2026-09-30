// dogapi.dog is the live source. The Heroku "dog-facts-api" this route used to try first has been
// retired (it answers 404 after several seconds), so it only made every request slower.
export async function GET() {
  try {
    const res = await fetch('https://dogapi.dog/api/v2/facts', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      return Response.json({ error: 'Failed to fetch dog fact' }, { status: 502 })
    }
    const json = await res.json()
    const fact: string | undefined = json?.data?.[0]?.attributes?.body
    if (!fact) {
      return Response.json({ error: 'Failed to fetch dog fact' }, { status: 502 })
    }
    return Response.json([{ fact }])
  } catch {
    return Response.json({ error: 'Failed to fetch dog fact' }, { status: 502 })
  }
}
