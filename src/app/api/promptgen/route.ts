import { NextRequest, NextResponse } from 'next/server'
import type { GeneratedPrompt } from '@/lib/types'

const MODEL = 'gemini-flash-lite-latest'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function buildPromptGenPrompt(input: string, style: string, duration: string): string {
  return `Kamu adalah prompt engineer ahli untuk video animasi dan motion graphics. 
Tugasmu membuat prompt yang sangat detail dan dioptimasi khusus untuk Claude Sonnet 4.5 agar bisa menggenerate script/storyboard video animasi promosi yang memukau.

INPUT PENGGUNA: "${input}"
STYLE ANIMASI: "${style || 'Modern 2D Motion Graphics'}"
DURASI TARGET: "${duration || '30-60 detik'}"

Buat prompt yang komprehensif. Balas HANYA dengan JSON valid dalam bahasa Indonesia:
{
  "title": "<judul singkat untuk prompt ini>",
  "prompt_utama": "<prompt lengkap dan detail yang siap di-copy-paste ke Claude Sonnet 4.5. Harus mencakup: deskripsi visual, gaya animasi, palet warna, tipografi, musik/sfx, tone & feel, target audiens, CTA. Minimal 300 kata, sangat spesifik dan teknikal>",
  "negative_prompt": "<hal-hal yang harus DIHINDARI dalam video ini, ditulis sebagai instruksi negatif untuk Claude>",
  "style_notes": [
    "<catatan style/teknis penting 1>",
    "<catatan style/teknis penting 2>",
    "<catatan style/teknis penting 3>",
    "<catatan style/teknis penting 4>"
  ],
  "scene_breakdown": [
    {
      "scene": "Scene 1",
      "durasi": "<estimasi durasi, contoh: 0:00-0:05>",
      "deskripsi": "<deskripsi visual scene ini>",
      "camera": "<pergerakan kamera/angle>"
    },
    {
      "scene": "Scene 2",
      "durasi": "<durasi>",
      "deskripsi": "<deskripsi>",
      "camera": "<camera>"
    },
    {
      "scene": "Scene 3",
      "durasi": "<durasi>",
      "deskripsi": "<deskripsi>",
      "camera": "<camera>"
    },
    {
      "scene": "Scene 4",
      "durasi": "<durasi>",
      "deskripsi": "<deskripsi>",
      "camera": "<camera>"
    },
    {
      "scene": "Scene 5 (Closing)",
      "durasi": "<durasi>",
      "deskripsi": "<deskripsi closing dengan CTA>",
      "camera": "<camera>"
    }
  ],
  "tips_penggunaan": [
    "<tips cara terbaik menggunakan prompt ini di Claude Sonnet 4.5>",
    "<tips iterasi/refinement>",
    "<tips untuk hasil maksimal>"
  ]
}`
}

function parseResponse(text: string): GeneratedPrompt {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Respons tidak valid dari AI.')
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as GeneratedPrompt
  } catch {
    throw new Error('Gagal memproses respons AI. Coba lagi.')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { input, style, duration } = (await req.json()) as {
      input: string
      style: string
      duration: string
    }

    if (!input || input.trim().length < 5)
      return NextResponse.json({ error: 'Deskripsi terlalu pendek.' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey)
      return NextResponse.json({ error: 'GEMINI_API_KEY belum diset.' }, { status: 500 })

    const prompt = buildPromptGenPrompt(input.trim(), style, duration)
    const url = `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    })

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}))
      const msg = (err as { error?: { message?: string } }).error?.message ?? `HTTP ${geminiRes.status}`
      return NextResponse.json({ error: msg }, { status: geminiRes.status })
    }

    const data = await geminiRes.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!text) return NextResponse.json({ error: 'Respons kosong.' }, { status: 500 })

    const result = parseResponse(text)
    return NextResponse.json({ result })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Terjadi kesalahan.' },
      { status: 500 }
    )
  }
}
