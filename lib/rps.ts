import type { RoundOutcome, RpsChoice } from '@/types/rps'

export const RPS_CHOICES: RpsChoice[] = ['rock', 'paper', 'scissors']

const BEATS: Record<RpsChoice, RpsChoice> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
}

export function randomChoice(): RpsChoice {
  return RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)]
}

export function judgeRound(you: RpsChoice, computer: RpsChoice): RoundOutcome {
  if (you === computer) return 'draw'
  return BEATS[you] === computer ? 'win' : 'lose'
}

export function winsNeeded(bestOf: number): number {
  return Math.ceil((bestOf + 1) / 2)
}
