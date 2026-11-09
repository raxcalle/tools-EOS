'use client'
import { useState, useEffect } from 'react'

export default function ApiKeyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  const ok = value.length > 10

  useEffect(() => {
    const saved = localStorage.getItem('rax_key')
    if (saved && !value) onChange(saved)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    if (e.target.value) localStorage.setItem('rax_key', e.target.value)
  }

  return (
    <div className="api-bar">
      <span className="api-label">API Key</span>
      <div className="api-input-wrap">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={handle}
          placeholder="AIza..."
          className="api-input"
        />
        <button className="btn-show" onClick={() => setShow(s => !s)} tabIndex={-1}>
          {show ? 'hide' : 'show'}
        </button>
      </div>
      <span className={`api-badge ${ok ? 'ok' : 'bad'}`}>
        {ok ? 'Connected' : 'Not set'}
      </span>
    </div>
  )
}
