import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

function languageLabel(language: 'uk' | 'en') {
  return language === 'uk' ? 'Ukrainian' : 'English'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const text = String(body?.text ?? '').trim()
    const sourceLanguage = body?.sourceLanguage as 'uk' | 'en'
    const targetLanguage = body?.targetLanguage as 'uk' | 'en'

    if (!text || !sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage) {
      return NextResponse.json({ error: 'Invalid translation payload' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
    }

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    const source = languageLabel(sourceLanguage)
    const target = languageLabel(targetLanguage)

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional translator for scientific and technical content. Return only translated text without explanations, quotes, or markdown.',
          },
          {
            role: 'user',
            content: `Translate from ${source} to ${target}. Preserve meaning, terms, and proper nouns.\n\n${text}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const providerError = await response.json().catch(() => null)
      const providerCode = String(providerError?.error?.code ?? '')
      const error = response.status === 401 || providerCode === 'invalid_api_key'
        ? 'Translation provider authentication failed'
        : 'Translation provider request failed'

      return NextResponse.json({ error }, { status: 502 })
    }

    const data = await response.json()
    const translatedText = String(data?.choices?.[0]?.message?.content ?? '').trim()
    if (!translatedText) {
      return NextResponse.json({ error: 'Empty translation result' }, { status: 502 })
    }

    return NextResponse.json({ translatedText })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
