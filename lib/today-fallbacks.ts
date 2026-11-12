export type DayQuote = { content: string; author: string }

export type DayNumber = { number: number; text: string }

const QUOTES: DayQuote[] = [
  { content: 'The sky is the daily bread of the eyes.', author: 'Ralph Waldo Emerson' },
  { content: 'We are all in the gutter, but some of us are looking at the stars.', author: 'Oscar Wilde' },
  { content: 'The Earth is a very small stage in a vast cosmic arena.', author: 'Carl Sagan' },
  { content: 'In every walk with nature one receives far more than one seeks.', author: 'John Muir' },
]

const NUMBER_FACTS: DayNumber[] = [
  { number: 42, text: '42 is the number of little squares on a Connect Four grid.' },
  { number: 7, text: 'Seven is the only single-digit number that cannot be a digit in a Roman numeral.' },
  { number: 1969, text: 'Apollo 11 landed humans on the Moon in 1969.' },
  { number: 365, text: 'A common year has 365 days — one orbit, roughly, for our calendar.' },
]

export function pickLocalQuote(seed = Date.now()): DayQuote {
  return QUOTES[Math.abs(seed) % QUOTES.length]
}

export function pickLocalNumberFact(seed = Date.now()): DayNumber {
  const base = NUMBER_FACTS[Math.abs(seed) % NUMBER_FACTS.length]
  const day = new Date().getDate()
  return { number: day || base.number, text: base.text }
}
