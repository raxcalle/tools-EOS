'use client'
import { useState } from 'react'
import type { AnalysisResult, HistoryItem } from '@/lib/types'
import ScoreCard from './ScoreCard'
import ContentCard from './ContentCard'

const SWOT_CFG = [
  { key: 'strengths',     label: 'Strengths',      color: 'var(--green)' },
  { key: 'weaknesses',    label: 'Weaknesses',     color: 'var(--amber)' },
  { key: 'opportunities', label: 'Opportunities',  color: 'var(--accent)' },
  { key: 'threats',       label: 'Threats',        color: 'var(--red)' },
] as const

export default function ResultPanel({
  result, idea, onReset, onSave,
}: {
  result: AnalysisResult
  idea: string
  onReset: () => void
  onSave: (item: HistoryItem) => void
}) {
  const [toast, setToast] = useState('')

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const copy = async () => {
    const txt = [
      `RaxIdea Analysis`,
      `Score: ${result.overall_score}/100 — ${result.verdict}`,
      `Idea: ${idea}`,
      '', result.analisis,
      result.ide_refined ? `\nRefined:\n${result.ide_refined}` : '',
      `\nTags: ${result.tags?.join(', ')}`,
    ].join('\n')
    await navigator.clipboard.writeText(txt)
    fire('Copied to clipboard')
  }

  return (
    <div className="results anim-in">
      <ScoreCard result={result} />

      {result.analisis && (
        <ContentCard title="Analysis">
          {result.analisis.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </ContentCard>
      )}

      {result.ide_refined && (
        <ContentCard title="Refined Idea">
          <div className="refined-block">{result.ide_refined}</div>
        </ContentCard>
      )}

      {(result.swot || result.target_pasar) && (
        <div className="two-col">
          {result.swot && (
            <ContentCard title="SWOT">
              <div className="swot-grid">
                {SWOT_CFG.map(({ key, label, color }) => (
                  <div key={key} className="swot-box">
                    <div className="swot-title" style={{ color }}>{label}</div>
                    <ul className="swot-list">
                      {(result.swot![key] as string[]).map((s, i) => (
                        <li key={i} className="swot-item">{s}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ContentCard>
          )}

          {result.target_pasar && (
            <ContentCard title="Target Market">
              <div className="market-row">
                {result.target_pasar.segmen_utama && (
                  <div>
                    <div className="market-item-label">Segment</div>
                    <div className="market-item-val">{result.target_pasar.segmen_utama}</div>
                  </div>
                )}
                {result.target_pasar.usia && (
                  <div>
                    <div className="market-item-label">Age Range</div>
                    <div className="market-item-val">{result.target_pasar.usia}</div>
                  </div>
                )}
                {result.target_pasar.ukuran_pasar && (
                  <div>
                    <div className="market-item-label">Market Size</div>
                    <div className="market-item-val">{result.target_pasar.ukuran_pasar}</div>
                  </div>
                )}
                {result.target_pasar.kebutuhan?.length > 0 && (
                  <div>
                    <div className="market-item-label">Key Needs</div>
                    <ul className="market-list">
                      {result.target_pasar.kebutuhan.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </ContentCard>
          )}
        </div>
      )}

      {result.tags?.length > 0 && (
        <div className="tags">
          {result.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
        </div>
      )}

      <div className="result-actions">
        <button className="btn-action" onClick={copy}>Copy</button>
        <button className="btn-action" onClick={() => { onSave({ idea, parsed: result, timestamp: Date.now() }); fire('Saved') }}>Save</button>
        <button className="btn-action" onClick={onReset}>New idea</button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
