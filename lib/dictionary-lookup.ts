import type { DictionaryEntry, Meaning, Phonetic } from '@/types/dictionary'

// The dictionary used to ask api.dictionaryapi.dev, which routinely took ~20 seconds (or timed out), had
// no recording for many words, and linked recordings that often did not play. This asks Wiktionary
// (about a second) for definitions, IPA and mp3 recordings, and Datamuse for synonyms, antonyms, a
// pronunciation fallback and spelling help. Every source is time-boxed, so one slow service cannot
// hold the answer up.

const UA = 'LittleInternet/1.0 (https://rezakarbakhsh.ir)'

export class WordNotFoundError extends Error {
  suggestions: string[]
  constructor(word: string, suggestions: string[]) {
    super(`No entry found for “${word}”.`)
    this.suggestions = suggestions
  }
}

async function getJson<T>(url: string, timeoutMs: number): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function getText(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

// ─── Cleaning ───────────────────────────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…' }

function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
}

/** HTML from Wiktionary to plain text: tags dropped, entities decoded, whitespace tidied. */
function plain(html: string): string {
  return decode(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<sup[\s\S]*?<\/sup>/gi, '') // footnote marks
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Definitions (Wiktionary REST) ──────────────────────────────────────────────────────────────

type WiktDefinitionResponse = {
  en?: {
    partOfSpeech: string
    definitions: { definition: string; examples?: string[]; parsedExamples?: { example: string }[] }[]
  }[]
}

async function wiktionaryMeanings(word: string): Promise<Meaning[] | null> {
  const json = await getJson<WiktDefinitionResponse>(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`,
    6500,
  )
  const sections = json?.en
  if (!sections?.length) return null

  const meanings: Meaning[] = []
  for (const sec of sections) {
    const definitions = sec.definitions
      .map(d => {
        const text = plain(d.definition)
        const exampleHtml = d.parsedExamples?.[0]?.example ?? d.examples?.[0]
        const example = exampleHtml ? plain(exampleHtml) : undefined
        return { definition: text, example: example || undefined, synonyms: [] as string[], antonyms: [] as string[] }
      })
      // Entries like "Alternative form of x" with nothing else are still real meanings; only empties are dropped.
      .filter(d => d.definition.length > 0)
      .slice(0, 6)
    if (definitions.length) {
      meanings.push({ partOfSpeech: sec.partOfSpeech.toLowerCase(), definitions, synonyms: [], antonyms: [] })
    }
  }
  return meanings.length ? meanings : null
}

// ─── Pronunciation (Wiktionary page) ────────────────────────────────────────────────────────────

const REGION_ORDER = ['US', 'UK', 'AU', 'CA', 'NZ', 'IE', 'IN', 'ZA']

function regionOf(file: string): string {
  const m = /\bEn-(us|uk|au|ca|nz|ie|in|za)[-_.]/i.exec(file)
  return m ? m[1].toUpperCase() : 'Voice'
}

/** The English section's IPA and its mp3 recordings (mp3 plays everywhere, unlike the original .ogg). */
async function wiktionaryPronunciation(word: string): Promise<{ ipa: string[]; audio: { label: string; url: string }[] }> {
  const html = await getText(`https://en.wiktionary.org/api/rest_v1/page/html/${encodeURIComponent(word)}?redirect=true`, 6500)
  if (!html) return { ipa: [], audio: [] }

  const start = html.search(/<h2[^>]*id="English"/)
  if (start < 0) return { ipa: [], audio: [] }
  const rest = html.slice(start + 10)
  const next = rest.search(/<h2[\s>]/)
  const section = next < 0 ? rest : rest.slice(0, next)

  const ipa: string[] = []
  for (const m of section.matchAll(/<span class="IPA[^"]*"[^>]*>([^<]+)<\/span>/g)) {
    const t = decode(m[1]).trim()
    // Broad transcriptions (/…/) read best; narrow ones in [ ] are skipped.
    if (t.startsWith('/') && !ipa.includes(t)) ipa.push(t)
    if (ipa.length >= 3) break
  }

  const byLabel = new Map<string, string>()
  for (const m of section.matchAll(/<source[^>]+src="([^"]+)"[^>]*type="audio\/mpeg"/g)) {
    let url = decode(m[1])
    if (url.startsWith('//')) url = `https:${url}`
    if (!/^https:\/\/upload\.wikimedia\.org\//.test(url)) continue
    const label = regionOf(decodeURIComponent(url))
    if (!byLabel.has(label)) byLabel.set(label, url)
  }
  const audio = [...byLabel.entries()]
    .sort(([a], [b]) => (REGION_ORDER.indexOf(a) + 1 || 99) - (REGION_ORDER.indexOf(b) + 1 || 99))
    .slice(0, 4)
    .map(([label, url]) => ({ label, url }))

  return { ipa, audio }
}

// ─── Datamuse: synonyms, antonyms, pronunciation fallback, spelling ─────────────────────────────

const ARPA: Record<string, string> = {
  AA: 'ɑ', AE: 'æ', AH: 'ʌ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ', B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', EH: 'ɛ', ER: 'ɝ',
  EY: 'eɪ', F: 'f', G: 'ɡ', HH: 'h', IH: 'ɪ', IY: 'i', JH: 'dʒ', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ',
  OW: 'oʊ', OY: 'ɔɪ', P: 'p', R: 'ɹ', S: 's', SH: 'ʃ', T: 't', TH: 'θ', UH: 'ʊ', UW: 'u', V: 'v', W: 'w',
  Y: 'j', Z: 'z', ZH: 'ʒ',
}

/** "S EH0 R AH0 N D IH1 P IH0 T IY0" to "/sɛɹənˈdɪpɪti/". */
function arpabetToIpa(pron: string): string {
  let out = ''
  for (const raw of pron.trim().split(/\s+/)) {
    const m = /^([A-Z]+)([012])?$/.exec(raw)
    if (!m) continue
    const sym = ARPA[m[1]]
    if (!sym) continue
    if (m[2] === '1') out += 'ˈ'
    else if (m[2] === '2') out += 'ˌ'
    out += sym
  }
  return `/${out}/`
}

type DatamuseWord = { word: string; score?: number; tags?: string[]; defs?: string[] }

async function datamuseExtras(word: string) {
  const q = encodeURIComponent(word)
  const [pron, syn, ant] = await Promise.all([
    getJson<DatamuseWord[]>(`https://api.datamuse.com/words?sp=${q}&md=pd&max=1`, 3500),
    getJson<DatamuseWord[]>(`https://api.datamuse.com/words?rel_syn=${q}&max=10`, 3500),
    getJson<DatamuseWord[]>(`https://api.datamuse.com/words?rel_ant=${q}&max=8`, 3500),
  ])
  const hit = pron?.[0]?.word.toLowerCase() === word.toLowerCase() ? pron[0] : undefined
  const arpa = hit?.tags?.find(t => t.startsWith('pron:'))?.slice(5)
  return {
    ipa: arpa ? arpabetToIpa(arpa) : undefined,
    synonyms: (syn ?? []).map(s => s.word).filter(w => w.toLowerCase() !== word.toLowerCase()),
    antonyms: (ant ?? []).map(s => s.word),
    defs: hit?.defs ?? [],
  }
}

/** Words that look like what was typed, best first. */
export async function spellingSuggestions(q: string): Promise<string[]> {
  const enc = encodeURIComponent(q)
  const [spell, sug] = await Promise.all([
    getJson<DatamuseWord[]>(`https://api.datamuse.com/words?sp=${enc}&max=6`, 3000),
    getJson<DatamuseWord[]>(`https://api.datamuse.com/sug?s=${enc}&max=6`, 3000),
  ])
  const out: string[] = []
  for (const w of [...(spell ?? []), ...(sug ?? [])]) {
    const word = w.word
    if (word.toLowerCase() !== q.toLowerCase() && !out.includes(word)) out.push(word)
    if (out.length >= 6) break
  }
  return out
}

// ─── Lookup ─────────────────────────────────────────────────────────────────────────────────────

const POS_FROM_DATAMUSE: Record<string, string> = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', u: 'word' }

/** Plain input to look up: trimmed, single spaces, no surrounding punctuation. */
export function normalizeWord(input: string): string {
  return input
    .normalize('NFC')
    .replace(/^[\s"'“‘(\[]+|[\s"'”’.,;:!?)\]]+$/g, '')
    .replace(/\s+/g, ' ')
}

export async function lookupEntry(input: string): Promise<DictionaryEntry> {
  const word = normalizeWord(input)
  if (!word) throw new WordNotFoundError(input, [])

  // Names are capitalised (Paris, Persian), so the spelling as typed comes first; a capitalised
  // ordinary word ("Serendipity") falls back to its lower-case entry.
  const candidates = word === word.toLowerCase() ? [word] : [word, word.toLowerCase()]

  for (const candidate of candidates) {
    const [meanings, pronunciation, extras] = await Promise.all([
      wiktionaryMeanings(candidate),
      wiktionaryPronunciation(candidate),
      datamuseExtras(candidate),
    ])

    let finalMeanings = meanings
    if (!finalMeanings && extras.defs.length) {
      // Wiktionary has no page: Datamuse's definitions (also from Wiktionary-derived data) still help.
      const byPos = new Map<string, Meaning>()
      for (const d of extras.defs.slice(0, 6)) {
        const [pos, ...rest] = d.split('\t')
        const key = POS_FROM_DATAMUSE[pos] ?? 'word'
        const m = byPos.get(key) ?? { partOfSpeech: key, definitions: [], synonyms: [], antonyms: [] }
        m.definitions.push({ definition: rest.join(' ').trim(), synonyms: [], antonyms: [] })
        byPos.set(key, m)
      }
      finalMeanings = [...byPos.values()]
    }
    if (!finalMeanings) continue

    // Everyday parts of speech first; "symbol", "letter" and similar come after.
    const rank = (pos: string) => {
      const i = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'].indexOf(pos)
      return i < 0 ? 99 : i
    }
    finalMeanings = [...finalMeanings].sort((a, b) => rank(a.partOfSpeech) - rank(b.partOfSpeech))

    // Datamuse's lists belong to the word as a whole; attach them to the first meaning so the page can show them.
    finalMeanings[0].synonyms = extras.synonyms
    finalMeanings[0].antonyms = extras.antonyms

    const ipa = pronunciation.ipa[0] ?? extras.ipa
    const phonetics: Phonetic[] = pronunciation.audio.map((a, i) => ({
      text: pronunciation.ipa[i] ?? pronunciation.ipa[0] ?? extras.ipa,
      audio: a.url,
      label: a.label,
    }))
    if (!phonetics.length && ipa) phonetics.push({ text: ipa })

    return {
      word: candidate,
      phonetic: ipa,
      phonetics,
      meanings: finalMeanings,
      license: { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0' },
      sourceUrls: [`https://en.wiktionary.org/wiki/${encodeURIComponent(candidate)}`],
    }
  }

  throw new WordNotFoundError(word, await spellingSuggestions(word))
}
