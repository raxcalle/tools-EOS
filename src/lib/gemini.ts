import type { AnalyzeOptions, AnalysisResult } from './types'

export function buildPrompt(idea: string, options: AnalyzeOptions): string {
  const swotField = options.swot
    ? `"swot":{"strengths":["s1","s2","s3"],"weaknesses":["w1","w2","w3"],"opportunities":["o1","o2","o3"],"threats":["t1","t2","t3"]}`
    : `"swot":null`

  const marketField = options.market
    ? `"target_pasar":{"segmen_utama":"..","usia":"..","kebutuhan":["k1","k2","k3"],"ukuran_pasar":".."}`
    : `"target_pasar":null`

  const refinedField = options.refine
    ? `"ide_refined":"versi ide lebih tajam 1-2 kalimat"`
    : `"ide_refined":""`

  return `Analisis ide bisnis berikut, jawab HANYA dengan JSON valid dalam bahasa Indonesia.

IDE: "${idea}"

JSON:
{
  "overall_score": <0-100>,
  "verdict": "<Sangat Layak|Layak|Cukup Layak|Kurang Layak|Tidak Layak>",
  "scores": {"inovasi":<0-100>,"kelayakan":<0-100>,"potensi_pasar":<0-100>,"skalabilitas":<0-100>,"keunikan":<0-100>},
  "analisis": "<2 paragraf, pisah dengan \\n\\n>",
  ${refinedField},
  ${swotField},
  ${marketField},
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}`
}

export function parseAIResponse(text: string): AnalysisResult {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1)
    throw new Error('Respons tidak mengandung JSON. Coba lagi.')

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as AnalysisResult
  } catch {
    throw new Error('Gagal parse respons AI. Coba lagi.')
  }
}
