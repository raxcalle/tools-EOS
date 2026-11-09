import type { AnalyzeOptions, AnalysisResult } from './types'

export function buildPrompt(idea: string, options: AnalyzeOptions): string {
  const parts: string[] = []

  parts.push(
    `Kamu adalah konsultan bisnis dan inovasi yang ahli. Analisis ide berikut secara mendalam dalam bahasa Indonesia.`
  )
  parts.push(`\nIDE: "${idea}"`)
  parts.push(
    `\nBerikan respons dalam format JSON yang valid dengan struktur berikut PERSIS (jangan ada teks di luar JSON):`
  )
  parts.push(`
{
  "overall_score": <angka 0-100>,
  "verdict": "<Sangat Layak / Layak / Cukup Layak / Kurang Layak / Tidak Layak>",
  "scores": {
    "inovasi": <0-100>,
    "kelayakan": <0-100>,
    "potensi_pasar": <0-100>,
    "skalabilitas": <0-100>,
    "keunikan": <0-100>
  },
  "analisis": "<penjelasan 2-3 paragraf tentang ide ini, kekuatan dan kelemahannya>",
  "ide_refined": "<versi ide yang sudah diperhalus, lebih tajam, dan jelas — 1-2 paragraf>",
  "swot": {
    "strengths": ["<kekuatan 1>", "<kekuatan 2>", "<kekuatan 3>"],
    "weaknesses": ["<kelemahan 1>", "<kelemahan 2>", "<kelemahan 3>"],
    "opportunities": ["<peluang 1>", "<peluang 2>", "<peluang 3>"],
    "threats": ["<ancaman 1>", "<ancaman 2>", "<ancaman 3>"]
  },
  "target_pasar": {
    "segmen_utama": "<deskripsi>",
    "usia": "<rentang usia>",
    "kebutuhan": ["<kebutuhan 1>", "<kebutuhan 2>", "<kebutuhan 3>"],
    "ukuran_pasar": "<estimasi ukuran>"
  },
  "tags": ["<tag 1>", "<tag 2>", "<tag 3>", "<tag 4>", "<tag 5>"]
}`)

  if (!options.swot) parts.push('\n(Isi field swot dengan null)')
  if (!options.market) parts.push('\n(Isi field target_pasar dengan null)')
  if (!options.refine) parts.push('\n(Isi field ide_refined dengan string kosong)')
  if (!options.score) parts.push('\n(Isi semua nilai dalam scores dengan 0)')

  return parts.join('')
}

export function parseAIResponse(text: string): AnalysisResult {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Format respons AI tidak valid. Coba lagi ya.')
  try {
    return JSON.parse(match[0]) as AnalysisResult
  } catch {
    throw new Error('Gagal parse respons AI. Coba lagi ya.')
  }
}
