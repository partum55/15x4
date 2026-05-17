import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://15x4.org'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/lectures`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/about-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  try {
    const [{ data: lectures }, { data: events }] = await Promise.all([
      supabaseAdmin.from('lectures').select('id, updated_at').order('updated_at', { ascending: false }),
      supabaseAdmin.from('events').select('id, updated_at').order('updated_at', { ascending: false }),
    ])

    const lectureRoutes: MetadataRoute.Sitemap = (lectures ?? []).map((l) => ({
      url: `${siteUrl}/lectures/${l.id}`,
      lastModified: new Date(l.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    const eventRoutes: MetadataRoute.Sitemap = (events ?? []).map((e) => ({
      url: `${siteUrl}/events/${e.id}`,
      lastModified: new Date(e.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticRoutes, ...lectureRoutes, ...eventRoutes]
  } catch {
    return staticRoutes
  }
}
