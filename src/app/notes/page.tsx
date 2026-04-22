'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, X, Search, FileText, Star, Copy, ChevronDown, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

type Note = {
  id: string
  title: string
  content: string
  category: string
  color: string
  updatedAt: number
  pinned?: boolean
}

const COLORS = [
  { name: 'cyan',   border: 'border-cyan-500/30',   bg: 'bg-cyan-500/5',   dot: 'bg-cyan-400'   },
  { name: 'purple', border: 'border-purple-500/30',  bg: 'bg-purple-500/5', dot: 'bg-purple-400' },
  { name: 'green',  border: 'border-green-500/30',   bg: 'bg-green-500/5',  dot: 'bg-green-400'  },
  { name: 'yellow', border: 'border-yellow-500/30',  bg: 'bg-yellow-500/5', dot: 'bg-yellow-400' },
  { name: 'red',    border: 'border-red-500/30',     bg: 'bg-red-500/5',    dot: 'bg-red-400'    },
]

const CATEGORIES = ['general', 'cheatsheet', 'architecture', 'commands', 'links', 'ideas']

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: 'general', color: 'cyan' })
  const [filterCat, setFilterCat] = useState('all')
  const [mdPreviews, setMdPreviews] = useState<Set<string>>(new Set())

  const toggleMdPreview = (id: string) =>
    setMdPreviews(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const renderMd = (text: string): string => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return esc(text)
      .replace(/^#{4}\s(.+)$/gm, '<h4 class="text-slate-200 font-semibold text-sm mt-2">$1</h4>')
      .replace(/^#{3}\s(.+)$/gm, '<h3 class="text-slate-100 font-semibold text-sm mt-2">$1</h3>')
      .replace(/^#{2}\s(.+)$/gm, '<h2 class="text-slate-100 font-semibold mt-2">$1</h2>')
      .replace(/^#\s(.+)$/gm, '<h1 class="text-white font-bold mt-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-slate-300">$1</em>')
      .replace(/~~(.+?)~~/g, '<del class="text-slate-500">$1</del>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-1 py-0.5 rounded text-cyan-300 text-[11px] font-mono">$1</code>')
      .replace(/^-\s(.+)$/gm, '<li class="ml-3 text-slate-400 list-disc">$1</li>')
      .replace(/^\d+\.\s(.+)$/gm, '<li class="ml-3 text-slate-400 list-decimal">$1</li>')
      .replace(/^&gt;\s(.+)$/gm, '<blockquote class="border-l-2 border-slate-600 pl-3 text-slate-500 italic">$1</blockquote>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-cyan-400 underline" target="_blank">$1</a>')
      .replace(/\n/g, '<br>')
  }

  useEffect(() => {
    const saved = localStorage.getItem('devhub-notes')
    if (saved) setNotes(JSON.parse(saved))
  }, [])

  const persist = (next: Note[]) => {
    setNotes(next)
    localStorage.setItem('devhub-notes', JSON.stringify(next))
  }

  const create = () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    const note: Note = { ...form, id: crypto.randomUUID(), updatedAt: Date.now() }
    persist([note, ...notes])
    setForm({ title: '', content: '', category: 'general', color: 'cyan' })
    setCreating(false)
    toast.success('Note created!')
  }

  const update = (id: string, patch: Partial<Note>) => {
    persist(notes.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    toast.success('Saved')
  }

  const remove = (id: string) => {
    persist(notes.filter(n => n.id !== id))
    toast('Note removed', { icon: '🗑️' })
  }

  const togglePin = (id: string) => {
    persist(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))
  }

  const copyNote = (note: Note) => {
    navigator.clipboard.writeText(`# ${note.title}\n\n${note.content}`)
    toast.success('Copied to clipboard!')
  }

  const filtered = notes
    .filter(n =>
      (filterCat === 'all' || n.category === filterCat) &&
      (n.title.toLowerCase().includes(search.toLowerCase()) ||
       n.content.toLowerCase().includes(search.toLowerCase()) ||
       n.category.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.updatedAt - a.updatedAt
    })

  const wordCount = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="page-title">📝 Notes</h1>
        <p className="page-subtitle">Quick notes, cheatsheets & references</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="input !pl-10"
            placeholder="Search notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setCreating(!creating)} className="btn-primary">
          <Plus size={14} /> New Note
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <div className="relative">
          <select className="input text-xs appearance-none pr-6 cursor-pointer" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
        <span className="text-[10px] text-slate-600">{filtered.length} note{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card mb-6 border-cyan-500/20 space-y-3">
          <p className="section-label">New Note</p>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="input col-span-2"
              placeholder="Title…"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <select
              className="input appearance-none cursor-pointer"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Color picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Color:</span>
            {COLORS.map(c => (
              <button
                key={c.name}
                onClick={() => setForm(f => ({ ...f, color: c.name }))}
                className={`w-5 h-5 rounded-full ${c.dot} ${form.color === c.name ? 'ring-2 ring-white/40 ring-offset-1 ring-offset-slate-900' : ''}`}
              />
            ))}
          </div>
          <textarea
            className="input font-mono text-xs min-h-[120px] resize-y"
            placeholder="Write your note, cheatsheet, or reference…"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          />
          <div className="flex gap-2">
            <button onClick={create} className="btn-primary">Create Note</button>
            <button onClick={() => setCreating(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Notes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 card text-center py-12 text-slate-600">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{search ? 'No results' : 'No notes yet'}</p>
          </div>
        )}
        {filtered.map(note => {
          const color = COLORS.find(c => c.name === note.color) ?? COLORS[0]
          const isEditing = editing === note.id
          return (
            <div key={note.id} className={`card ${color.bg} ${color.border} flex flex-col group ${note.pinned ? 'ring-1 ring-yellow-500/20' : ''}`}>
              {isEditing ? (
                <EditNote note={note} onSave={(patch) => { update(note.id, patch); setEditing(null) }} onCancel={() => setEditing(null)} />
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-1.5 min-w-0">
                      {note.pinned && <Star size={10} className="text-yellow-400 fill-yellow-400 mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-sm">{note.title}</h3>
                        <span className="tag bg-slate-700/50 text-slate-400 border border-slate-700 mt-1 text-[10px]">
                          {note.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                      <button onClick={() => togglePin(note.id)} className={`btn-ghost py-0.5 px-1.5 ${note.pinned ? 'text-yellow-400' : ''}`} title={note.pinned ? 'Unpin' : 'Pin'}>
                        <Star size={10} className={note.pinned ? 'fill-yellow-400' : ''} />
                      </button>
                      <button onClick={() => toggleMdPreview(note.id)} className={`btn-ghost py-0.5 px-1.5 ${mdPreviews.has(note.id) ? 'text-cyan-400' : ''}`} title="Toggle markdown preview">
                        <BookOpen size={10} />
                      </button>
                      <button onClick={() => copyNote(note)} className="btn-ghost py-0.5 px-1.5" title="Copy">
                        <Copy size={10} />
                      </button>
                      <button onClick={() => setEditing(note.id)} className="btn-ghost py-0.5 px-1.5">
                        <Edit3 size={10} />
                      </button>
                      <button onClick={() => remove(note.id)} className="text-slate-700 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                  {mdPreviews.has(note.id) ? (
                    <div
                      className="text-xs text-slate-400 flex-1 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMd(note.content) || '<span class="text-slate-700 italic">Empty note</span>' }}
                    />
                  ) : (
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words flex-1 font-mono leading-relaxed">
                      {note.content || <span className="text-slate-700 italic">Empty note</span>}
                    </pre>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30">
                    <span className="text-[10px] text-slate-600">
                      {wordCount(note.content)}w · {note.content.length}c
                    </span>
                    <span className="text-[10px] text-slate-600">{new Date(note.updatedAt).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EditNote({ note, onSave, onCancel }: {
  note: Note
  onSave: (patch: Partial<Note>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)

  return (
    <div className="space-y-2 flex flex-col h-full">
      <input className="input text-sm" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea
        className="input font-mono text-xs resize-none flex-1 min-h-[120px]"
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={() => onSave({ title, content })} className="btn-primary flex-1 justify-center">
          <Save size={12} /> Save
        </button>
        <button onClick={onCancel} className="btn-ghost">
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
