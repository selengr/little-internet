export type TriviaDifficulty = 'easy' | 'medium' | 'hard'

export interface TriviaQuestionRaw {
  type: 'multiple'
  difficulty: TriviaDifficulty
  category: string
  question: string
  correct_answer: string
  incorrect_answers: string[]
}

export interface TriviaApiResponse {
  response_code: number
  results: TriviaQuestionRaw[]
}

/** Decoded, shuffled, ready to render. */
export interface TriviaQuestion {
  category: string
  difficulty: TriviaDifficulty
  question: string
  answers: string[]
  correctIndex: number
}
