export type ResolvedLectureVideo = {
  kind: 'iframe' | 'file'
  src: string
}

const videoFilePattern = /\.(mp4|webm|ogg)(?:$|[?#])/i

function toHttpUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

function getYouTubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')

  if (host === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] ?? null
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') return url.searchParams.get('v')

    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') {
      return parts[1] ?? null
    }
  }

  return null
}

function getVimeoId(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null

  const parts = url.pathname.split('/').filter(Boolean)
  const id = parts[0] === 'video' ? parts[1] : parts[parts.length - 1]
  return id && /^\d+$/.test(id) ? id : null
}

export function resolveLectureVideo(videoUrl?: string | null): ResolvedLectureVideo | null {
  const trimmed = videoUrl?.trim()
  if (!trimmed) return null

  if (videoFilePattern.test(trimmed) && !trimmed.includes('://') && !trimmed.startsWith('//')) {
    return { kind: 'file', src: trimmed.startsWith('/') ? trimmed : `/${trimmed}` }
  }

  if (trimmed.startsWith('/embed/')) {
    return { kind: 'iframe', src: trimmed }
  }

  const normalizedUrl = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed
  const url = toHttpUrl(normalizedUrl)
  if (!url) return null

  const youTubeId = getYouTubeId(url)
  if (youTubeId) {
    return {
      kind: 'iframe',
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youTubeId)}?rel=0`,
    }
  }

  const vimeoId = getVimeoId(url)
  if (vimeoId) {
    return {
      kind: 'iframe',
      src: `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`,
    }
  }

  if (videoFilePattern.test(url.pathname)) {
    return { kind: 'file', src: url.toString() }
  }

  return null
}
