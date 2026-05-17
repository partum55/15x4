import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#FFFFF1',
            letterSpacing: '-2px',
          }}
        >
          15x4
        </div>
      </div>
    ),
    { ...size }
  )
}
