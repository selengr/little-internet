import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local'), quiet: true })

const PAGE_ID = '3b39bb33-3bcb-8169-b449-d080af3f7462'
const NOTION_VERSION = '2026-03-11'
const BANNER_IMAGE = 'https://rezakarbakhsh.ir/images/banners/s3-us-west-2.avif'
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

const title = "Computer Science vs IT: What's the Difference?"

const summary =
  'A simple guide to how Computer Science and IT differ — and which path might fit you better.'

const introduction = `Computer Science and Information Technology are often treated as the same thing. They are both about technology, but they focus on different problems.

A simple way to think about it is:

> **Computer Science builds and understands technology. IT uses and manages technology.**

Let's make the difference simple.`

const conclusion = `If you remember only one thing, remember this:

**Computer Science is more about creating and understanding technology.**

**IT is more about managing and using technology.**

Neither is better. They simply solve different kinds of problems.

The best choice is the one that matches the kind of work you actually enjoy.

After all, you will spend a lot of time doing that work — so choose the one that makes you curious enough to keep learning.`

const markdownPath = resolve(dirname(fileURLToPath(import.meta.url)), '../content/blog/computer-science-vs-it.md')
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
        'Reading Minutes': { number: 7 },
        Tags: {
          multi_select: ['Engineering', 'Career', 'Technology', 'Computer Science', 'IT'].map(
            name => ({ name }),
          ),
        },
        'Banner Image': { url: BANNER_IMAGE },
      },
      cover: {
        type: 'external',
        external: { url: BANNER_IMAGE },
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
      replace_content: { new_str: markdown },
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
