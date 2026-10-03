export type RpsChoice = 'rock' | 'paper' | 'scissors'

export type RoundOutcome = 'win' | 'lose' | 'draw'

export interface RpsRound {
  you: RpsChoice
  computer: RpsChoice
  outcome: RoundOutcome
}
