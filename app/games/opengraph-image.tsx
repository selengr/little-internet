import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Little Internet — Games arcade'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function GamesOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(165deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: '0.35em', opacity: 0.85, marginBottom: 24 }}>LITTLE INTERNET</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          Games arcade
        </div>
        <div style={{ fontSize: 26, opacity: 0.88, maxWidth: 780, textAlign: 'center', lineHeight: 1.35 }}>
          Filter by mood · press / to search · ? for help · share ?mode= links.
        </div>
      </div>
    ),
    { ...size },
  )
}
