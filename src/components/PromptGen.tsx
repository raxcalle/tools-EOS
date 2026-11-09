'use client'
import { useState } from 'react'
import type { GeneratedPrompt } from '@/lib/types'

const STYLES = [
  'Modern 2D Motion Graphics', 'Minimalist Flat Design', '3D CGI Animation',
  'Whiteboard / Explainer', 'Cinematic Live Action + Motion', 'Isometric Illustration',
  'Glassmorphism UI', 'Retro / Vintage', 'Corporate Professional', 'Playful & Fun',
]
const DURATIONS = ['15s', '30s', '60s', '90s', '2min', '3min']

export default function PromptGen() {
  const [input, setInput]         = useState('')
  const [style, setStyle]         = useState(STYLES[0])
  const [duration, setDuration]   = useState(DURATIONS[1])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [result, setResult]       = useState<GeneratedPrompt | null>(null)
  const [copied, setCopied]       = useState<string | null>(null)
  const [activeScene, setActiveScene] = useState<number | null>(null)

  const fire = (key: string) => { setCopied(key); setTimeout(() => setCopied(null), 2000) }
  const copyText = async (text: string, key: string) => { await navigator.clipboard.writeText(text); fire(key) }

  const handleGenerate = async () => {
    if (input.trim().length < 5) return
    setError(null); setResult(null); setActiveScene(null); setLoading(true)
    try {
      const res = await fetch('/api/promptgen', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, style, duration }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setResult(data.result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error.')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="form-card">
        <div className="form-label-row">
          <span className="form-label">Video Description</span>
          <span className="char-count">{input.length} chars</span>
        </div>
        <textarea
          className="idea-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Describe the video or animation you want to create — product, audience, mood, key message..."
          rows={4}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div>
            <div className="form-label-row" style={{ marginBottom: 8 }}>
              <span className="form-label">Animation Style</span>
            </div>
            <select value={style} onChange={e => setStyle(e.target.value)}>
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="form-label-row" style={{ marginBottom: 8 }}>
              <span className="form-label">Duration</span>
            </div>
            <div className="chips">
              {DURATIONS.map(d => (
                <button key={d} className={`chip ${duration === d ? 'on' : ''}`} onClick={() => setDuration(d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-footer" style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--txt2)' }}>
            Optimized for <strong style={{ color: 'var(--txt1)', fontWeight: 600 }}>Claude Sonnet 4.5</strong>
          </p>
          <button className="btn-analyze" onClick={handleGenerate} disabled={input.trim().length < 5 || loading}>
            {loading ? <><span className="spinner" /> Generating</> : 'Generate Prompt'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-box">
          <div className="loading-ring" />
          <div className="loading-text"><strong>Generating</strong> — crafting prompt for Sonnet 4.5...</div>
        </div>
      )}
      {error && <div className="error-box">{error}</div>}

      {result && (
        <div className="results anim-in">
          {/* Header */}
          <div className="score-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div className="score-left-label">Generated Prompt</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--txt0)', letterSpacing: '-.3px', marginTop: 6 }}>{result.title}</h2>
              </div>
              <div className="tags" style={{ justifyContent: 'flex-end' }}>
                <span className="tag">{style}</span>
                <span className="tag">{duration}</span>
              </div>
            </div>
          </div>

          {/* Main Prompt */}
          <div className="card">
            <div className="card-head">
              <div className="card-head-left"><span className="card-title">Prompt — Claude Sonnet 4.5</span></div>
              <button className="btn-action" onClick={() => copyText(result.prompt_utama, 'main')} style={{ padding: '4px 10px', fontSize: 11 }}>
                {copied === 'main' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="prompt-block" style={{ margin: 0, borderRadius: 0, border: 'none', borderLeft: '2px solid var(--accent)' }}>
                {result.prompt_utama}
              </div>
            </div>
          </div>

          {/* Negative Prompt */}
          {result.negative_prompt && (
            <div className="card">
              <div className="card-head">
                <div className="card-head-left"><span className="card-title">Negative Prompt</span></div>
                <button className="btn-action" onClick={() => copyText(result.negative_prompt, 'neg')} style={{ padding: '4px 10px', fontSize: 11 }}>
                  {copied === 'neg' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 13, color: 'var(--txt1)', fontStyle: 'italic', lineHeight: 1.7 }}>{result.negative_prompt}</p>
              </div>
            </div>
          )}

          {/* Scene Breakdown */}
          {result.scene_breakdown?.length > 0 && (
            <div className="card">
              <div className="card-head"><div className="card-head-left"><span className="card-title">Scene Breakdown</span></div></div>
              <div className="card-body" style={{ padding: 0 }}>
                {result.scene_breakdown.map((scene, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveScene(activeScene === i ? null : i)}
                    style={{
                      padding: '13px 18px',
                      borderBottom: i < result.scene_breakdown.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      background: activeScene === i ? 'var(--accent-soft)' : 'transparent',
                      transition: 'background .15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, background: activeScene === i ? 'var(--accent)' : 'var(--bg3)', color: activeScene === i ? 'white' : 'var(--txt2)', padding: '2px 8px', borderRadius: 4, letterSpacing: '.02em' }}>
                          {scene.scene}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--txt2)' }}>{scene.durasi}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--txt2)' }}>{activeScene === i ? '▲' : '▼'}</span>
                    </div>
                    {activeScene === i && (
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <p style={{ fontSize: 13, color: 'var(--txt0)', lineHeight: 1.65 }}>{scene.deskripsi}</p>
                        <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '8px 10px', border: '1px solid var(--border)' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--txt2)', marginBottom: 3 }}>Camera</p>
                          <p style={{ fontSize: 12, color: 'var(--txt1)' }}>{scene.camera}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Style Notes + Tips */}
          <div className="two-col">
            {result.style_notes?.length > 0 && (
              <div className="card">
                <div className="card-head"><div className="card-head-left"><span className="card-title">Style Notes</span></div></div>
                <div className="card-body">
                  <ul className="swot-list">
                    {result.style_notes.map((n, i) => <li key={i} className="swot-item">{n}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {result.tips_penggunaan?.length > 0 && (
              <div className="card">
                <div className="card-head"><div className="card-head-left"><span className="card-title">Usage Tips</span></div></div>
                <div className="card-body">
                  <ul className="swot-list">
                    {result.tips_penggunaan.map((t, i) => <li key={i} className="swot-item">{t}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="result-actions">
            <button className="btn-action" onClick={() => copyText(result.prompt_utama, 'main2')}>{copied === 'main2' ? 'Copied' : 'Copy Prompt'}</button>
            <button className="btn-action" onClick={() => copyText(`PROMPT:\n${result.prompt_utama}\n\nNEGATIVE:\n${result.negative_prompt}`, 'all')}>{copied === 'all' ? 'Copied' : 'Copy All'}</button>
            <button className="btn-action" onClick={() => { setResult(null); setInput('') }}>Reset</button>
          </div>
        </div>
      )}
    </div>
  )
}
