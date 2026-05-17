import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '15x4 — Наукові лекції'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FFFFF1',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 130,
            fontWeight: 800,
            color: '#000000',
            letterSpacing: '-4px',
            lineHeight: 1,
          }}
        >
          15x4
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#000000',
            opacity: 0.45,
            letterSpacing: '8px',
            textTransform: 'uppercase',
            marginTop: 24,
          }}
        >
          Наука для всіх
        </div>
      </div>
    ),
    { ...size }
  )
}
