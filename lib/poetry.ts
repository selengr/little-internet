import type { PoetInfo, PoetryMood, PoetryPoem } from '@/types/poetry'

/** Public-domain verse API — search uses /author/{name} and /title/{title}. */
export const POETRYDB = 'https://poetrydb.org'

export const MOODS: { id: PoetryMood; label: string; query: string }[] = [
  { id: 'romantic', label: 'Romantic', query: 'love' },
  { id: 'sad', label: 'Sad', query: 'sorrow' },
  { id: 'inspirational', label: 'Inspirational', query: 'hope' },
  { id: 'nature', label: 'Nature', query: 'nature' },
  { id: 'philosophy', label: 'Philosophy', query: 'soul' },
]

export const FEATURED_POETS = [
  'Emily Dickinson',
  'William Shakespeare',
  'Percy Bysshe Shelley',
  'John Keats',
  'William Wordsworth',
  'Walt Whitman',
  'Edgar Allan Poe',
  'William Blake',
]

export const POET_PROFILES: Record<string, PoetInfo> = {
  'Emily Dickinson': {
    name: 'Emily Dickinson',
    blurb: 'An American lyric poet whose compressed, startling verse redefined the boundaries of feeling and form.',
    era: '1830–1886 · American',
    themes: ['Mortality', 'Nature', 'Faith', 'Interior life'],
  },
  'William Shakespeare': {
    name: 'William Shakespeare',
    blurb: 'The English dramatist and sonneteer whose language still shapes how we speak of love, power, and time.',
    era: '1564–1616 · English',
    themes: ['Love', 'Power', 'Time', 'Identity'],
  },
  'Percy Bysshe Shelley': {
    name: 'Percy Bysshe Shelley',
    blurb: 'A radical Romantic whose odes and lyrics burn with idealism, beauty, and political fire.',
    era: '1792–1822 · English',
    themes: ['Freedom', 'Beauty', 'Revolution', 'Nature'],
  },
  'John Keats': {
    name: 'John Keats',
    blurb: 'A master of sensual imagery whose brief life left some of the most luminous odes in English.',
    era: '1795–1821 · English',
    themes: ['Beauty', 'Mortality', 'Art', 'Desire'],
  },
  'William Wordsworth': {
    name: 'William Wordsworth',
    blurb: 'The Romantic who found the sublime in lakes, hills, and the quiet mind of childhood.',
    era: '1770–1850 · English',
    themes: ['Nature', 'Memory', 'Childhood', 'Spirit'],
  },
  'Walt Whitman': {
    name: 'Walt Whitman',
    blurb: 'The expansive American bard of democracy, the body, and the open road.',
    era: '1819–1892 · American',
    themes: ['Self', 'Democracy', 'Body', 'Nation'],
  },
  'Edgar Allan Poe': {
    name: 'Edgar Allan Poe',
    blurb: 'Architect of the gothic lyric — music, melancholy, and the beautiful macabre.',
    era: '1809–1849 · American',
    themes: ['Grief', 'Mystery', 'Beauty', 'Night'],
  },
  'William Blake': {
    name: 'William Blake',
    blurb: 'Visionary poet-artist who forged innocence and experience into prophetic song.',
    era: '1757–1827 · English',
    themes: ['Innocence', 'Vision', 'Spirit', 'Society'],
  },
}

export function normalizePoem(raw: PoetryPoem): PoetryPoem {
  return {
    title: raw.title?.trim() || 'Untitled',
    author: raw.author?.trim() || 'Unknown',
    lines: Array.isArray(raw.lines) ? raw.lines : [],
    linecount: Number(raw.linecount) || (raw.lines?.filter(l => l.trim()).length ?? 0),
  }
}

export function poemText(poem: PoetryPoem) {
  return poem.lines.join('\n')
}

export function poemShareText(poem: PoetryPoem) {
  return `"${poem.title}"\n— ${poem.author}\n\n${poemText(poem)}`
}

export function themeFromMood(mood?: PoetryMood | null) {
  return MOODS.find(m => m.id === mood)?.label ?? 'Classic'
}

/** Deterministic daily seed so "today's poem" is stable per day */
export function dailySeed() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
}

export function pickDailyIndex(length: number, salt = '') {
  if (length <= 0) return 0
  const key = dailySeed() + salt
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h % length
}

