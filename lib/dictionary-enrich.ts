import type {
  Pronunciation,
  WikiImage,
  WiktionaryDefinition,
  WiktionaryEntry,
} from '@/types/wiktionary'

const DICT_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en'
const WIKI_BASE = 'https://en.wikipedia.org/w/api.php'
const UA = 'fun-apis/1.0 (dictionary; contact: github.com)'

interface DictPhonetic {
  text?: string
  audio?: string
}

interface DictDefinition {
  definition: string
  example?: string
  synonyms?: string[]
  antonyms?: string[]
}

interface DictMeaning {
  partOfSpeech: string
  definitions: DictDefinition[]
  synonyms?: string[]
  antonyms?: string[]
}

interface DictEntry {
  word: string
  phonetic?: string
  phonetics: DictPhonetic[]
  meanings: DictMeaning[]
  sourceUrls?: string[]
}

function labelFromAudioUrl(url: string): string {
  const lower = url.toLowerCase()
  if (lower.includes('-uk.') || lower.includes('_uk.')) return 'UK'
  if (lower.includes('-us.') || lower.includes('_us.')) return 'US'
  if (lower.includes('-au.') || lower.includes('_au.')) return 'AU'
  if (lower.includes('-ca.')) return 'CA'
  return 'Audio'
}

function labelFromWikiAudio(filename: string, hint?: string): string {
  if (hint) return hint.toUpperCase()
  const lower = filename.toLowerCase()
  if (lower.includes('-uk') || lower.includes('en-uk')) return 'UK'
  if (lower.includes('-us') || lower.includes('en-us')) return 'US'
  if (lower.includes('-au') || lower.includes('en-au')) return 'AU'
  return 'Audio'
}

function cleanAudioUrl(url: string): string {
  return url.split('?')[0]
}

export async function enrichFromDictionaryApi(
  word: string,
): Promise<Partial<WiktionaryEntry> | null> {
  try {
    const res = await fetch(`${DICT_BASE}/${encodeURIComponent(word.trim())}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      cache: 'no-store',
      // This service often takes 20 s or never answers; the Wiktionary page works fine without it.
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null

    const data = (await res.json()) as DictEntry[]
    const entry = data[0]
    if (!entry) return null

    const pronunciations: Pronunciation[] = []
    const seen = new Set<string>()

    for (const p of entry.phonetics) {
      if (!p.audio) continue
      const label = labelFromAudioUrl(p.audio)
      const key = `${label}-${cleanAudioUrl(p.audio)}`
      if (seen.has(key)) continue
      seen.add(key)
      pronunciations.push({
        label,
        ipa: p.text,
        audio: cleanAudioUrl(p.audio),
        source: 'dictionary',
      })
    }

    const definitions: WiktionaryDefinition[] = []
    const synonyms = new Set<string>()
    const antonyms = new Set<string>()
    const examples: string[] = []

    for (const meaning of entry.meanings) {
      for (const def of meaning.definitions) {
        definitions.push({
          text: def.definition,
          partOfSpeech: meaning.partOfSpeech,
          example: def.example,
          synonyms: def.synonyms,
          antonyms: def.antonyms,
        })
        if (def.example) examples.push(def.example)
        def.synonyms?.forEach(s => synonyms.add(s))
        def.antonyms?.forEach(a => antonyms.add(a))
        meaning.synonyms?.forEach(s => synonyms.add(s))
        meaning.antonyms?.forEach(a => antonyms.add(a))
      }
    }

    return {
      word: entry.word,
      phonetic: entry.phonetic ?? pronunciations.find(p => p.ipa)?.ipa,
      definitions: definitions.slice(0, 12),
      pronunciations,
      synonyms: [...synonyms].slice(0, 24),
      antonyms: [...antonyms].slice(0, 16),
      examples: [...new Set(examples)].slice(0, 8),
    }
  } catch {
    return null
  }
}

export async function fetchWikipediaContext(word: string): Promise<{
  image?: WikiImage
  wikiUrl?: string
  wikiExtract?: string
} | null> {
  try {
    const url = new URL(WIKI_BASE)
    url.searchParams.set('action', 'query')
    url.searchParams.set('format', 'json')
    url.searchParams.set('origin', '*')
    url.searchParams.set('redirects', '1')
    url.searchParams.set('prop', 'pageimages|extracts|info')
    url.searchParams.set('exintro', '1')
    url.searchParams.set('explaintext', '1')
    url.searchParams.set('piprop', 'original')
    url.searchParams.set('inprop', 'url')
    url.searchParams.set('titles', word.trim())

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null

    const json = await res.json()
    const pages = json.query?.pages
    if (!pages) return null

    const page = Object.values(pages)[0] as {
      title?: string
      missing?: string
      extract?: string
      fullurl?: string
      original?: { source: string; width: number; height: number }
    }

    if (!page || page.missing) return null

    const result: { image?: WikiImage; wikiUrl?: string; wikiExtract?: string } = {
      wikiUrl: page.fullurl,
      wikiExtract: page.extract?.slice(0, 600),
    }

    if (page.original?.source) {
      result.image = {
        url: page.original.source,
        width: page.original.width,
        height: page.original.height,
        pageUrl: page.fullurl,
      }
    }

    return result
  } catch {
    return null
  }
}

export function mergePronunciations(
  primary: Pronunciation[],
  secondary: Pronunciation[],
): Pronunciation[] {
  const order = ['UK', 'US', 'AU', 'CA', 'Audio']
  const map = new Map<string, Pronunciation>()

  for (const p of [...primary, ...secondary]) {
    const existing = map.get(p.label)
    if (!existing || (!existing.audio && p.audio)) {
      map.set(p.label, {
        ...p,
        ipa: p.ipa ?? existing?.ipa,
        audio: p.audio ?? existing?.audio,
      })
    }
  }

  return [...map.values()].sort(
    (a, b) => order.indexOf(a.label) - order.indexOf(b.label),
  )
}

export function mergeDefinitions(
  wikiDefs: WiktionaryDefinition[],
  dictDefs: WiktionaryDefinition[],
): WiktionaryDefinition[] {
  if (dictDefs.length) return dictDefs
  return wikiDefs
}
