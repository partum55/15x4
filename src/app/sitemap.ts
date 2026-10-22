import type { MetadataRoute } from 'next'
import { DEMO_EVENTS, DEMO_LECTURES } from '@/lib/demo-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://15x4.org'
  const now = new Date()

  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/lectures`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/events`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/about-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...DEMO_LECTURES.filter((l) => l.isPublic).map((l) => ({ url: `${siteUrl}/lectures/${l.id}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...DEMO_EVENTS.filter((e) => e.isPublic).map((e) => ({ url: `${siteUrl}/events/${e.id}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
