'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, X, Search, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

type Note = {
  id: string
  title: string
  content: string
  category: string
  color: string
  updatedAt: number
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

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="page-title">📝 Notes</h1>
        <p className="page-subtitle">Quick notes, cheatsheets & references</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="input pl-10"
            placeholder="Search notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setCreating(!creating)} className="btn-primary">
          <Plus size={14} /> New Note
        </button>
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
            <div key={note.id} className={`card ${color.bg} ${color.border} flex flex-col`}>
              {isEditing ? (
                <EditNote note={note} onSave={(patch) => { update(note.id, patch); setEditing(null) }} onCancel={() => setEditing(null)} />
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white text-sm">{note.title}</h3>
                      <span className="tag bg-slate-700/50 text-slate-400 border border-slate-700 mt-1 text-[10px]">
                        {note.category}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100">
                      <button onClick={() => setEditing(note.id)} className="btn-ghost py-0.5 px-1.5">
                        <Edit3 size={11} />
                      </button>
                      <button onClick={() => remove(note.id)} className="text-slate-700 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words flex-1 font-mono leading-relaxed">
                    {note.content || <span className="text-slate-700 italic">Empty note</span>}
                  </pre>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30">
                    <span className="text-[10px] text-slate-600">
                      {new Date(note.updatedAt).toLocaleString()}
                    </span>
                    <button onClick={() => setEditing(note.id)} className="text-[10px] text-slate-600 hover:text-cyan-400 transition-colors">
                      Edit →
                    </button>
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
