'use client'
import { useState, useRef, useCallback } from 'react'
import type { ContentReviewResult } from '@/app/api/contentreview/route'

const PLATFORMS = ['LinkedIn', 'Instagram', 'Twitter/X', 'Facebook', 'TikTok']
const CONTENT_TYPES = [
  'Post reguler', 'Infographic', 'Case study', 'Product launch',
  'Company update', 'Thought leadership', 'Event promotion', 'Testimonial / Review',
]

const SCORE_LABELS: Record<string, string> = {
  visual_quality:       'Visual Quality',
  relevance_b2b:        'B2B Relevance',
  engagement_potential: 'Engagement Potential',
  brand_alignment:      'Brand Alignment',
  copywriting:          'Copywriting',
}

function cls(n: number) { return n >= 70 ? 'high' : n >= 45 ? 'mid' : 'low' }

function ScoreBar({ label, value }: { label: string; value: number }) {
  const c = cls(value)
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className={`bar-fill ${c}`} style={{ width: `${value}%`, transition: 'width 1s ease' }} />
      </div>
      <span className="bar-val">{value}</span>
    </div>
  )
}

function FitBadge({ fit }: { fit: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    'Sangat Cocok': { bg: 'var(--green-soft)', color: 'var(--green)' },
    'Cocok':        { bg: 'var(--accent-soft)', color: 'var(--accent)' },
    'Kurang Cocok': { bg: 'var(--amber-soft)', color: 'var(--amber)' },
  }
  const style = cfg[fit] ?? cfg['Cocok']
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: style.bg, color: style.color, textTransform: 'uppercase', letterSpacing: '.04em' }}>
      {fit}
    </span>
  )
}

