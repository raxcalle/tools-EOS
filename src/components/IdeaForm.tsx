'use client'
import { useState } from 'react'
import type { AnalyzeOptions } from '@/lib/types'

const CHIPS: { key: keyof AnalyzeOptions; label: string }[] = [
  { key: 'score',  label: 'Scoring'      },
  { key: 'refine', label: 'Refinement'   },
  { key: 'swot',   label: 'SWOT'         },
  { key: 'market', label: 'Target Pasar' },
]

export default function IdeaForm({
  onSubmit, loading,
}: {
  onSubmit: (idea: string, opts: AnalyzeOptions) => void
  loading: boolean
}) {
  const [idea, setIdea] = useState('')
  const [opts, setOpts] = useState<AnalyzeOptions>({ score: true, refine: true, swot: true, market: true })
  const ready = idea.trim().length >= 10 && !loading

  return (
    <div className="form-card">
      <div className="form-label-row">
        <span className="form-label">Your Idea</span>
        <span className="char-count">{idea.length} chars</span>
      </div>

      <textarea
        className="idea-input"
        value={idea}
        onChange={e => setIdea(e.target.value)}
        placeholder="Describe your idea in detail. What problem does it solve? Who is it for? What makes it different..."
        rows={4}
      />

      <div className="form-footer">
        <div className="chips">
          {CHIPS.map(c => (
            <button
              key={c.key}
              className={`chip ${opts[c.key] ? 'on' : ''}`}
              onClick={() => setOpts(p => ({ ...p, [c.key]: !p[c.key] }))}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button className="btn-analyze" onClick={() => onSubmit(idea, opts)} disabled={!ready}>
          {loading
            ? <><span className="spinner" /> Analyzing</>
            : 'Analyze'}
        </button>
      </div>
    </div>
  )
}
