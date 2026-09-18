import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SYSTEM = `You are the Little Internet guide — a short, friendly helper on Reza’s site (little-internet).
Help people find their way around: books, crypto, forex, jokes, poetry, animal facts, location, dictionary, photos, blog, and tools.
Keep answers brief and human. Prefer pointing to pages like /books, /crypto, /forex, /jokes, /poetry, /animal-facts, /location, /dictionary, /photos, /blog.
If you don’t know something about the site, say so and suggest exploring. Never invent API keys or private data.`

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

function getConfig() {
  const apiKey = process.env.INFERX_API_KEY?.trim()
  const baseUrl = (process.env.INFERX_BASE_URL || 'https://model.inferx.net/endpoints/v1').replace(/\/$/, '')
  const model = process.env.INFERX_MODEL || 'gemma-4-31B-it-fp8'
  return { apiKey, baseUrl, model }
}

export async function POST(request: NextRequest) {
  const { apiKey, baseUrl, model } = getConfig()
  if (!apiKey) {
    return Response.json(
      { error: 'Assistant is not configured yet. Add INFERX_API_KEY on the server.' },
      { status: 503 },
    )
  }

  let body: { messages?: ChatMessage[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const incoming = Array.isArray(body.messages) ? body.messages : []
  const cleaned = incoming
    .filter(
      m =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    )
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content.trim().slice(0, 4000) }))

  if (cleaned.length === 0) {
    return Response.json({ error: 'Say something first.' }, { status: 400 })
  }

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: 'system', content: SYSTEM }, ...cleaned],
    }),
    cache: 'no-store',
  })

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '')
    return Response.json(
      { error: text.slice(0, 240) || `InferX error ${upstream.status}` },
      { status: 502 },
    )
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      let buffer = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const data = trimmed.slice(5).trim()
            if (!data || data === '[DONE]') continue
            try {
              const json = JSON.parse(data)
              const delta = json?.choices?.[0]?.delta?.content
              if (typeof delta === 'string' && delta) {
                controller.enqueue(encoder.encode(delta))
              }
            } catch {
              /* skip partial json */
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'stream failed'
        controller.enqueue(encoder.encode(`\n\n(${message})`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
