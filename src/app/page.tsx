'use client'
import { useState, useRef } from 'react'
import Header from '@/components/Header'
import ApiKeyInput from '@/components/ApiKeyInput'
import IdeaForm from '@/components/IdeaForm'
import ResultPanel from '@/components/ResultPanel'
import HistoryPanel from '@/components/HistoryPanel'
import CompanyIntelTool from '@/components/CompanyIntel'
import PromptGen from '@/components/PromptGen'
import DailyPlan from '@/components/DailyPlan'
import ContentReview from '@/components/ContentReview'
import { useTheme } from '@/hooks/useTheme'
import { useHistory } from '@/hooks/useHistory'
import type { AnalysisResult, AnalyzeOptions, HistoryItem } from '@/lib/types'

type Tab = 'idea' | 'company' | 'promptgen' | 'dailyplan' | 'contentreview'

const TABS: { key: Tab; label: string }[] = [
  { key: 'idea',          label: 'Idea Analyzer'   },
  { key: 'company',       label: 'Company Intel'   },
  { key: 'promptgen',     label: 'Prompt Gen'      },
  { key: 'dailyplan',     label: 'Daily Plan'      },
  { key: 'contentreview', label: 'Content Review'  },
]

export default function Home() {
  const { theme, toggle } = useTheme()
  const { history, save, clear } = useHistory()
  const [tab, setTab] = useState<Tab>('idea')

  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [result, setResult]           = useState<AnalysisResult | null>(null)
  const [currentIdea, setCurrentIdea] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const handleAnalyze = async (idea: string, options: AnalyzeOptions) => {
    setError(null); setResult(null); setLoading(true); setCurrentIdea(idea)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, options }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setResult(data.result)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error.')
    } finally { setLoading(false) }
  }

  const handleLoadHistory = (item: HistoryItem) => {
    setTab('idea'); setCurrentIdea(item.idea); setResult(item.parsed)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }

  return (
    <div className="app">
      <Header theme={theme} onToggle={toggle} />

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Idea Analyzer */}
      {tab === 'idea' && (
        <>
          <IdeaForm onSubmit={handleAnalyze} loading={loading} />
          {loading && (
            <div className="loading-box">
              <div className="loading-ring" />
              <div className="loading-text"><strong>Analyzing</strong> — AI is evaluating your idea...</div>
            </div>
          )}
          {error && <div className="error-box">{error}</div>}
          {result && (
            <div ref={resultRef}>
              <ResultPanel result={result} idea={currentIdea}
                onReset={() => { setResult(null); setError(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                onSave={save}
              />
            </div>
          )}
          <HistoryPanel history={history} onLoad={handleLoadHistory} onClear={clear} />
        </>
      )}

      {tab === 'company'       && <CompanyIntelTool />}
      {tab === 'promptgen'     && <PromptGen />}
      {tab === 'dailyplan'     && <DailyPlan />}
      {tab === 'contentreview' && <ContentReview />}
    </div>
  )
}
