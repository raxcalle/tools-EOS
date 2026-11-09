export interface ScoreBreakdown {
  inovasi: number
  kelayakan: number
  potensi_pasar: number
  skalabilitas: number
  keunikan: number
}

export interface SwotData {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export interface TargetPasar {
  segmen_utama: string
  usia: string
  kebutuhan: string[]
  ukuran_pasar: string
}

export interface AnalysisResult {
  overall_score: number
  verdict: string
  scores: ScoreBreakdown
  analisis: string
  ide_refined: string
  swot: SwotData | null
  target_pasar: TargetPasar | null
  tags: string[]
}

export interface HistoryItem {
  idea: string
  parsed: AnalysisResult
  timestamp: number
}

export interface AnalyzeOptions {
  score: boolean
  refine: boolean
  swot: boolean
  market: boolean
}

// ── Prompt Generator ──────────────────────────────────────────

export interface SceneBreakdown {
  scene: string
  durasi: string
  deskripsi: string
  camera: string
}

export interface GeneratedPrompt {
  title: string
  prompt_utama: string
  negative_prompt: string
  style_notes: string[]
  scene_breakdown: SceneBreakdown[]
  tips_penggunaan: string[]
}

// ── Company Intel ─────────────────────────────────────────────

export interface DecisionMaker {
  nama: string
  jabatan: string
  latar_belakang: string
  kepribadian: string
  fokus_utama: string
  cara_approach: string
}

export interface CompanyIntel {
  nama_perusahaan: string
  industri: string
  deskripsi_singkat: string
  founded: string
  ukuran: string
  decision_makers: DecisionMaker[]
  pain_points: string[]
  tips_presentasi: string[]
  opening_statement: string
  sumber: string[]
}
