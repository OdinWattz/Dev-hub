'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Copy, Search, Code2, ChevronDown, Eye, EyeOff, Star, Pencil, Layers, Download, Upload, X, BarChart2 } from 'lucide-react'
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
  pinned?: boolean
  tags?: string[]
}

const LANGUAGES = [
  // Web / Frontend
  'html', 'css', 'scss', 'sass', 'less', 'javascript', 'typescript', 'jsx', 'tsx',
  // Backend
  'python', 'php', 'java', 'csharp', 'go', 'rust', 'ruby', 'scala', 'kotlin', 'swift',
  'cpp', 'c', 'objectivec', 'vbnet', 'fsharp', 'groovy', 'perl',
  // Functional / Other
  'haskell', 'elixir', 'erlang', 'clojure', 'ocaml', 'dart', 'lua', 'r', 'julia',
  'nim', 'zig', 'crystal', 'solidity',
  // Shell / Scripting
  'bash', 'shell', 'powershell', 'batch',
  // Data / Config
  'sql', 'json', 'yaml', 'toml', 'xml', 'ini', 'csv', 'graphql', 'protobuf',
  // DevOps / Infra
  'dockerfile', 'nginx', 'makefile', 'latex', 'wasm',
  // Misc
  'diff', 'regex', 'markdown', 'matlab',
]

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', code: '', language: 'typescript', description: '', tags: '' })
  const [previews, setPreviews] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', code: '', language: 'typescript', description: '', tags: '' })
  const [filterLang, setFilterLang] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az'>('newest')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const importRef = useRef<HTMLInputElement>(null)

  const PREVIEWABLE = new Set(['html', 'css', 'javascript', 'jsx', 'tsx', 'json', 'xml', 'csv', 'sql', 'markdown', 'mdx'])

  const togglePreview = (id: string) => {
    setPreviews(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const buildPreview = (language: string, code: string): string => {
    if (language === 'css') {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0d1117;color:#e0e0e0;font-family:sans-serif;padding:1.5rem}${code}</style></head><body><h1>Heading 1</h1><h2>Heading 2</h2><p>Paragraph with <a href="#">a link</a>.</p><button>Button</button><div class="box">A div.box</div><ul><li>List item 1</li><li>List item 2</li></ul></body></html>`
    }
    if (language === 'javascript' || language === 'jsx' || language === 'tsx') {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0d1117;color:#e0e0e0;font-family:monospace;padding:1rem}</style></head><body><script>${code}<\/script></body></html>`
    }
    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    const base = `background:#0d1117;color:#e0e0e0;font-family:monospace;font-size:13px;padding:1rem;margin:0`
    if (language === 'json') {
      let out: string
      try { out = esc(JSON.stringify(JSON.parse(code), null, 2)) }
      catch (e) { out = `<span style="color:#f97316">Invalid JSON: ${esc(String(e))}</span>` }
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="${base}"><pre style="white-space:pre-wrap;word-break:break-all">${out}</pre></body></html>`
    }
    if (language === 'xml') {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="${base}"><pre style="white-space:pre-wrap;word-break:break-all">${esc(code)}</pre></body></html>`
    }
    if (language === 'csv') {
      const rows = code.trim().split('\n').map(r => r.split(',').map(c => c.trim()))
      const thead = rows[0]?.map(h => `<th style="padding:6px 12px;border:1px solid #334155;background:#1e293b;color:#94a3b8;text-align:left">${esc(h)}</th>`).join('') ?? ''
      const tbody = rows.slice(1).map(r =>
        `<tr>${r.map(c => `<td style="padding:5px 12px;border:1px solid #1e293b;color:#e0e0e0">${esc(c)}</td>`).join('')}</tr>`
      ).join('')
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#0d1117;padding:1rem;font-family:monospace;font-size:13px"><table style="border-collapse:collapse;width:100%"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></body></html>`
    }
    if (language === 'sql') {
      const highlighted = esc(code).replace(
        /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|COLUMN|INDEX|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|DISTINCT|AND|OR|NOT|NULL|IS|IN|LIKE|BETWEEN|CASE|WHEN|THEN|ELSE|END|BEGIN|COMMIT|ROLLBACK|WITH|UNION|ALL|EXISTS|RETURNING)\b/gi,
        m => `<span style="color:#60a5fa;font-weight:bold">${m}</span>`
      )
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="${base}"><pre style="white-space:pre-wrap">${highlighted}</pre></body></html>`
    }
    if (language === 'markdown' || language === 'mdx') {
      const md = esc(code)
        .replace(/^#{4}\s(.+)$/gm, '<h4 style="color:#e2e8f0">$1</h4>')
        .replace(/^#{3}\s(.+)$/gm, '<h3 style="color:#e2e8f0">$1</h3>')
        .replace(/^#{2}\s(.+)$/gm, '<h2 style="color:#f1f5f9">$1</h2>')
        .replace(/^#\s(.+)$/gm, '<h1 style="color:#f8fafc">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em style="color:#a5b4fc">$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7dd3fc">$1</code>')
        .replace(/^-\s(.+)$/gm, '<li style="margin:2px 0">$1</li>')
        .replace(/^&gt;\s(.+)$/gm, '<blockquote style="border-left:3px solid #334155;margin:4px 0;padding-left:12px;color:#94a3b8">$1</blockquote>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#38bdf8">$1</a>')
        .replace(/\n/g, '<br>')
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#0d1117;color:#e0e0e0;font-family:sans-serif;font-size:14px;padding:1.5rem;line-height:1.6">${md}</body></html>`
    }
    // html: use as-is, supports embedded <style> and <script>
    return code
  }

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
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    save([{ ...form, tags, id: crypto.randomUUID(), createdAt: Date.now() }, ...snippets])
    setForm({ title: '', code: '', language: 'typescript', description: '', tags: '' })
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

  const togglePin = (id: string) => {
    save(snippets.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s))
  }

  const duplicate = (snippet: Snippet) => {
    save([{ ...snippet, id: crypto.randomUUID(), title: `${snippet.title} (copy)`, pinned: false, createdAt: Date.now() }, ...snippets])
    toast.success('Snippet duplicated!')
  }

  const startEdit = (snippet: Snippet) => {
    setEditing(snippet.id)
    setEditForm({ title: snippet.title, code: snippet.code, language: snippet.language, description: snippet.description, tags: (snippet.tags ?? []).join(', ') })
  }

  const updateSnippet = (id: string) => {
    if (!editForm.title.trim() || !editForm.code.trim()) { toast.error('Title and code are required'); return }
    const tags = editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    save(snippets.map(s => s.id === id ? { ...s, ...editForm, tags } : s))
    setEditing(null)
    toast.success('Snippet updated!')
  }

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snippets-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }

  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as Snippet[]
        const merged = [...snippets]
        let count = 0
        for (const s of imported) {
          if (!merged.find(x => x.id === s.id)) { merged.push(s); count++ }
        }
        save(merged)
        toast.success(`Imported ${count} snippet${count !== 1 ? 's' : ''}!`)
      } catch { toast.error('Invalid JSON file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const usedLangs = Array.from(new Set(snippets.map(s => s.language))).sort()

  const filtered = snippets
    .filter(s =>
      (filterLang === 'all' || s.language === filterLang) &&
      (s.title.toLowerCase().includes(search.toLowerCase()) ||
       s.language.toLowerCase().includes(search.toLowerCase()) ||
       s.description.toLowerCase().includes(search.toLowerCase()) ||
       (s.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase())))
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      if (sortBy === 'newest') return b.createdAt - a.createdAt
      if (sortBy === 'oldest') return a.createdAt - b.createdAt
      return a.title.localeCompare(b.title)
    })

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">🧩 Snippets</h1>
        <p className="page-subtitle">Save & reuse code fragments instantly</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="input !pl-10"
            placeholder="Search snippets… (title, language, tag)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setAdding(!adding)} className="btn-primary">
          <Plus size={14} /> New Snippet
        </button>
      </div>

      {/* Secondary toolbar */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <div className="relative">
          <select className="input text-xs appearance-none pr-6 cursor-pointer" value={filterLang} onChange={e => setFilterLang(e.target.value)}>
            <option value="all">All languages</option>
            {usedLangs.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="input text-xs appearance-none pr-6 cursor-pointer" value={sortBy} onChange={e => setSortBy(e.target.value as 'newest' | 'oldest' | 'az')}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A – Z</option>
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
        <span className="text-[10px] text-slate-600 ml-1">{filtered.length} snippet{filtered.length !== 1 ? 's' : ''}</span>
        <div className="flex-1" />
        <button onClick={exportAll} className="btn-ghost text-xs gap-1.5" title="Export all snippets as JSON">
          <Download size={12} /> Export
        </button>
        <button onClick={() => importRef.current?.click()} className="btn-ghost text-xs gap-1.5" title="Import snippets from JSON">
          <Upload size={12} /> Import
        </button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importFile} />
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
          <input
            className="input"
            placeholder="Tags (comma-separated, e.g. auth, utils)…"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
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
          <div key={snippet.id} className={`card group ${snippet.pinned ? 'border-yellow-500/20' : ''}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2 min-w-0">
                {snippet.pinned && <Star size={11} className="text-yellow-400 fill-yellow-400 shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight">{snippet.title}</h3>
                  {snippet.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{snippet.description}</p>
                  )}
                  {(snippet.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(snippet.tags ?? []).map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                <span className="tag bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px]">
                  {snippet.language}
                </span>
                <button onClick={() => togglePin(snippet.id)} className={`btn-ghost py-1 px-1.5 ${snippet.pinned ? 'text-yellow-400' : ''}`} title={snippet.pinned ? 'Unpin' : 'Pin'}>
                  <Star size={11} className={snippet.pinned ? 'fill-yellow-400' : ''} />
                </button>
                {PREVIEWABLE.has(snippet.language) && (
                  <button onClick={() => togglePreview(snippet.id)} className={`btn-ghost py-1 px-1.5 ${previews.has(snippet.id) ? 'text-cyan-400' : ''}`} title="Live preview">
                    {previews.has(snippet.id) ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                )}
                <button onClick={() => toggleCollapse(snippet.id)} className="btn-ghost py-1 px-1.5" title={collapsed.has(snippet.id) ? 'Expand code' : 'Collapse code'}>
                  <BarChart2 size={11} className={collapsed.has(snippet.id) ? 'text-slate-600' : ''} />
                </button>
                <button onClick={() => startEdit(snippet)} className={`btn-ghost py-1 px-1.5 ${editing === snippet.id ? 'text-cyan-400' : ''}`} title="Edit">
                  <Pencil size={11} />
                </button>
                <button onClick={() => duplicate(snippet)} className="btn-ghost py-1 px-1.5" title="Duplicate">
                  <Layers size={11} />
                </button>
                <button onClick={() => copy(snippet.code)} className="btn-ghost py-1 px-1.5" title="Copy code">
                  <Copy size={11} />
                </button>
                <button onClick={() => remove(snippet.id)} className="text-slate-700 hover:text-red-400 transition-colors p-1" title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Code block */}
            {!collapsed.has(snippet.id) && (
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
            )}

            {/* Live preview */}
            {previews.has(snippet.id) && (
              <div className="mt-3 rounded-lg overflow-hidden border border-cyan-500/20">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/5 border-b border-cyan-500/20">
                  <Eye size={11} className="text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 font-medium">Live Preview</span>
                </div>
                <iframe
                  srcDoc={buildPreview(snippet.language, snippet.code)}
                  sandbox="allow-scripts"
                  className="w-full bg-white"
                  style={{ height: '260px', border: 'none' }}
                  title="preview"
                />
              </div>
            )}

            {/* Inline edit form */}
            {editing === snippet.id && (
              <div className="mt-3 space-y-2 border-t border-slate-700/50 pt-3">
                <div className="flex items-center justify-between">
                  <p className="section-label">Edit Snippet</p>
                  <button onClick={() => setEditing(null)} className="text-slate-600 hover:text-slate-400"><X size={13} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input text-xs" placeholder="Title…" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                  <div className="relative">
                    <select className="input text-xs appearance-none pr-6 cursor-pointer" value={editForm.language} onChange={e => setEditForm(f => ({ ...f, language: e.target.value }))}>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <input className="input text-xs" placeholder="Description…" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                <input className="input text-xs" placeholder="Tags (comma-separated)…" value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))} />
                <textarea className="input font-mono text-xs min-h-[120px] resize-y" value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} />
                <div className="flex gap-2">
                  <button onClick={() => updateSnippet(snippet.id)} className="btn-primary text-xs py-1">Save changes</button>
                  <button onClick={() => setEditing(null)} className="btn-ghost text-xs py-1">Cancel</button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-700">
                {snippet.code.split('\n').length} lines · {snippet.code.length} chars
              </span>
              <span className="text-[10px] text-slate-700">{new Date(snippet.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
