import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local'), quiet: true })

const PAGE_ID = '3e19bb33-3bcb-810c-9a8a-fc0440ed255f'
const NOTION_VERSION = '2026-03-11'
const key = process.env.NOTION_API_KEY?.trim()

if (!key) {
  console.error('Missing NOTION_API_KEY')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${key}`,
  'Notion-Version': NOTION_VERSION,
  'Content-Type': 'application/json',
}

const title = 'How to Talk to AI So It Understands You'

const summary = 'Learn how to give AI clear instructions and get answers that actually help.'

const introduction = `You don't need to understand AI to use it well. You just need to learn how to explain what you want.

A prompt is simply the information and instructions you give an AI to get a response. It can be a question, a few sentences, or a detailed request.

**The clearer your request, the less AI has to guess.**`

const conclusion = `A good prompt isn't a magic trick. It's just clear communication.

You don't need hundreds of prompt tricks. Learn to explain what you want, give AI the context it needs, and refine the result.

That's prompting.`

const markdownPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../content/blog/how-to-write-a-good-prompt.md',
)
const markdown = readFileSync(markdownPath, 'utf8').trim()

async function main() {
  const propsRes = await fetch(`https://api.notion.com/v1/pages/${PAGE_ID}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      properties: {
        Title: {
          title: [{ type: 'text', text: { content: title } }],
        },
        Summary: {
          rich_text: [{ type: 'text', text: { content: summary } }],
        },
        Introduction: {
          rich_text: [{ type: 'text', text: { content: introduction } }],
        },
        Conclusion: {
          rich_text: [{ type: 'text', text: { content: conclusion } }],
        },
        Tags: {
          multi_select: ['AI', 'Prompting', 'LLM', 'Guide'].map(name => ({
            name,
          })),
        },
        'Reading Minutes': { number: 5 },
      },
    }),
  })
  const propsJson = await propsRes.json()
  if (!propsRes.ok) {
    console.error('Properties update failed:', propsJson.message ?? propsJson)
    process.exit(1)
  }

  const mdRes = await fetch(`https://api.notion.com/v1/pages/${PAGE_ID}/markdown`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      type: 'replace_content',
      replace_content: { new_str: `# ${title}\n\n${markdown}` },
    }),
  })
  const mdJson = await mdRes.json()
  if (!mdRes.ok) {
    console.error('Markdown update failed:', mdJson.message ?? mdJson)
    process.exit(1)
  }

  console.log('Updated:', title)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
