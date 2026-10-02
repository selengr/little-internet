import type { TriviaQuestion, TriviaQuestionRaw } from '@/types/trivia'

export const TRIVIA_CATEGORIES: { id: number; label: string }[] = [
  { id: 9, label: 'General Knowledge' },
  { id: 17, label: 'Science & Nature' },
  { id: 21, label: 'Sports' },
  { id: 22, label: 'Geography' },
  { id: 23, label: 'History' },
  { id: 11, label: 'Film' },
  { id: 12, label: 'Music' },
  { id: 15, label: 'Video Games' },
  { id: 20, label: 'Mythology' },
  { id: 27, label: 'Animals' },
]

export const TRIVIA_RESPONSE_CODE_MESSAGE: Record<number, string> = {
  1: 'Not enough questions for that combination — try a different category or difficulty.',
  2: 'Something about that request was invalid.',
  3: 'Session expired — starting over.',
  4: 'Ran out of fresh questions for this session — starting over.',
  5: 'Too many requests at once — wait a few seconds and try again.',
}

/** OpenTDB encodes question/answer text as HTML entities (&quot;, &#039;, &eacute;, ...). */
export function decodeHtmlEntities(input: string): string {
  if (typeof window === 'undefined') return input
  const el = document.createElement('textarea')
  el.innerHTML = input
  return el.value
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function toTriviaQuestion(raw: TriviaQuestionRaw): TriviaQuestion {
  const correct = decodeHtmlEntities(raw.correct_answer)
  const answers = shuffle([correct, ...raw.incorrect_answers.map(decodeHtmlEntities)])
  return {
    category: decodeHtmlEntities(raw.category),
    difficulty: raw.difficulty,
    question: decodeHtmlEntities(raw.question),
    answers,
    correctIndex: answers.indexOf(correct),
  }
}
