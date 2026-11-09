import { NextRequest, NextResponse } from 'next/server'

const MODEL = 'gemini-flash-lite-latest'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface PlanTask {
  waktu: string
  durasi: string
  aktivitas: string
  detail: string
  prioritas: 'high' | 'medium' | 'low'
  kategori: string
}

export interface DailyPlanResult {
  tanggal: string
  focus_hari_ini: string
  summary: string
  tasks: PlanTask[]
  reminder: string[]
  tips_hari_ini: string
}

function buildPlanPrompt(context: string, focus: string, date: string): string {
  return `Kamu adalah asisten produktivitas untuk tim marketing di EOS Teknologi Indonesia, sebuah perusahaan teknologi yang bergerak di bidang solusi digital/software.

Tugas kamu: buat rencana harian yang realistis, detail, dan actionable untuk seorang Marketing Executive di EOS Teknologi Indonesia.

TANGGAL: ${date}
KONTEKS/PERTANYAAN: "${context}"
FOKUS UTAMA HARI INI: "${focus || 'General marketing activities'}"

Buat daily plan yang profesional. Balas HANYA dengan JSON valid dalam bahasa Indonesia:
{
  "tanggal": "<hari, tanggal lengkap>",
  "focus_hari_ini": "<1 kalimat fokus utama hari ini>",
  "summary": "<ringkasan singkat tentang hari ini dan apa yang harus dicapai, 2-3 kalimat>",
  "tasks": [
    {
      "waktu": "<jam, contoh: 08:00>",
      "durasi": "<durasi, contoh: 30 menit>",
      "aktivitas": "<nama aktivitas singkat>",
      "detail": "<deskripsi detail apa yang harus dilakukan>",
      "prioritas": "<high|medium|low>",
      "kategori": "<kategori: Content|Outreach|Meeting|Admin|Research|Social Media|Reporting>"
    }
  ],
  "reminder": [
    "<reminder penting 1>",
    "<reminder penting 2>",
    "<reminder penting 3>"
  ],
  "tips_hari_ini": "<1 tips motivasi atau produktivitas yang relevan untuk marketing di perusahaan teknologi>"
}

Buat minimal 8-10 tasks yang realistis dari jam 08:00 sampai 17:00. Sesuaikan dengan konteks marketing di perusahaan teknologi Indonesia.`
}

function parseResponse(text: string): DailyPlanResult {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Respons tidak valid.')
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as DailyPlanResult
  } catch {
    throw new Error('Gagal memproses respons AI.')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { context, focus, date } = (await req.json()) as {
      context: string
      focus: string
      date: string
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY belum diset.' }, { status: 500 })

    const prompt = buildPlanPrompt(context || 'Buat plan harian marketing standar', focus, date)
    const url = `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 1800 },
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
