import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local'), quiet: true })

const NOTION_VERSION = '2026-03-11'
const key = process.env.NOTION_API_KEY?.trim()
const databaseId = process.env.NOTION_BLOG_DATABASE_ID?.trim()

if (!key) {
  console.error('Missing NOTION_API_KEY')
  process.exit(1)
}
if (!databaseId) {
  console.error('Missing NOTION_BLOG_DATABASE_ID')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${key}`,
  'Notion-Version': NOTION_VERSION,
  'Content-Type': 'application/json',
}

const BANNER_IMAGE = 'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=1600&q=85&fit=crop'

const title = 'How to Write a Good Prompt'
const slug = 'how-to-write-a-good-prompt'

const summary =
  "A simple, no-nonsense guide to writing prompts that actually get you what you want — plus a plain-English look at how LLMs work."

const introduction = `You don't need to be an AI expert to get better answers from AI. You just need to learn how to **communicate clearly**.

A prompt is simply what you give an AI before it responds — a question, a sentence, or a detailed set of instructions.

Here's the important part:

> **The quality of your answer often depends on the quality of your direction.**

Think about talking to another person. Say "Make this better," and they have to guess what "better" means. Say "Make this shorter, clearer, and more professional — keep the meaning the same," and now they know exactly what you want.

AI works the same way.`

const conclusion = `A good prompt is not a magic spell. It's **clear communication**.

When your prompt is unclear, the AI has to guess more. When you give it context, direction, and a clear goal, there's less room for guessing — and better results.

So before you hit send, ask yourself three questions:

- What am I actually trying to achieve?
- What does the AI need to know?
- What should the result look and feel like?

If you can answer those, you already understand prompting better than you think. You don't need a hundred memorized tricks — just **think clearly, explain clearly, and refine as you go.**

The better you communicate, the more useful AI becomes.`

const markdownPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../content/blog/how-to-write-a-good-prompt.md',
)
const markdown = readFileSync(markdownPath, 'utf8').trim()

async function resolveDataSourceId() {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers,
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.message ?? `Failed to retrieve database (${res.status})`)
  }
  const id = json.data_sources?.[0]?.id
  if (!id) throw new Error('No data_sources on this database.')
  return id
}

async function main() {
  const dataSourceId = await resolveDataSourceId()

  const properties = {
    Title: { title: [{ type: 'text', text: { content: title } }] },
    Slug: { rich_text: [{ type: 'text', text: { content: slug } }] },
    Status: { status: { name: 'Published' } },
    Date: { date: { start: new Date().toISOString().slice(0, 10) } },
    Tags: {
      multi_select: ['AI', 'Prompt Engineering', 'Notes'].map(name => ({ name })),
    },
    Summary: { rich_text: [{ type: 'text', text: { content: summary } }] },
    Introduction: { rich_text: [{ type: 'text', text: { content: introduction } }] },
    Conclusion: { rich_text: [{ type: 'text', text: { content: conclusion } }] },
    'Author Name': { rich_text: [{ type: 'text', text: { content: 'Reza Karbakhsh' } }] },
    'Banner Image': { url: BANNER_IMAGE },
    Views: { number: 0 },
    'Reading Minutes': { number: 6 },
    Featured: { checkbox: true },
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      parent: { type: 'data_source_id', data_source_id: dataSourceId },
      properties,
      cover: { type: 'external', external: { url: BANNER_IMAGE } },
      markdown: `# ${title}\n\n${markdown}`,
    }),
  })

  const json = await res.json()
  if (!res.ok) {
    console.error('Create failed:', json.message ?? json)
    process.exit(1)
  }

  console.log('Created:', title)
  console.log('Page ID:', json.id)
  console.log('URL:', json.url)
  console.log('Live at: /blog/' + slug)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
