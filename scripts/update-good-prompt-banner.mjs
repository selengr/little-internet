import { config } from 'dotenv'
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

// Reverted back to the original neural-network banner (the user preferred
// it over the blue-wave and aurora-borealis alternatives that were tried in
// between). Both alternates stay archived locally:
//   public/images/banners/how-to-write-a-good-prompt-blue-wave.jpg
//   public/images/banners/how-to-write-a-good-prompt-aurora.jpg
const BANNER_IMAGE = 'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=1600&q=85&fit=crop'

async function main() {
  const res = await fetch(`https://api.notion.com/v1/pages/${PAGE_ID}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      properties: {
        'Banner Image': { url: BANNER_IMAGE },
      },
      cover: { type: 'external', external: { url: BANNER_IMAGE } },
    }),
  })
  const json = await res.json()
  if (!res.ok) {
    console.error('Banner update failed:', json.message ?? json)
    process.exit(1)
  }
  console.log('Banner updated to:', BANNER_IMAGE)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
