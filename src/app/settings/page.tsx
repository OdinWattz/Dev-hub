'use client'

import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type Setting = {
  key: string
  label: string
  placeholder: string
  desc: string
  link?: { label: string; url: string }
  secret?: boolean
}

const SETTINGS: Setting[] = [
  {
    key: 'groq_api_key',
    label: 'Groq API Key',
    placeholder: 'gsk_...',
    desc: 'Gebruikt voor de AI Chat in de API Explorer. Gratis account, geen creditcard nodig.',
    link: { label: 'console.groq.com → API Keys', url: 'https://console.groq.com' },
    secret: true,
  },
  {
    key: 'github_token',
    label: 'GitHub Personal Access Token (optioneel)',
    placeholder: 'ghp_...',
    desc: 'Verhoogt de GitHub API rate limit van 60 naar 5000 requests/uur. Scope: public_repo (read-only).',
    link: { label: 'github.com → Settings → Developer Settings → Tokens', url: 'https://github.com/settings/tokens/new?scopes=public_repo&description=DevHub' },
    secret: true,
  },
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loaded: Record<string, string> = {}
    for (const s of SETTINGS) {
      loaded[s.key] = localStorage.getItem(s.key) ?? ''
    }
    setValues(loaded)
  }, [])

  const save = (key: string) => {
    const val = values[key]?.trim() ?? ''
    if (val) {
      localStorage.setItem(key, val)
    } else {
      localStorage.removeItem(key)
    }
    setSaved(prev => ({ ...prev, [key]: true }))
    toast.success('Opgeslagen')
    setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 2000)
  }

  const clear = (key: string) => {
    localStorage.removeItem(key)
    setValues(prev => ({ ...prev, [key]: '' }))
    toast.success('Verwijderd')
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="page-title">⚙️ Settings</h1>
        <p className="page-subtitle">API keys en voorkeuren — alles wordt lokaal opgeslagen in je browser</p>
      </div>

      <div className="space-y-4">
        {SETTINGS.map(s => (
          <div key={s.key} className="card space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-200">{s.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              {s.link && (
                <a href={s.link.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-cyan-500 hover:text-cyan-300 mt-0.5 inline-block">
                  ↗ {s.link.label}
                </a>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={s.secret && !show[s.key] ? 'password' : 'text'}
                  className="input !pr-9"
                  placeholder={s.placeholder}
                  value={values[s.key] ?? ''}
                  onChange={e => setValues(prev => ({ ...prev, [s.key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && save(s.key)}
                />
                {s.secret && (
                  <button
                    onClick={() => setShow(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {show[s.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
              </div>

              <button onClick={() => save(s.key)} className="btn-primary">
                {saved[s.key]
                  ? <><CheckCircle size={13} className="text-green-400" /> Opgeslagen</>
                  : <><Save size={13} /> Opslaan</>
                }
              </button>

              {values[s.key] && (
                <button onClick={() => clear(s.key)} className="btn-danger">
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {values[s.key] && (
              <p className="text-[10px] text-green-500/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Key aanwezig ({values[s.key].slice(0, 6)}••••)
              </p>
            )}
          </div>
        ))}

        {/* Info card */}
        <div className="card border-slate-700/20 bg-transparent">
          <p className="text-xs text-slate-600">
            🔒 Keys worden uitsluitend opgeslagen in <code className="text-slate-500">localStorage</code> van je browser.
            Ze verlaten je apparaat alleen wanneer jij een API call maakt — direct naar de betreffende service.
          </p>
        </div>
      </div>
    </div>
  )
}
