import { NextRequest, NextResponse } from 'next/server'
import type { CompanyIntel } from '@/lib/types'

const MODEL = 'gemini-flash-lite-latest'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function buildCompanyPrompt(company: string, goal: string): string {
  return `Kamu adalah analis bisnis B2B untuk perusahaan teknologi Indonesia.

PENTING — ATURAN KEJUJURAN DATA:
1. Jika perusahaan "${company}" TIDAK ADA atau TIDAK DIKENAL, set "is_known_company": false dan JANGAN mengarang data decision maker. Isi decision_makers dengan array kosong [].
2. Jika perusahaan DIKENAL/NYATA, berikan data seakurat mungkin dan tandai confidence level setiap decision maker.
3. WAJIB bedakan data yang "Verified" (kamu yakin 90%+), "Estimasi" (kamu perkirakan berdasarkan industri/pola umum), atau "Tidak Diketahui".
4. Untuk kontak: hanya isi jika kamu benar-benar tahu. Jika tidak tahu, isi string kosong "".
5. SELALU sertakan link pencarian LinkedIn yang bisa dipakai user untuk verifikasi sendiri.

PERUSAHAAN: "${company}"
TUJUAN: "${goal || 'Presentasi bisnis / partnership'}"

Balas HANYA dengan JSON valid dalam bahasa Indonesia:
{
  "nama_perusahaan": "<nama resmi>",
  "industri": "<industri>",
  "deskripsi_singkat": "<deskripsi 2-3 kalimat JUJUR, kalau tidak dikenal bilang tidak ditemukan>",
  "founded": "<tahun atau 'Tidak diketahui'>",
  "ukuran": "<Startup/UMKM/Menengah/Besar/Korporat atau 'Tidak diketahui'>",
  "website": "<domain website jika diketahui, atau ''>",
  "is_known_company": <true jika perusahaan nyata dan dikenal, false jika tidak dikenal/fiktif>,
  "disclaimer": "<disclaimer jujur tentang akurasi data ini, termasuk bahwa user HARUS verifikasi sendiri via LinkedIn/Google>",
  "decision_makers": [
    {
      "nama": "<nama lengkap JIKA DIKETAHUI, atau 'Nama tidak diketahui — cek LinkedIn'>",
      "jabatan": "<jabatan>",
      "latar_belakang": "<latar belakang JIKA DIKETAHUI, atau estimasi berdasarkan industri — tandai jelas>",
      "kepribadian": "<estimasi gaya kepemimpinan — TANDAI sebagai estimasi>",
      "fokus_utama": "<prioritas umum jabatan ini di industri ini>",
      "cara_approach": "<cara approach terbaik untuk jabatan ini>",
      "kontak_linkedin": "<URL LinkedIn jika diketahui, atau 'https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(company)}'>",
      "kontak_email": "<format email jika pola diketahui, contoh: nama@domain.com — atau ''>",
      "confidence": "<Verified|Estimasi|Tidak Diketahui>"
    }
  ],
  "pain_points": ["<pain point industri ini>","<pain point 2>","<pain point 3>"],
  "tips_presentasi": ["<tips>","<tips 2>","<tips 3>","<tips 4>"],
  "opening_statement": "<opening statement untuk presentasi>",
  "sumber": ["<sumber jika ada, misal: linkedin.com, website resmi — atau tulis 'Estimasi AI, belum diverifikasi'>"],
  "linkedin_search_url": "https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(company)}"
}

INGAT: Lebih baik jujur bilang 'tidak diketahui' daripada mengarang data yang bisa menyesatkan.`
}

function parseCompanyResponse(text: string): CompanyIntel {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Respons tidak valid dari AI.')
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as CompanyIntel
  } catch {
    throw new Error('Gagal memproses respons AI. Coba lagi.')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { company, goal } = (await req.json()) as { company: string; goal: string }

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
        generationConfig: { temperature: 0.2, maxOutputTokens: 1800 },
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

    const result = parseCompanyResponse(text)
    return NextResponse.json({ result })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Terjadi kesalahan.' }, { status: 500 })
  }
}
