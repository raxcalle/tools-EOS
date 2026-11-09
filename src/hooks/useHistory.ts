'use client'

import { useState, useEffect } from 'react'
import type { HistoryItem } from '@/lib/types'

const STORAGE_KEY = 'raxidea_history'
const MAX_ITEMS = 20

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  const save = (item: HistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY)
    setHistory([])
  }

  return { history, save, clear }
}
