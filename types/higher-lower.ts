export interface GameCard {
  id: string
  title: string
  thumb: string
  /** Steam user rating, 0-100. */
  ratingPercent: number
  ratingText: string
}
