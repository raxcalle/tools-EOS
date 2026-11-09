'use client'
import { useState } from 'react'
import type { DailyPlanResult, PlanTask } from '@/app/api/dailyplan/route'

const KATEGORI_COLOR: Record<string, string> = {
  Content:      'var(--accent)',
  Outreach:     'var(--green)',
  Meeting:      'var(--amber)',
  Admin:        'var(--txt2)',
  Research:     '#a78bfa',
  'Social Media': '#ec4899',
  Reporting:    'var(--red)',
}

const FOCUS_SUGGESTIONS = [
  'Lead generation & prospecting',
  'Content creation & social media',
  'Client follow-up & outreach',
  'Campaign planning & execution',
  'Market research & competitor analysis',
  'Reporting & performance review',
  'Partnership & collaboration',
]

function PriorityBadge({ p }: { p: PlanTask['prioritas'] }) {
  const cfg = {
    high:   { bg: 'var(--red-soft)',   color: 'var(--red)',   label: 'High'   },
    medium: { bg: 'var(--amber-soft)', color: 'var(--amber)', label: 'Med'    },
    low:    { bg: 'var(--green-soft)', color: 'var(--green)', label: 'Low'    },
  }[p]
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: cfg.bg, color: cfg.color, letterSpacing: '.04em', textTransform: 'uppercase' }}>
      {cfg.label}
    </span>
  )
}

