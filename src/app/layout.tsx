import type { Metadata, Viewport } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'DevHub — Developer Toolkit',
  description: 'Your personal developer dashboard',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#14b8a6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DevHub" />
      </head>
      <body className="grid-bg min-h-screen antialiased">
        <Sidebar />
        <main className="ml-56 min-h-screen p-6">
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0f1629',
                color: '#e2e8f0',
                border: '1px solid #1e2d3d',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
              },
            }}
          />
          {children}
        </main>
      </body>
    </html>
  )
}
