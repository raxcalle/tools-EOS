import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt, parseAIResponse } from '@/lib/gemini'
import type { AnalyzeOptions } from '@/lib/types'

// Fastest available model based on benchmarks
const MODEL = 'gemini-flash-lite-latest'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export async function POST(req: NextRequest) {
  try {
    const { idea, options } = (await req.json()) as {
      idea: string
      options: AnalyzeOptions
    }

    if (!idea || idea.trim().length < 10)
      return NextResponse.json(
        { error: 'Ide terlalu pendek, minimal 10 karakter.' },
        { status: 400 }
      )

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey)
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum diset di .env.local' },
        { status: 500 }
      )

    const prompt = buildPrompt(idea.trim(), options)
    const url = `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}))
      const msg =
        (err as { error?: { message?: string } }).error?.message ??
        `Gemini error: HTTP ${geminiRes.status}`
      return NextResponse.json({ error: msg }, { status: geminiRes.status })
    }

    const data = await geminiRes.json()
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!text)
      return NextResponse.json(
        { error: 'Respons kosong dari Gemini.' },
        { status: 500 }
      )

    const result = parseAIResponse(text)
    return NextResponse.json({ result })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Terjadi kesalahan.' },
      { status: 500 }
    )
  }
}
