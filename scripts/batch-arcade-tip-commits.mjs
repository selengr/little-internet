#!/usr/bin/env node
/**
 * One-time batch: append ARCADE_TIPS entries and git-commit each (games help sheet).
 * Usage: node scripts/batch-arcade-tip-commits.mjs <count>
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const count = Number(process.argv[2] || 0)
if (!Number.isFinite(count) || count < 1) {
  console.error('Usage: node scripts/batch-arcade-tip-commits.mjs <count>')
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tipsPath = path.join(root, 'lib/games/arcade-tips.ts')

const games = [
  { id: 'portal', name: 'Portal Faces' },
  { id: 'trivia', name: 'Trivia' },
  { id: 'pokemon', name: "Who's That Pokémon" },
  { id: 'chess', name: 'Chess Puzzle' },
  { id: 'sudoku', name: 'Sudoku' },
  { id: 'higherlower', name: 'Higher or Lower' },
  { id: 'rps', name: 'Rock Paper Scissors' },
]

const general = [
  'Deep links use ?mode= on /games — paste them anywhere.',
  'Filter the picker with Quick, Think, or Guess mood chips.',
  'Search matches table names, tags, and mood labels.',
  '? on the picker opens the arcade cheatsheet.',
  'R picks a random table when the grid is visible.',
  'Digits 1–7 open the matching card position in the full list.',
  'Last table replays whatever you opened most recently.',
  'Esc returns from a table to the picker grid.',
  'Personal bests on the grid are stored only in this browser.',
  'Try Pricier duel on /games-v2 for a card-battle table.',
  'Copy link on the play header shares your current table.',
  'Native Share appears on phones that support the Web Share API.',
  'Invalid ?mode= values are stripped automatically.',
  'Opening a table scrolls you back to the top of the page.',
  'Mood filters sync to ?mood= in the address bar.',
]

function template(n) {
  const g = games[n % games.length]
  const variants = [
    () => ({ id: `tip-${String(n).padStart(4, '0')}`, text: `${g.name}: tap a card or press ${(games.indexOf(g) + 1)} on the picker.`, gameId: g.id }),
    () => ({ id: `tip-${String(n).padStart(4, '0')}`, text: `Share ${g.name} with ?mode=${g.id} in the URL.`, gameId: g.id }),
    () => ({ id: `tip-${String(n).padStart(4, '0')}`, text: `After ${g.name}, hit Esc to compare scores on another table.`, gameId: g.id }),
    () => ({ id: `tip-${String(n).padStart(4, '0')}`, text: `${g.name} rounds are tuned for short breaks — no account needed.`, gameId: g.id }),
    () => ({ id: `tip-${String(n).padStart(4, '0')}`, text: general[n % general.length], gameId: undefined }),
  ]
  return variants[n % variants.length]()
}

function escape(text) {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function readFile() {
  return fs.readFileSync(tipsPath, 'utf8')
}

function appendTip(tip) {
  let src = readFile()
  const gamePart = tip.gameId ? `, gameId: '${tip.gameId}'` : ''
  const entry = `  { id: '${tip.id}', text: '${escape(tip.text)}'${gamePart} },\n`
  const re = /export const ARCADE_TIPS: ArcadeTip\[\] = \[\n([\s\S]*?)\]\n\nexport function pickArcadeTip/
  const m = src.match(re)
  if (!m) throw new Error('Unexpected arcade-tips.ts shape')
  const body = m[1]
  const next = `export const ARCADE_TIPS: ArcadeTip[] = [\n${body}${entry}]\n\nexport function pickArcadeTip`
  src = src.replace(re, next)
  fs.writeFileSync(tipsPath, src)
}

let existing = 0
const match = readFile().match(/id: 'tip-/g)
if (match) existing = match.length

for (let i = 0; i < count; i++) {
  const n = existing + i + 1
  const tip = template(n)
  appendTip(tip)
  execSync(`git add lib/games/arcade-tips.ts`, { cwd: root, stdio: 'ignore' })
  const subject =
    tip.gameId != null
      ? `Add ${tip.gameId} arcade help tip #${n}.`
      : `Add general arcade help tip #${n}.`
  execSync(`git commit -m "${subject.replace(/"/g, '\\"')}"`, { cwd: root, stdio: 'ignore' })
  if ((i + 1) % 25 === 0) process.stderr.write(`Committed ${i + 1}/${count} tips…\n`)
}

console.log(`Done. ${count} tip commits.`)
