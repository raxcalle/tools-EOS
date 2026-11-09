'use client'
import { useEffect, useState } from 'react'
import type { AnalysisResult } from '@/lib/types'

const LABELS: Record<string, string> = {
  inovasi: 'Innovation', kelayakan: 'Feasibility',
  potensi_pasar: 'Market Potential', skalabilitas: 'Scalability', keunikan: 'Uniqueness',
}

function cls(n: number) { return n >= 70 ? 'high' : n >= 45 ? 'mid' : 'low' }

function Bar({ label, value }: { label: string; value: number }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(value), 80); return () => clearTimeout(t) }, [value])
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className={`bar-fill ${cls(value)}`} style={{ width: `${w}%` }} />
      </div>
      <span className="bar-val">{value}</span>
    </div>
  )
}

export default function ScoreCard({ result }: { result: AnalysisResult }) {
  const { overall_score, verdict, scores } = result
  const c = cls(overall_score)
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(0)
    const dur = 800, start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * overall_score))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [overall_score])

  return (
    <div className="score-card">
      <div className="score-top">
        <div>
          <div className="score-left-label">Viability Score</div>
          <span className={`verdict-pill color-${c}`}>{verdict}</span>
        </div>
        <div className={`score-number color-${c}`}>{count}</div>
      </div>
      {scores && (
        <div className="score-bars">
          {Object.entries(scores).map(([k, v]) => (
            <Bar key={k} label={LABELS[k] || k} value={v} />
          ))}
        </div>
      )}
    </div>
  )
}