export default function DailyPlan() {
  const today = new Date().toISOString().split('T')[0]
  const [context, setContext]   = useState('')
  const [focus, setFocus]       = useState('')
  const [date, setDate]         = useState(today)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [result, setResult]     = useState<DailyPlanResult | null>(null)
  const [done, setDone]         = useState<Set<number>>(new Set())
  const [toast, setToast]       = useState('')

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const toggleDone = (i: number) => {
    setDone(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleGenerate = async () => {
    setError(null); setResult(null); setDone(new Set()); setLoading(true)
    try {
      const displayDate = new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      const res = await fetch('/api/dailyplan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, focus, date: displayDate }),
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
      `Daily Plan — ${result.tanggal}`,
      `Focus: ${result.focus_hari_ini}`,
      '', result.summary, '',
      'TASKS:',
      ...result.tasks.map(t => `${t.waktu} [${t.durasi}] ${t.aktivitas}\n  ${t.detail}`),
      '', 'REMINDERS:', ...result.reminder.map(r => `- ${r}`),
      '', `TIP: ${result.tips_hari_ini}`,
    ].join('\n')
    await navigator.clipboard.writeText(txt)
    fire('Copied')
  }

  const doneCount = done.size
  const totalCount = result?.tasks.length ?? 0
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div>
      {/* Form */}
      <div className="form-card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <div className="form-label-row" style={{ marginBottom: 8 }}>
              <span className="form-label">Date</span>
            </div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="idea-input"
              style={{ minHeight: 'unset', resize: 'none', cursor: 'pointer' }}
            />
          </div>
          <div>
            <div className="form-label-row" style={{ marginBottom: 8 }}>
              <span className="form-label">Main Focus</span>
            </div>
            <select value={focus} onChange={e => setFocus(e.target.value)}>
              <option value="">Select focus or type below...</option>
              {FOCUS_SUGGESTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="form-label-row" style={{ marginBottom: 8 }}>
          <span className="form-label">Context / Question <span style={{ color: 'var(--txt2)', textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(optional)</span></span>
        </div>
        <textarea
          className="idea-input"
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="e.g. I have a product demo tomorrow with a potential client, need to prepare materials and follow up with 3 leads from last week..."
          rows={3}
        />

        <div className="form-footer" style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--txt2)' }}>
            Daily plan for <strong style={{ color: 'var(--txt1)', fontWeight: 600 }}>Marketing @ EOS Teknologi Indonesia</strong>
          </p>
          <button className="btn-analyze" onClick={handleGenerate} disabled={loading}>
            {loading ? <><span className="spinner" /> Generating</> : 'Generate Plan'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-box">
          <div className="loading-ring" />
          <div className="loading-text"><strong>Generating</strong> — creating your daily plan...</div>
        </div>
      )}
      {error && <div className="error-box">{error}</div>}

      {result && (
        <div className="results anim-in">

          {/* Header */}
          <div className="score-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div className="score-left-label">Daily Plan</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--txt0)', letterSpacing: '-.3px', margin: '6px 0 4px' }}>
                  {result.tanggal}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{result.focus_hari_ini}</p>
              </div>
              {/* Progress circle */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: progressPct === 100 ? 'var(--green)' : 'var(--txt0)', lineHeight: 1 }}>
                  {progressPct}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt2)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {doneCount}/{totalCount} done
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, borderRadius: 99, background: 'var(--bg3)', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', borderRadius: 99, background: progressPct === 100 ? 'var(--green)' : 'var(--accent)', width: `${progressPct}%`, transition: 'width .4s ease' }} />
            </div>

            <p style={{ fontSize: 13, color: 'var(--txt1)', lineHeight: 1.7 }}>{result.summary}</p>
          </div>

          {/* Task List */}
          <div className="card">
            <div className="card-head">
              <div className="card-head-left"><span className="card-title">Schedule</span></div>
              <span style={{ fontSize: 11, color: 'var(--txt2)' }}>Click to mark done</span>
            </div>
            <div style={{ padding: 0 }}>
              {result.tasks.map((task, i) => (
                <div
                  key={i}
                  onClick={() => toggleDone(i)}
                  style={{
                    display: 'flex', gap: 14, padding: '14px 18px',
                    borderBottom: i < result.tasks.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    opacity: done.has(i) ? 0.4 : 1,
                    background: done.has(i) ? 'var(--bg0)' : 'transparent',
                    transition: 'all .2s',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: `1.5px solid ${done.has(i) ? 'var(--green)' : 'var(--border-strong)'}`,
                      background: done.has(i) ? 'var(--green)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .15s',
                    }}>
                      {done.has(i) && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{ flexShrink: 0, width: 44 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: done.has(i) ? 'var(--txt2)' : 'var(--txt0)', fontVariantNumeric: 'tabular-nums' }}>
                      {task.waktu}
                    </span>
                    <div style={{ fontSize: 10, color: 'var(--txt2)', marginTop: 2 }}>{task.durasi}</div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: done.has(i) ? 'var(--txt2)' : 'var(--txt0)', textDecoration: done.has(i) ? 'line-through' : 'none' }}>
                        {task.aktivitas}
                      </span>
                      <PriorityBadge p={task.prioritas} />
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--bg3)', color: KATEGORI_COLOR[task.kategori] ?? 'var(--txt2)', fontWeight: 600, letterSpacing: '.03em' }}>
                        {task.kategori}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--txt1)', lineHeight: 1.55 }}>{task.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reminders + Tips */}
          <div className="two-col">
            {result.reminder?.length > 0 && (
              <div className="card">
                <div className="card-head"><div className="card-head-left"><span className="card-title">Reminders</span></div></div>
                <div className="card-body">
                  <ul className="swot-list">
                    {result.reminder.map((r, i) => (
                      <li key={i} className="swot-item" style={{ color: 'var(--txt1)' }}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {result.tips_hari_ini && (
              <div className="card">
                <div className="card-head"><div className="card-head-left"><span className="card-title">Tip of the Day</span></div></div>
                <div className="card-body">
                  <div className="refined-block" style={{ fontSize: 13, fontStyle: 'italic' }}>
                    {result.tips_hari_ini}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="result-actions">
            <button className="btn-action" onClick={handleCopy}>Copy</button>
            <button className="btn-action" onClick={() => { setResult(null); setContext(''); setDone(new Set()) }}>Reset</button>
          </div>
          {toast && <div className="toast">{toast}</div>}
        </div>
      )}
    </div>
  )
}