/** Public-domain shorts used when PoetryDB is down (503 / network). */
export const FALLBACK_POEMS: (PoetryPoem & { moods: PoetryMood[] })[] = [
  {
    title: 'Hope is the thing with feathers',
    author: 'Emily Dickinson',
    linecount: 12,
    moods: ['inspirational', 'nature'],
    lines: [
      'Hope is the thing with feathers',
      'That perches in the soul,',
      'And sings the tune without the words,',
      'And never stops at all,',
      '',
      'And sweetest in the Gale is heard;',
      'And sore must be the storm',
      'That could abash the little Bird',
      'That kept so many warm.',
      '',
      "I've heard it in the chillest land,",
      'And on the strangest Sea;',
      'Yet never, in Extremity,',
      'It asked a crumb of me.',
    ],
  },
  {
    title: "I'm Nobody! Who are you?",
    author: 'Emily Dickinson',
    linecount: 8,
    moods: ['philosophy'],
    lines: [
      "I'm Nobody! Who are you?",
      "Are you – Nobody – too?",
      'Then there\'s a pair of us!',
      "Don't tell! they'd advertise – you know!",
      '',
      'How dreary – to be – Somebody!',
      'How public – like a Frog –',
      'To tell one\'s name – the livelong June –',
      'To an admiring Bog!',
    ],
  },
  {
    title: 'Sonnet 18',
    author: 'William Shakespeare',
    linecount: 14,
    moods: ['romantic'],
    lines: [
      "Shall I compare thee to a summer's day?",
      'Thou art more lovely and more temperate:',
      'Rough winds do shake the darling buds of May,',
      "And summer's lease hath all too short a date;",
      'Sometime too hot the eye of heaven shines,',
      "And often is his gold complexion dimm'd;",
      'And every fair from fair sometime declines,',
      "By chance or nature's changing course untrimm'd;",
      'But thy eternal summer shall not fade,',
      "Nor lose possession of that fair thou ow'st;",
      'Nor shall death brag thou wander\'st in his shade,',
      'When in eternal lines to time thou grow\'st:',
      "So long as men can breathe or eyes can see,",
      'So long lives this, and this gives life to thee.',
    ],
  },
  {
    title: 'Sonnet 116',
    author: 'William Shakespeare',
    linecount: 14,
    moods: ['romantic', 'philosophy'],
    lines: [
      'Let me not to the marriage of true minds',
      'Admit impediments. Love is not love',
      'Which alters when it alteration finds,',
      'Or bends with the remover to remove:',
      'O no! it is an ever-fixed mark',
      "That looks on tempests and is never shaken;",
      "It is the star to every wandering bark,",
      "Whose worth's unknown, although his height be taken.",
      "Love's not Time's fool, though rosy lips and cheeks",
      'Within his bending sickle\'s compass come;',
      'Love alters not with his brief hours and weeks,',
      'But bears it out even to the edge of doom.',
      'If this be error and upon me proved,',
      'I never writ, nor no man ever loved.',
    ],
  },
  {
    title: 'Ozymandias',
    author: 'Percy Bysshe Shelley',
    linecount: 14,
    moods: ['philosophy', 'sad'],
    lines: [
      'I met a traveller from an antique land,',
      'Who said—“Two vast and trunkless legs of stone',
      'Stand in the desert. . . . Near them, on the sand,',
      'Half sunk a shattered visage lies, whose frown,',
      'And wrinkled lip, and sneer of cold command,',
      'Tell that its sculptor well those passions read',
      'Which yet survive, stamped on these lifeless things,',
      'The hand that mocked them, and the heart that fed;',
      'And on the pedestal, these words appear:',
      'My name is Ozymandias, King of Kings;',
      'Look on my Works, ye Mighty, and despair!',
      'Nothing beside remains. Round the decay',
      'Of that colossal Wreck, boundless and bare',
      'The lone and level sands stretch far away.”',
    ],
  },
  {
    title: 'When I Have Fears',
    author: 'John Keats',
    linecount: 14,
    moods: ['sad', 'philosophy'],
    lines: [
      'When I have fears that I may cease to be',
      'Before my pen has gleaned my teeming brain,',
      'Before high-pilèd books, in charactery,',
      'Hold like rich garners the full ripened grain;',
      'When I behold, upon the night’s starred face,',
      'Huge cloudy symbols of a high romance,',
      'And think that I may never live to trace',
      'Their shadows with the magic hand of chance;',
      'And when I feel, fair creature of an hour,',
      'That I shall never look upon thee more,',
      'Never have relish in the faery power',
      'Of unreflecting love—then on the shore',
      'Of the wide world I stand alone, and think',
      'Till love and fame to nothingness do sink.',
    ],
  },
  {
    title: 'I Wandered Lonely as a Cloud',
    author: 'William Wordsworth',
    linecount: 24,
    moods: ['nature', 'inspirational'],
    lines: [
      'I wandered lonely as a cloud',
      'That floats on high o\'er vales and hills,',
      'When all at once I saw a crowd,',
      'A host, of golden daffodils;',
      'Beside the lake, beneath the trees,',
      'Fluttering and dancing in the breeze.',
      '',
      'Continuous as the stars that shine',
      'And twinkle on the milky way,',
      'They stretched in never-ending line',
      'Along the margin of a bay:',
      'Ten thousand saw I at a glance,',
      'Tossing their heads in sprightly dance.',
      '',
      'The waves beside them danced; but they',
      'Out-did the sparkling waves in glee:',
      'A poet could not but be gay,',
      'In such a jocund company:',
      'I gazed—and gazed—but little thought',
      'What wealth the show to me had brought:',
      '',
      'For oft, when on my couch I lie',
      'In vacant or in pensive mood,',
      'They flash upon that inward eye',
      'Which is the bliss of solitude;',
      'And then my heart with pleasure fills,',
      'And dances with the daffodils.',
    ],
  },
  {
    title: 'The Raven (excerpt)',
    author: 'Edgar Allan Poe',
    linecount: 18,
    moods: ['sad'],
    lines: [
      'Once upon a midnight dreary, while I pondered, weak and weary,',
      'Over many a quaint and curious volume of forgotten lore—',
      'While I nodded, nearly napping, suddenly there came a tapping,',
      'As of some one gently rapping, rapping at my chamber door.',
      '"\'Tis some visitor," I muttered, "tapping at my chamber door—',
      'Only this and nothing more."',
      '',
      'Ah, distinctly I remember it was in the bleak December;',
      'And each separate dying ember wrought its ghost upon the floor.',
      'Eagerly I wished the morrow;—vainly I had sought to borrow',
      'From my books surcease of sorrow—sorrow for the lost Lenore—',
      'For the rare and radiant maiden whom the angels name Lenore—',
      'Nameless here for evermore.',
    ],
  },
  {
    title: 'The Tyger',
    author: 'William Blake',
    linecount: 24,
    moods: ['philosophy', 'nature'],
    lines: [
      'Tyger Tyger, burning bright,',
      'In the forests of the night;',
      'What immortal hand or eye,',
      'Could frame thy fearful symmetry?',
      '',
      'In what distant deeps or skies.',
      'Burnt the fire of thine eyes?',
      'On what wings dare he aspire?',
      'What the hand, dare seize the fire?',
      '',
      'And what shoulder, & what art,',
      'Could twist the sinews of thy heart?',
      'And when thy heart began to beat,',
      'What dread hand? & what dread feet?',
      '',
      'What the hammer? what the chain,',
      'In what furnace was thy brain?',
      'What the anvil? what dread grasp,',
      'Dare its deadly terrors clasp!',
      '',
      'When the stars threw down their spears',
      'And water\'d heaven with their tears:',
      'Did he smile his work to see?',
      'Did he who made the Lamb make thee?',
      '',
      'Tyger Tyger burning bright,',
      'In the forests of the night:',
      'What immortal hand or eye,',
      'Dare frame thy fearful symmetry?',
    ],
  },
  {
    title: 'A Noiseless Patient Spider',
    author: 'Walt Whitman',
    linecount: 10,
    moods: ['philosophy', 'inspirational'],
    lines: [
      'A noiseless patient spider,',
      'I mark’d where on a little promontory it stood isolated,',
      'Mark’d how to explore the vacant vast surrounding,',
      'It launch’d forth filament, filament, filament, out of itself,',
      'Ever unreeling them, ever tirelessly speeding them.',
      '',
      'And you O my soul where you stand,',
      'Surrounded, detached, in measureless oceans of space,',
      'Ceaselessly musing, venturing, throwing, seeking the spheres to connect them,',
      'Till the bridge you will need be form’d, till the ductile anchor hold,',
      'Till the gossamer thread you fling catch somewhere, O my soul.',
    ],
  },
]

export function fallbackByMood(mood?: PoetryMood | null): PoetryPoem[] {
  if (!mood) return FALLBACK_POEMS.map(({ moods: _m, ...p }) => normalizePoem(p))
  return FALLBACK_POEMS.filter(p => p.moods.includes(mood)).map(({ moods: _m, ...p }) =>
    normalizePoem(p),
  )
}

export function pickFallbackPoem(mood?: PoetryMood | null, salt = 'fallback'): PoetryPoem {
  const pool = fallbackByMood(mood)
  const list = pool.length ? pool : FALLBACK_POEMS.map(({ moods: _m, ...p }) => normalizePoem(p))
  return list[pickDailyIndex(list.length, salt + (mood ?? ''))] ?? list[0]
}

export function pickRandomFallback(mood?: PoetryMood | null): PoetryPoem {
  const pool = fallbackByMood(mood)
  const list = pool.length ? pool : FALLBACK_POEMS.map(({ moods: _m, ...p }) => normalizePoem(p))
  return list[Math.floor(Math.random() * list.length)] ?? list[0]
}
