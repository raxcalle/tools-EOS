import { NextRequest, NextResponse } from 'next/server'

const MODEL = 'gemini-flash-lite-latest'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface ContentScore {
  visual_quality: number
  relevance_b2b: number
  engagement_potential: number
  brand_alignment: number
  copywriting: number
}

export interface PlatformRecommendation {
  platform: string
  fit: 'Sangat Cocok' | 'Cocok' | 'Kurang Cocok'
  alasan: string
}

export interface ContentReviewResult {
  overall_score: number
  verdict: string
  summary: string
  scores: ContentScore
  kelebihan: string[]
  kekurangan: string[]
  saran_perbaikan: string[]
  platform_recommendations: PlatformRecommendation[]
  caption_suggestion: string
  hashtag_suggestion: string[]
  best_time_post: string
}

function buildReviewPrompt(caption: string, platform: string, contentType: string): string {
  return `Kamu adalah social media strategist dan content evaluator B2B berpengalaman, khusus untuk perusahaan teknologi Indonesia.

Evaluasi konten social media berikut untuk EOS Teknologi Indonesia, sebuah perusahaan yang menyediakan solusi software/teknologi untuk bisnis (B2B tech company).

PLATFORM TARGET: ${platform || 'LinkedIn'}
TIPE KONTEN: ${contentType || 'Post reguler'}
CAPTION/COPY: "${caption || '(tidak ada caption)'}"

Jika ada gambar yang dilampirkan, evaluasi juga kualitas visual, desain, dan relevansinya.

Nilai konten ini secara objektif. Balas HANYA dengan JSON valid dalam bahasa Indonesia:
{
  "overall_score": <0-100>,
  "verdict": "<Sangat Bagus|Bagus|Cukup|Perlu Perbaikan|Tidak Layak Post>",
  "summary": "<ringkasan penilaian 2-3 kalimat>",
  "scores": {
    "visual_quality": <0-100>,
    "relevance_b2b": <0-100>,
    "engagement_potential": <0-100>,
    "brand_alignment": <0-100>,
    "copywriting": <0-100>
  },
  "kelebihan": ["<kelebihan 1>","<kelebihan 2>","<kelebihan 3>"],
  "kekurangan": ["<kekurangan 1>","<kekurangan 2>","<kekurangan 3>"],
  "saran_perbaikan": ["<saran spesifik 1>","<saran spesifik 2>","<saran spesifik 3>","<saran spesifik 4>"],
  "platform_recommendations": [
    {"platform":"LinkedIn","fit":"<Sangat Cocok|Cocok|Kurang Cocok>","alasan":"<alasan singkat>"},
    {"platform":"Instagram","fit":"<Sangat Cocok|Cocok|Kurang Cocok>","alasan":"<alasan singkat>"},
    {"platform":"Twitter/X","fit":"<Sangat Cocok|Cocok|Kurang Cocok>","alasan":"<alasan singkat>"}
  ],
  "caption_suggestion": "<versi caption yang lebih baik dan optimal untuk platform target, siap pakai>",
  "hashtag_suggestion": ["<hashtag1>","<hashtag2>","<hashtag3>","<hashtag4>","<hashtag5>","<hashtag6>"],
  "best_time_post": "<rekomendasi waktu posting terbaik dan alasannya>"
}`
}

function parseResponse(text: string): ContentReviewResult {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Respons tidak valid.')
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as ContentReviewResult
  } catch {
    throw new Error('Gagal memproses respons AI.')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      caption: string
      platform: string
      contentType: string
      imageBase64?: string
      imageMimeType?: string
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY belum diset.' }, { status: 500 })

    const prompt = buildReviewPrompt(body.caption, body.platform, body.contentType)

    // Build parts — text + optional image
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [{ text: prompt }]
    if (body.imageBase64 && body.imageMimeType) {
      parts.unshift({
        inline_data: {
          mime_type: body.imageMimeType,
          data: body.imageBase64,
        },
      })
    }

    const url = `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1600 },
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
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error.' }, { status: 500 })
  }
}
