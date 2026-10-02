export interface Definition {
  definition: string
  example?: string
  synonyms: string[]
  antonyms: string[]
}
export interface Meaning {
  partOfSpeech: string
  definitions: Definition[]
  synonyms: string[]
  antonyms: string[]
}
export interface Phonetic {
  text?: string
  audio?: string
  sourceUrl?: string        
  /** Accent of the recording: US, UK, AU … or "Voice" for a volunteer recording. */
  label?: string
  license?: License         
}
export interface License {
  name: string
  url: string
}
export interface DictionaryEntry {
  word: string
  phonetic?: string
  phonetics: Phonetic[]
  meanings: Meaning[]
  license: License
  sourceUrls: string[]
}