export default function ContentReview() {
  const [caption, setCaption]         = useState('')
  const [platform, setPlatform]       = useState(PLATFORMS[0])
  const [contentType, setContentType] = useState(CONTENT_TYPES[0])
  const [imageFile, setImageFile]     = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragging, setDragging]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [result, setResult]           = useState<ContentReviewResult | null>(null)
  const [toast, setToast]             = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fire = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('File harus berupa gambar.'); return }
    if (file.size > 4 * 1024 * 1024) { setError('Ukuran gambar maksimal 4MB.'); return }
    setError(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        res(result.split(',')[1])
      }
      reader.onerror = rej
      reader.readAsDataURL(file)
    })

  const handleReview = async () => {
    if (!caption.trim() && !imageFile) { setError('Isi caption atau upload gambar dulu.'); return }
    setError(null); setResult(null); setLoading(true)
    try {
      let imageBase64: string | undefined
      let imageMimeType: string | undefined
      if (imageFile) {
        imageBase64 = await toBase64(imageFile)
        imageMimeType = imageFile.type
      }
      const res = await fetch('/api/contentreview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, platform, contentType, imageBase64, imageMimeType }),
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
      `Content Review — EOS Teknologi Indonesia`,
      `Score: ${result.overall_score}/100 — ${result.verdict}`,
      `Platform: ${platform} | Type: ${contentType}`,
      '', result.summary,
      '', 'CAPTION SUGGESTION:', result.caption_suggestion,
      '', 'HASHTAGS:', result.hashtag_suggestion.join(' '),
      '', 'BEST TIME:', result.best_time_post,
    ].join('\n')
    await navigator.clipboard.writeText(txt)
    fire('Copied')
  }

  return (
    <div>
      <div className="form-card">
        {/* Platform + Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <div className="form-label-row" style={{ marginBottom: 8 }}>
              <span className="form-label">Platform</span>
            </div>
            <select value={platform} onChange={e => setPlatform(e.target.value)}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div className="form-label-row" style={{ marginBottom: 8 }}>
              <span className="form-label">Content Type</span>
            </div>
            <select value={contentType} onChange={e => setContentType(e.target.value)}>
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Image Upload */}
        <div className="form-label-row" style={{ marginBottom: 8 }}>
          <span className="form-label">Image <span style={{ color: 'var(--txt2)', textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(optional)</span></span>
          {imageFile && (
            <button onClick={() => { setImageFile(null); setImagePreview(null) }}
              style={{ fontSize: 11, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Remove
            </button>
          )}
        </div>

        {!imagePreview ? (
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragging ? 'var(--accent)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--r)',
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--accent-soft)' : 'var(--bg0)',
              transition: 'all .15s',
              marginBottom: 14,
            }}
          >
            <p style={{ fontSize: 13, color: 'var(--txt1)', fontWeight: 500 }}>Drop image here or click to upload</p>
            <p style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 4 }}>PNG, JPG, WEBP — max 4MB</p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>
        ) : (
          <div style={{ marginBottom: 14, borderRadius: 'var(--r)', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg0)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain', display: 'block' }} />
          </div>
        )}

        {/* Caption */}
        <div className="form-label-row" style={{ marginBottom: 8 }}>
          <span className="form-label">Caption / Copy <span style={{ color: 'var(--txt2)', textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(optional)</span></span>
          <span className="char-count">{caption.length} chars</span>
        </div>
        <textarea
          className="idea-input"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Paste your caption or post copy here..."
          rows={4}
        />

        <div className="form-footer" style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--txt2)' }}>
            Evaluated for <strong style={{ color: 'var(--txt1)', fontWeight: 600 }}>EOS Teknologi Indonesia B2B</strong>
          </p>
          <button className="btn-analyze" onClick={handleReview} disabled={loading || (!caption.trim() && !imageFile)}>
            {loading ? <><span className="spinner" /> Reviewing</> : 'Review Content'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-box">
          <div className="loading-ring" />
          <div className="loading-text"><strong>Reviewing</strong> — AI is evaluating your content...</div>
        </div>
      )}
      {error && <div className="error-box">{error}</div>}

      {result && (
        <div className="results anim-in">

          {/* Score Header */}
          <div className="score-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
              <div>
                <div className="score-left-label">Content Score</div>
                <span className={`verdict-pill color-${cls(result.overall_score)}`} style={{ marginTop: 8, display: 'inline-block' }}>
                  {result.verdict}
                </span>
              </div>
              <div className={`score-number color-${cls(result.overall_score)}`}>{result.overall_score}</div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--txt1)', lineHeight: 1.7, paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              {result.summary}
            </p>
            <div className="score-bars" style={{ paddingTop: 0, borderTop: 'none' }}>
              {Object.entries(result.scores).map(([k, v]) => (
                <ScoreBar key={k} label={SCORE_LABELS[k] || k} value={v} />
              ))}
            </div>
          </div>

          {/* Strengths + Weaknesses */}
          <div className="two-col">
            <div className="card">
              <div className="card-head"><div className="card-head-left"><span className="card-title">Strengths</span></div></div>
              <div className="card-body">
                <ul className="swot-list">
                  {result.kelebihan.map((k, i) => (
                    <li key={i} className="swot-item" style={{ color: 'var(--txt1)' }}
                      dangerouslySetInnerHTML={{ __html: k.replace(/^—\s*/, '') }} />
                  ))}
                </ul>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><div className="card-head-left"><span className="card-title">Weaknesses</span></div></div>
              <div className="card-body">
                <ul className="swot-list">
                  {result.kekurangan.map((k, i) => (
                    <li key={i} className="swot-item" style={{ color: 'var(--txt1)' }}>{k}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="card">
            <div className="card-head"><div className="card-head-left"><span className="card-title">Improvement Suggestions</span></div></div>
            <div className="card-body">
              <ul className="swot-list" style={{ gap: 10 }}>
                {result.saran_perbaikan.map((s, i) => (
                  <li key={i} className="swot-item" style={{ color: 'var(--txt1)', fontSize: 13 }}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Platform Fit */}
          <div className="card">
            <div className="card-head"><div className="card-head-left"><span className="card-title">Platform Fit</span></div></div>
            <div className="card-body" style={{ padding: 0 }}>
              {result.platform_recommendations.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < result.platform_recommendations.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt0)', width: 90, flexShrink: 0 }}>{p.platform}</span>
                  <FitBadge fit={p.fit} />
                  <span style={{ fontSize: 12, color: 'var(--txt1)', flex: 1 }}>{p.alasan}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Caption Suggestion */}
          <div className="card">
            <div className="card-head" style={{ justifyContent: 'space-between' }}>
              <div className="card-head-left"><span className="card-title">Suggested Caption</span></div>
              <button className="btn-action" onClick={() => { navigator.clipboard.writeText(result.caption_suggestion); fire('Caption copied') }} style={{ padding: '4px 10px', fontSize: 11 }}>
                Copy
              </button>
            </div>
            <div className="card-body">
              <div className="refined-block" style={{ fontSize: 13, lineHeight: 1.8 }}>{result.caption_suggestion}</div>
            </div>
          </div>

          {/* Hashtags + Timing */}
          <div className="two-col">
            <div className="card">
              <div className="card-head" style={{ justifyContent: 'space-between' }}>
                <div className="card-head-left"><span className="card-title">Hashtags</span></div>
                <button className="btn-action" onClick={() => { navigator.clipboard.writeText(result.hashtag_suggestion.join(' ')); fire('Hashtags copied') }} style={{ padding: '4px 10px', fontSize: 11 }}>
                  Copy
                </button>
              </div>
              <div className="card-body">
                <div className="tags">
                  {result.hashtag_suggestion.map((h, i) => (
                    <span key={i} className="tag" style={{ cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(h); fire('Copied') }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><div className="card-head-left"><span className="card-title">Best Time to Post</span></div></div>
              <div className="card-body">
                <p style={{ fontSize: 13, color: 'var(--txt0)', lineHeight: 1.7 }}>{result.best_time_post}</p>
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button className="btn-action" onClick={handleCopy}>Copy Report</button>
            <button className="btn-action" onClick={() => { setResult(null); setCaption(''); setImageFile(null); setImagePreview(null) }}>Reset</button>
          </div>
          {toast && <div className="toast">{toast}</div>}
        </div>
      )}
    </div>
  )
}
