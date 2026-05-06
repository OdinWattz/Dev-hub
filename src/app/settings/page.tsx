'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Eye, EyeOff, Trash2, CheckCircle, Download, Upload, AlertTriangle } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/components/LanguageProvider'
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
  const { language } = useLanguage()
  const [values, setValues] = useState<Record<string, string>>({})
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [confirmClear, setConfirmClear] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

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
    toast.success(language === 'nl' ? 'Opgeslagen' : 'Saved')
    setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 2000)
  }

  const clear = (key: string) => {
    localStorage.removeItem(key)
    setValues(prev => ({ ...prev, [key]: '' }))
    toast.success(language === 'nl' ? 'Verwijderd' : 'Removed')
  }

  const DATA_KEYS = ['devhub-snippets', 'devhub-notes', 'devhub-todos', 'chat_messages']

  const exportAll = () => {
    const data: Record<string, unknown> = {}
    for (const s of SETTINGS) {
      const v = localStorage.getItem(s.key)
      if (v) data[s.key] = v
    }
    for (const k of DATA_KEYS) {
      const v = localStorage.getItem(k)
      if (v) { try { data[k] = JSON.parse(v) } catch { data[k] = v } }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devhub-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(language === 'nl' ? 'Backup gedownload!' : 'Backup downloaded!')
  }

  const importAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Record<string, unknown>
        for (const [k, v] of Object.entries(data)) {
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
        }
        const loaded: Record<string, string> = {}
        for (const s of SETTINGS) { loaded[s.key] = localStorage.getItem(s.key) ?? '' }
        setValues(loaded)
        toast.success(language === 'nl' ? 'Backup hersteld! Herlaad de pagina om alles te zien.' : 'Backup restored! Reload the page to refresh all data.')
      } catch { toast.error(language === 'nl' ? 'Ongeldig backupbestand' : 'Invalid backup file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const clearAllData = () => {
    for (const k of DATA_KEYS) localStorage.removeItem(k)
    for (const s of SETTINGS) localStorage.removeItem(s.key)
    setValues({})
    setConfirmClear(false)
    toast.success(language === 'nl' ? 'Alle data gewist' : 'All data cleared')
  }

  const copy = {
    title: language === 'nl' ? '⚙️ Instellingen' : '⚙️ Settings',
    subtitle: language === 'nl' ? 'API-sleutels, taal en voorkeuren — alles wordt lokaal opgeslagen in je browser' : 'API keys, language and preferences — everything is stored locally in your browser',
    languageTitle: language === 'nl' ? 'Taal' : 'Language',
    languageDesc: language === 'nl' ? 'Kies of DevHub standaard Engels of Nederlands toont. Engels is de hoofdtaal.' : 'Choose whether DevHub shows English or Dutch by default. English is the primary language.',
    newBackup: language === 'nl' ? 'Backup & Herstel' : 'Backup & Restore',
    dangerDesc: language === 'nl' ? 'Wis alle opgeslagen data uit deze app (snippets, notities, taken, chat, API keys). Dit kan niet ongedaan gemaakt worden.' : 'Delete all saved data from this app (snippets, notes, tasks, chat, API keys). This cannot be undone.',
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="page-title">{copy.title}</h1>
        <p className="page-subtitle">{copy.subtitle}</p>
      </div>

      <div className="space-y-4">
        <div className="card space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">{copy.languageTitle}</p>
            <p className="text-xs text-slate-500 mt-0.5">{copy.languageDesc}</p>
          </div>
          <LanguageSwitcher />
        </div>

        {SETTINGS.map(s => (
          <div key={s.key} className="card space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-200">{s.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {s.key === 'groq_api_key'
                  ? (language === 'nl' ? 'Gebruikt voor de AI Chat in de API Explorer. Gratis account, geen creditcard nodig.' : 'Used for AI Chat in the API Explorer. Free account, no credit card required.')
                  : (language === 'nl' ? 'Verhoogt de GitHub API rate limit van 60 naar 5000 requests/uur. Scope: public_repo (alleen lezen).' : 'Raises the GitHub API rate limit from 60 to 5000 requests/hour. Scope: public_repo (read-only).')}
              </p>
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
                  ? <><CheckCircle size={13} className="text-green-400" /> {language === 'nl' ? 'Opgeslagen' : 'Saved'}</>
                  : <><Save size={13} /> {language === 'nl' ? 'Opslaan' : 'Save'}</>
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
                {language === 'nl' ? 'Sleutel aanwezig' : 'Key detected'} ({values[s.key].slice(0, 6)}••••)
              </p>
            )}
          </div>
        ))}

        {/* Info card */}
        <div className="card border-slate-700/20 bg-transparent">
          <p className="text-xs text-slate-600">
            {language === 'nl'
              ? '🔒 Keys worden uitsluitend opgeslagen in '
              : '🔒 Keys are stored only in '}
            <code className="text-slate-500">localStorage</code>
            {language === 'nl'
              ? ' van je browser. Ze verlaten je apparaat alleen wanneer jij een API-call maakt, direct naar de betreffende service.'
              : ' in your browser. They only leave your device when you make an API call directly to the target service.'}
          </p>
        </div>

        {/* Backup / Restore */}
        <div className="card space-y-3">
          <p className="text-sm font-semibold text-slate-200">{copy.newBackup}</p>
          <p className="text-xs text-slate-500">{language === 'nl' ? 'Exporteer al je snippets, notities, taken en instellingen naar één JSON-bestand. Ideaal voor back-up of overzetten naar een andere browser.' : 'Export all your snippets, notes, tasks and settings to a single JSON file. Ideal for backup or moving to another browser.'}</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportAll} className="btn-primary gap-1.5">
              <Download size={13} /> {language === 'nl' ? 'Exporteer alles' : 'Export all'}
            </button>
            <button onClick={() => importRef.current?.click()} className="btn-ghost gap-1.5">
              <Upload size={13} /> {language === 'nl' ? 'Importeer backup' : 'Import backup'}
            </button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importAll} />
          </div>
        </div>

        {/* Danger zone */}
        <div className="card border-red-500/20 space-y-3">
          <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle size={14} /> Danger Zone
          </p>
          <p className="text-xs text-slate-500">{copy.dangerDesc}</p>
          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)} className="btn-ghost text-red-400 border-red-500/20 hover:bg-red-500/10 text-xs gap-1.5">
              <Trash2 size={12} /> {language === 'nl' ? 'Wis alle data' : 'Clear all data'}
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-red-400">{language === 'nl' ? 'Weet je het zeker?' : 'Are you sure?'}</span>
              <button onClick={clearAllData} className="btn-ghost text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs">{language === 'nl' ? 'Ja, wis alles' : 'Yes, clear everything'}</button>
              <button onClick={() => setConfirmClear(false)} className="btn-ghost text-xs">{language === 'nl' ? 'Annuleren' : 'Cancel'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
