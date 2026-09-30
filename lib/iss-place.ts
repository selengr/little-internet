// Names the place under the ISS ("the North Atlantic Ocean", "Africa"...). Deliberately coarse:
// it only has to be right at the scale of an ocean or a continent, and it never guesses at
// countries. `onLand` comes from the land mask (isLandAt), which keeps this function pure.

type Box = { name: string; lat: [number, number]; lon: [number, number] }

const inBox = (lat: number, lon: number, b: Box) =>
  lat >= b.lat[0] && lat <= b.lat[1] && lon >= b.lon[0] && lon <= b.lon[1]

// Named seas that are worth calling out. Checked before the big oceans.
const SEAS: Box[] = [
  { name: 'the Black Sea', lat: [41, 47], lon: [28, 41.5] },
  { name: 'the Caspian Sea', lat: [36.5, 47], lon: [46.5, 54.5] },
  { name: 'the Mediterranean Sea', lat: [30, 45.5], lon: [-5.5, 36] },
  { name: 'the Gulf of Mexico', lat: [18, 30.5], lon: [-97.5, -81] },
  { name: 'the Caribbean Sea', lat: [9, 22], lon: [-88, -60] },
  { name: 'the Arabian Sea', lat: [5, 25], lon: [52, 77] },
  { name: 'the Bay of Bengal', lat: [5, 23], lon: [78, 100] },
  { name: 'the South China Sea', lat: [0, 23], lon: [100, 121] },
]

function oceanName(lat: number, lon: number): string {
  const north = lat >= 0
  if (lat < -50) return 'the Southern Ocean'

  for (const sea of SEAS) if (inBox(lat, lon, sea)) return sea.name

  // Atlantic: between the Americas and Europe/Africa. Its western edge moves with the coast.
  const atlanticWest = north ? -80 : -72
  if (lon >= atlanticWest && lon < 20) return north ? 'the North Atlantic Ocean' : 'the South Atlantic Ocean'

  // Indian: 20°E to Australia's west coast, and south of Australia up to Tasmania.
  if (lon >= 20 && lon < 120) return 'the Indian Ocean'
  if (lon >= 120 && lon < 147 && lat < -10) return 'the Indian Ocean'

  return north ? 'the North Pacific Ocean' : 'the South Pacific Ocean'
}

function continentName(lat: number, lon: number): string {
  // Pacific islands east of the date line and west of the Americas: Hawaii, Samoa, Tonga, Tahiti.
  if (lon < -140 && lat < 40) return 'Oceania'

  // The Americas. Central America counts as North America.
  if (lon >= -140 && lon <= -30) {
    if (lat < 8 || (lat < 13 && lon >= -77)) return 'South America'
    return lat >= 8 ? 'North America' : 'South America'
  }

  // Oceania: Australia, New Zealand, Papua and the Pacific islands.
  if (lon >= 165) return 'Oceania'
  if (lon >= 141 && lat <= 0) return 'Oceania'
  if (lon >= 112 && lat <= -10) return 'Oceania'

  // Asia beyond the Urals and the Middle East. The Red Sea centreline (about 43°E at 12°N,
  // 34°E at 28°N) splits Africa from Arabia and Sinai.
  const redSeaLon = 43.3 - (lat - 12.5) * 0.6
  if (lon >= 60) return 'Asia'
  if (lat >= 12.5 && lat <= 31 && lon > redSeaLon && lon >= 32) return 'Asia'
  if (lat > 31 && lon >= 34.5) return 'Asia'

  // Europe: Iberia to the Balkans, Ukraine and western Russia. Anatolia is Asia.
  if (lat >= 43 && lon <= 60) return 'Europe'
  if (lat >= 36 && lon <= 26 && lon >= -12 && !(lat < 37.4 && lon >= 3)) return 'Europe'
  if (lat >= 34.5 && lon >= 20 && lon <= 26) return 'Europe'
  if (lat >= 40 && lat < 43 && lon > 26 && lon <= 30) return 'Europe'
  if (lon > 26 && lat >= 36) return 'Asia'

  if (lat >= -35 && lat <= 37.5 && lon >= -18 && lon <= 52) return 'Africa'
  return 'Asia'
}

/** e.g. "the North Atlantic Ocean" or "Africa", for use after "over". */
export function describePlace(lat: number, lon: number, onLand: boolean): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return ''
  const wrapped = ((lon + 180) % 360 + 360) % 360 - 180
  return onLand ? continentName(lat, wrapped) : oceanName(lat, wrapped)
}
