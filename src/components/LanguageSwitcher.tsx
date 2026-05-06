'use client'

import { Languages } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage()

  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'rounded-lg border border-slate-700/40 bg-slate-900/70 p-1'}`}>
      {!compact && <Languages size={13} className="text-cyan-400" />}
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded text-xs transition-all ${language === 'en' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
        aria-pressed={language === 'en'}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('nl')}
        className={`px-2 py-1 rounded text-xs transition-all ${language === 'nl' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
        aria-pressed={language === 'nl'}
      >
        NL
      </button>
    </div>
  )
}
