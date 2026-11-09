'use client'
import type { Theme } from '@/hooks/useTheme'

function LogoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z"
        fill="white" stroke="white" strokeWidth=".5" strokeLinejoin="round"/>
    </svg>
  )
}

export default function Header({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <header className="header">
      <div className="logo">
        <div className="logo-mark">
          <LogoIcon />
        </div>
        <div>
          <div className="logo-name">RaxIdea</div>
          <div className="logo-sub">Idea refinement &amp; intelligence</div>
        </div>
      </div>
      <button className="btn-theme" onClick={onToggle}>
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </button>
    </header>
  )
}
