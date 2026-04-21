'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Copy, Search, Code2, ChevronDown } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import toast from 'react-hot-toast'

type Snippet = {
  id: string
  title: string
  code: string
  language: string
  description: string
  createdAt: number
}

const LANGUAGES = [
  'typescript', 'javascript', 'python', 'bash', 'sql', 'json',
  'css', 'html', 'rust', 'go', 'java', 'csharp', 'yaml', 'markdown',
]

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', code: '', language: 'typescript', description: '' })

  useEffect(() => {
    const saved = localStorage.getItem('devhub-snippets')
    if (saved) setSnippets(JSON.parse(saved))
  }, [])

  const save = (next: Snippet[]) => {
    setSnippets(next)
    localStorage.setItem('devhub-snippets', JSON.stringify(next))
  }

  const add = () => {
    if (!form.title.trim() || !form.code.trim()) {
      toast.error('Title and code are required')
      return
    }
    save([{ ...form, id: crypto.randomUUID(), createdAt: Date.now() }, ...snippets])
    setForm({ title: '', code: '', language: 'typescript', description: '' })
    setAdding(false)
    toast.success('Snippet saved!')
  }

  const copy = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Copied to clipboard!')
  }

  const remove = (id: string) => {
    save(snippets.filter(s => s.id !== id))
    toast('Snippet removed', { icon: '🗑️' })
  }

  const filtered = snippets.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.language.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">🧩 Snippets</h1>
        <p className="page-subtitle">Save & reuse code fragments instantly</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="input !pl-10"
            placeholder="Search snippets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setAdding(!adding)} className="btn-primary">
          <Plus size={14} /> New Snippet
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="card mb-6 space-y-3 border-cyan-500/20">
          <p className="section-label">New Snippet</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Title…"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <div className="relative">
              <select
                className="input appearance-none pr-7 cursor-pointer"
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <input
            className="input"
            placeholder="Short description (optional)…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <textarea
            className="input font-mono text-xs min-h-[140px] resize-y"
            placeholder="Paste your code here…"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
          />
          <div className="flex gap-2">
            <button onClick={add} className="btn-primary">Save Snippet</button>
            <button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Snippets */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="card text-center py-12 text-slate-600">
            <Code2 size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{search ? 'No results found' : 'No snippets yet — save your first one!'}</p>
          </div>
        )}
        {filtered.map(snippet => (
          <div key={snippet.id} className="card group">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-white text-sm">{snippet.title}</h3>
                {snippet.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{snippet.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="tag bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px]">
                  {snippet.language}
                </span>
                <button onClick={() => copy(snippet.code)} className="btn-ghost py-1 px-2">
                  <Copy size={12} />
                </button>
                <button onClick={() => remove(snippet.id)} className="text-slate-700 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden border border-slate-700/50 text-xs">
              <SyntaxHighlighter
                language={snippet.language}
                style={vscDarkPlus}
                customStyle={{ margin: 0, background: '#0d1117', fontSize: '12px', maxHeight: '300px' }}
                showLineNumbers
              >
                {snippet.code}
              </SyntaxHighlighter>
            </div>
            <p className="text-[10px] text-slate-700 mt-2 text-right">
              {new Date(snippet.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
