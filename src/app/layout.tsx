import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RaxIdea',
  description: 'Refine dan scoring ide kamu.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
