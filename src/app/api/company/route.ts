import { NextRequest, NextResponse } from 'next/server'
import type { CompanyIntel } from '@/lib/types'

const MODEL = 'gemini-flash-lite-latest'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function buildCompanyPrompt(company: string, goal: string): string {
  return `Kamu adalah analis bisnis dan sales strategist berpengalaman di Indonesia.
Cari dan analisis informasi tentang perusahaan berikut untuk keperluan presentasi bisnis.

PERUSAHAAN: "${company}"
TUJUAN PRESENTASI: "${goal || 'Presentasi bisnis / partnership'}"

Balas HANYA dengan JSON valid dalam bahasa Indonesia:
{
  "nama_perusahaan": "<nama resmi perusahaan>",
  "industri": "<industri utama>",
  "deskripsi_singkat": "<deskripsi 2-3 kalimat tentang bisnis mereka>",
  "founded": "<tahun berdiri jika diketahui, atau 'Tidak diketahui'>",
  "ukuran": "<estimasi ukuran: Startup/UMKM/Menengah/Besar/Korporat>",
  "decision_makers": [
    {
      "nama": "<nama lengkap>",
      "jabatan": "<jabatan/posisi>",
      "latar_belakang": "<latar belakang singkat, pendidikan/karir>",
      "kepribadian": "<perkiraan gaya kepemimpinan/kepribadian berdasarkan background>",
      "fokus_utama": "<apa yang biasanya jadi prioritas mereka>",
      "cara_approach": "<cara terbaik mendekati orang ini dalam presentasi>"
    }
  ],
  "pain_points": [
    "<masalah/tantangan utama yang kemungkinan dihadapi perusahaan ini>",
    "<pain point 2>",
    "<pain point 3>"
  ],
  "tips_presentasi": [
    "<tips spesifik untuk presentasi ke perusahaan ini>",
    "<tips 2>",
    "<tips 3>",
    "<tips 4>"
  ],
  "opening_statement": "<contoh kalimat pembuka yang kuat dan relevan untuk memulai presentasi ke perusahaan ini>",
  "sumber": ["<sumber info jika ada, misal: LinkedIn, website resmi, berita>"]
}

Jika informasi tidak tersedia, berikan estimasi berdasarkan industri dan nama perusahaannya. Pastikan tips dan opening statement benar-benar spesifik dan actionable.`
}

function parseCompanyResponse(text: string): CompanyIntel {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1)
    throw new Error('Respons tidak valid dari AI.')

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as CompanyIntel
  } catch {
    throw new Error('Gagal memproses respons AI. Coba lagi.')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { company, goal } = (await req.json()) as {
      company: string
      goal: string
    }

    if (!company || company.trim().length < 2)
      return NextResponse.json({ error: 'Nama perusahaan terlalu pendek.' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey)
      return NextResponse.json({ error: 'GEMINI_API_KEY belum diset.' }, { status: 500 })

    const prompt = buildCompanyPrompt(company.trim(), goal?.trim() ?? '')
    const url = `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1500,
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
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!text)
      return NextResponse.json({ error: 'Respons kosong.' }, { status: 500 })

    const result = parseCompanyResponse(text)
    return NextResponse.json({ result })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Terjadi kesalahan.' },
      { status: 500 }
    )
  }
}
