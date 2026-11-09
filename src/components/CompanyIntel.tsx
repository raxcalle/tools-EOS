'use client'
import { useState } from 'react'
import type { CompanyIntel } from '@/lib/types'

export default function CompanyIntelTool() {
  const [company, setCompany] = useState('')
  const [goal, setGoal]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [result, setResult]   = useState<CompanyIntel | null>(null)
  const [toast, setToast]     = useState('')

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const handleSearch = async () => {
    if (company.trim().length < 2) return
    setError(null); setResult(null); setLoading(true)
    try {
      const res = await fetch('/api/company', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, goal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setResult(data.result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error.')
    } finally { setLoading(false) }
  }

  const handleCopy = async () => {
    if (!result) return
    const txt = [
      `Company Intel — ${result.nama_perusahaan}`,
      `Industry: ${result.industri} | Size: ${result.ukuran}`,
      '', result.deskripsi_singkat, '',
      'DECISION MAKERS:',
      ...result.decision_makers.map(dm =>
        `${dm.nama} (${dm.jabatan})\n  ${dm.latar_belakang}\n  Approach: ${dm.cara_approach}`),
      '', 'PAIN POINTS:', ...result.pain_points.map(p => `- ${p}`),
      '', 'TIPS:', ...result.tips_presentasi.map(t => `- ${t}`),
      '', 'OPENING:', result.opening_statement,
    ].join('\n')
    await navigator.clipboard.writeText(txt)
    fire('Copied')
  }

  return (
    <div>
      <div className="form-card">
        <div className="form-label-row">
          <span className="form-label">Company Name</span>
        </div>
        <input
          type="text" value={company}
          onChange={e => setCompany(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. PT Telkom Indonesia, PT Unilever Indonesia..."
          className="idea-input"
          style={{ minHeight: 'unset', resize: 'none' }}
        />
        <div style={{ marginTop: 12 }}>
          <div className="form-label-row" style={{ marginBottom: 8 }}>
            <span className="form-label">Presentation Goal <span style={{ color: 'var(--txt2)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></span>
          </div>
          <input
            type="text" value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="e.g. SaaS pitch, partnership proposal, service offering..."
            className="idea-input"
            style={{ minHeight: 'unset', resize: 'none' }}
          />
        </div>
        <div className="form-footer" style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--txt2)' }}>AI researches decision makers and presentation strategy</p>
          <button className="btn-analyze" onClick={handleSearch} disabled={company.trim().length < 2 || loading}>
            {loading ? <><span className="spinner" /> Researching</> : 'Research'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-box">
          <div className="loading-ring" />
          <div className="loading-text"><strong>Analyzing</strong> — researching company and decision makers...</div>
        </div>
      )}
      {error && <div className="error-box">{error}</div>}

      {result && (
        <div className="results anim-in">
          {/* Header */}
          <div className="score-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div className="score-left-label">Company</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt0)', letterSpacing: '-.4px', margin: '6px 0 8px' }}>
                  {result.nama_perusahaan}
                </h2>
                <div className="tags">
                  <span className="tag">{result.industri}</span>
                  <span className="tag">{result.ukuran}</span>
                  {result.founded !== 'Tidak diketahui' && <span className="tag">Est. {result.founded}</span>}
                </div>
              </div>
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: 'var(--txt1)', lineHeight: 1.75, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {result.deskripsi_singkat}
            </p>
          </div>

          {/* Decision Makers */}
          {result.decision_makers?.length > 0 && (
            <div className="card">
              <div className="card-head"><div className="card-head-left"><span className="card-title">Decision Makers</span></div></div>
              <div className="card-body" style={{ padding: 0 }}>
                {result.decision_makers.map((dm, i) => (
                  <div key={i} style={{ padding: '16px 18px', borderBottom: i < result.decision_makers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt0)' }}>{dm.nama}</p>
                    <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 2, marginBottom: 12 }}>{dm.jabatan}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Background', val: dm.latar_belakang },
                        { label: 'Personality', val: dm.kepribadian },
                        { label: 'Main Focus', val: dm.fokus_utama },
                        { label: 'How to Approach', val: dm.cara_approach, hi: true },
                      ].map(({ label, val, hi }) => (
                        <div key={label} style={{ background: hi ? 'var(--accent-soft)' : 'var(--bg2)', border: `1px solid ${hi ? 'rgba(91,138,240,.2)' : 'var(--border)'}`, borderRadius: 7, padding: '9px 11px' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: hi ? 'var(--accent)' : 'var(--txt2)', marginBottom: 4 }}>{label}</p>
                          <p style={{ fontSize: 12, color: hi ? 'var(--txt0)' : 'var(--txt1)', lineHeight: 1.5 }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opening */}
          {result.opening_statement && (
            <div className="card">
              <div className="card-head"><div className="card-head-left"><span className="card-title">Opening Statement</span></div></div>
              <div className="card-body">
                <div className="refined-block" style={{ fontStyle: 'italic', fontSize: 14 }}>
                  &ldquo;{result.opening_statement}&rdquo;
                </div>
              </div>
            </div>
          )}

          {/* Pain + Tips */}
          <div className="two-col">
            {result.pain_points?.length > 0 && (
              <div className="card">
                <div className="card-head"><div className="card-head-left"><span className="card-title">Pain Points</span></div></div>
                <div className="card-body">
                  <ul className="swot-list">
                    {result.pain_points.map((p, i) => <li key={i} className="swot-item" style={{ color: 'var(--txt1)' }}>{p}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {result.tips_presentasi?.length > 0 && (
              <div className="card">
                <div className="card-head"><div className="card-head-left"><span className="card-title">Presentation Tips</span></div></div>
                <div className="card-body">
                  <ul className="swot-list">
                    {result.tips_presentasi.map((t, i) => <li key={i} className="swot-item" style={{ color: 'var(--txt1)' }}>{t}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="result-actions">
            <button className="btn-action" onClick={handleCopy}>Copy</button>
            <button className="btn-action" onClick={() => { setResult(null); setCompany(''); setGoal('') }}>Reset</button>
          </div>
          {toast && <div className="toast">{toast}</div>}
        </div>
      )}
    </div>
  )
}
