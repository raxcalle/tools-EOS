'use client'
import type { HistoryItem } from '@/lib/types'

function cls(n: number) { return n >= 70 ? 'high' : n >= 45 ? 'mid' : 'low' }

export default function HistoryPanel({
  history, onLoad, onClear,
}: { history: HistoryItem[]; onLoad: (i: HistoryItem) => void; onClear: () => void }) {
  return (
    <div className="history">
      <div className="history-header">
        <span className="history-title">History {history.length > 0 && `(${history.length})`}</span>
        {history.length > 0 && (
          <button className="btn-clear" onClick={() => { if (confirm('Clear all history?')) onClear() }}>
            Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="history-empty">No analysis history yet</div>
      ) : (
        <div className="history-list">
          {history.map((item, i) => {
            const s = item.parsed?.overall_score ?? 0
            const c = cls(s)
            const date = new Date(item.timestamp).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })
            return (
              <button key={i} className="history-item" onClick={() => onLoad(item)}>
                <span className={`history-score color-${c}`}>{s}</span>
                <div className="history-meta">
                  <div className="history-meta-idea">{item.idea}</div>
                  <div className="history-meta-date">{date} · {item.parsed?.verdict}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
