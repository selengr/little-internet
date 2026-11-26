#!/usr/bin/env node
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tipsPath = path.join(root, 'lib/games/arcade-tips.ts')

const NEW_TIPS = [
  { id: 'tip-0211', text: 'Press P on the picker to toggle pinned-only view.' },
  { id: 'tip-0212', text: 'Pinned filter syncs to ?pins=1 in the address bar.' },
  { id: 'tip-0213', text: 'Pinned chips jump you straight to a saved table.' },
  { id: 'tip-0214', text: 'Search “pin” or “pinned” to find tables you starred.' },
  { id: 'tip-0215', text: 'Clear all resets mood, search, and the pinned filter.' },
  { id: 'tip-0216', text: 'Golden ring on a card means it is pinned.' },
  { id: 'tip-0217', text: 'Empty pinned view? Tap the pin icon on any card first.' },
  { id: 'tip-0218', text: 'Games nav Help opens the cheatsheet at ?help=1.' },
  { id: 'tip-0219', text: 'Share my bests copies Sudoku times and streaks from this device.' },
  { id: 'tip-0220', text: 'Enter in the search box opens the first visible table.' },
  { id: 'tip-0221', text: 'Sudoku saves your best completion time per puzzle size.', gameId: 'sudoku' },
  { id: 'tip-0222', text: 'Trivia streaks count consecutive correct answers.', gameId: 'trivia' },
  { id: 'tip-0223', text: 'Portal Faces: wrong guesses still reveal silhouette hints.', gameId: 'portal' },
  { id: 'tip-0224', text: 'Chess Puzzle: one best move — take your time.', gameId: 'chess' },
  { id: 'tip-0225', text: 'Higher or Lower uses live trivia popularity scores.', gameId: 'higherlower' },
  { id: 'tip-0226', text: 'Rock Paper Scissors tracks win streak in this browser.', gameId: 'rps' },
  { id: 'tip-0227', text: "Who's That Pokémon: silhouette tightens when you guess.", gameId: 'pokemon' },
  { id: 'tip-0228', text: 'Shuffle on the play header jumps to another random table.' },
  { id: 'tip-0229', text: 'Chevron buttons walk table order without leaving the game.' },
  { id: 'tip-0230', text: 'Document title shows which table you are playing.' },
  { id: 'tip-0231', text: 'Mood Quick tables favor short reflex rounds.', gameId: 'rps' },
  { id: 'tip-0232', text: 'Mood Think includes Sudoku and chess.', gameId: 'sudoku' },
  { id: 'tip-0233', text: 'Mood Guess is for silhouettes and shapes.', gameId: 'portal' },
  { id: 'tip-0234', text: 'Open /games bare for the full seven-table grid.' },
  { id: 'tip-0235', text: 'Back to grid keeps mood, search, and pins in the URL.' },
  { id: 'tip-0236', text: 'Recent strip replays tables without digging through cards.' },
  { id: 'tip-0237', text: 'Pinned storage lives in localStorage — clearing site data resets pins.' },
  { id: 'tip-0238', text: 'Invalid ?pins= values are stripped from the URL automatically.' },
  { id: 'tip-0239', text: 'Another table shuffles to a different game, not a rematch.', gameId: undefined },
  { id: 'tip-0240', text: 'Arcade is free — scores never leave your browser unless you share.', gameId: undefined },
]

function escape(text) {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

for (const tip of NEW_TIPS) {
  let src = fs.readFileSync(tipsPath, 'utf8')
  if (src.includes(`'${tip.id}'`)) continue
  const gamePart = tip.gameId ? `, gameId: '${tip.gameId}'` : ''
  const entry = `  { id: '${tip.id}', text: '${escape(tip.text)}'${gamePart} },\n`
  const next = src.replace(/\n]\n\nexport function pickArcadeTip/, `\n${entry}]\n\nexport function pickArcadeTip`)
  if (next === src) throw new Error(`Could not insert ${tip.id}`)
  fs.writeFileSync(tipsPath, next, 'utf8')
  const short = tip.text.replace(/\s+/g, ' ').slice(0, 72)
  const msg = `Arcade tip: ${short}`.replace(/"/g, '\\"')
  execSync(`git add lib/games/arcade-tips.ts && git commit -m "${msg}"`, { cwd: root, stdio: 'inherit' })
}