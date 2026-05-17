import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '15x4 — Наука для всіх',
    short_name: '15x4',
    description: 'Наукові лекції для широкої аудиторії. Кожна лекція — 15 хвилин, 4 лектори.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFF1',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        src: '/favicon.ico',
        sizes: '16x16 32x32',
        type: 'image/x-icon',
      },
    ],
  }
}
