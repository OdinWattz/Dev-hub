'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Tag, ChevronDown, Search, Pencil, X, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'

type Priority = 'low' | 'medium' | 'high'
type Todo = {
  id: string
  text: string
  done: boolean
  priority: Priority
  tag: string
  createdAt: number
  dueDate?: string
}

const PRIORITY_COLOR: Record<Priority, string> = {
  low:    'text-slate-400 bg-slate-400/10 border-slate-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  high:   'text-red-400   bg-red-400/10   border-red-400/20',
}

const PRIORITY_DOT: Record<Priority, string> = {
  low:    'bg-slate-400',
  medium: 'bg-yellow-400',
  high:   'bg-red-400',
}

const TAGS = ['bug', 'feature', 'refactor', 'docs', 'test', 'devops', 'idea', 'other']

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [tag, setTag] = useState('feature')
  const [dueDate, setDueDate] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'due'>('newest')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('devhub-todos')
    if (saved) setTodos(JSON.parse(saved))
  }, [])

  const save = (next: Todo[]) => {
    setTodos(next)
    localStorage.setItem('devhub-todos', JSON.stringify(next))
  }

  const add = () => {
    if (!text.trim()) return
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: text.trim(),
      done: false,
      priority,
      tag,
      createdAt: Date.now(),
      dueDate: dueDate || undefined,
    }
    save([todo, ...todos])
    setText('')
    setDueDate('')
    toast.success('Task added')
  }

  const clearDone = () => {
    const next = todos.filter(t => !t.done)
    save(next)
    toast('Completed tasks cleared', { icon: '🧹' })
  }

  const startEdit = (todo: Todo) => { setEditingId(todo.id); setEditText(todo.text) }
  const commitEdit = (id: string) => {
    if (!editText.trim()) return
    save(todos.map(t => t.id === id ? { ...t, text: editText.trim() } : t))
    setEditingId(null)
    toast.success('Updated')
  }

  const isOverdue = (t: Todo) => !t.done && t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString())

  const toggle = (id: string) =>
    save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const remove = (id: string) => {
    save(todos.filter(t => t.id !== id))
    toast('Task removed', { icon: '🗑️' })
  }

  const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

  const filtered = todos
    .filter(t => (filter === 'all' ? true : filter === 'open' ? !t.done : t.done))
    .filter(t => !search || t.text.toLowerCase().includes(search.toLowerCase()) || t.tag.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (sortBy === 'due') {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return b.createdAt - a.createdAt
    })

  const counts = { total: todos.length, open: todos.filter(t => !t.done).length, done: todos.filter(t => t.done).length }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="page-title">📋 Todo</h1>
        <p className="page-subtitle">Track your dev tasks & ideas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {(['total', 'open', 'done'] as const).map(k => (
          <div key={k} className="card text-center">
            <p className="text-2xl font-bold text-white">{counts[k]}</p>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{k}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {counts.total > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-[10px] text-slate-600 mb-1">
            <span>Progress</span>
            <span>{Math.round((counts.done / counts.total) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${(counts.done / counts.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="card mb-4 space-y-3">
        <input
          className="input"
          placeholder="New dev task…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <div className="flex gap-2 flex-wrap">
          {/* Priority */}
          <div className="relative">
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="input pr-7 py-1 w-auto text-xs appearance-none cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          {/* Tag */}
          <div className="relative">
            <select
              value={tag}
              onChange={e => setTag(e.target.value)}
              className="input pr-7 py-1 w-auto text-xs appearance-none cursor-pointer"
            >
              {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          {/* Due date */}
          <input
            type="date"
            className="input py-1 text-xs w-auto cursor-pointer"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            title="Due date (optional)"
          />
          <button onClick={add} className="btn-primary ml-auto">
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Toolbar: filter + search + sort */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="flex gap-1">
          {(['all', 'open', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all capitalize
                ${filter === f ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          <input
            className="input !pl-7 py-1 text-xs"
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select className="input text-xs appearance-none pr-6 cursor-pointer py-1" value={sortBy} onChange={e => setSortBy(e.target.value as 'newest' | 'priority' | 'due')}>
            <option value="newest">Newest</option>
            <option value="priority">Priority</option>
            <option value="due">Due date</option>
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
        {counts.done > 0 && (
          <button onClick={clearDone} className="btn-ghost text-xs gap-1.5 text-slate-500 hover:text-red-400">
            <CheckCheck size={12} /> Clear done
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card text-center py-10 text-slate-600">
            <p className="text-4xl mb-2">✓</p>
            <p className="text-sm">No tasks here</p>
          </div>
        )}
        {filtered.map(todo => (
          <div
            key={todo.id}
            className={`card flex items-start gap-3 transition-all duration-200
              ${todo.done ? 'opacity-50' : ''} ${isOverdue(todo) ? 'border-red-500/20' : ''}`}
          >
            <button
              onClick={() => toggle(todo.id)}
              className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all
                ${todo.done ? 'bg-cyan-500/20 border-cyan-500/60' : 'border-slate-600 hover:border-cyan-500/50'}`}
            >
              {todo.done && <Check size={11} className="text-cyan-400" />}
            </button>
            <div className="flex-1 min-w-0">
              {editingId === todo.id ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    className="input text-sm py-0.5 flex-1"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(todo.id); if (e.key === 'Escape') setEditingId(null) }}
                  />
                  <button onClick={() => commitEdit(todo.id)} className="btn-primary py-0.5 px-2 text-xs">Save</button>
                  <button onClick={() => setEditingId(null)} className="btn-ghost py-0.5 px-1.5"><X size={11} /></button>
                </div>
              ) : (
                <p className={`text-sm ${todo.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {todo.text}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`tag border ${PRIORITY_COLOR[todo.priority]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_DOT[todo.priority]}`} />
                  {todo.priority}
                </span>
                <span className="tag bg-slate-700/50 text-slate-400 border border-slate-700">
                  <Tag size={9} className="mr-1" />{todo.tag}
                </span>
                {todo.dueDate && (
                  <span className={`tag border text-[9px] ${
                    isOverdue(todo)
                      ? 'text-red-400 bg-red-400/10 border-red-400/20'
                      : 'text-slate-500 bg-slate-700/30 border-slate-700'
                  }`}>
                    {isOverdue(todo) ? '⚠ overdue · ' : '📅 '}
                    {new Date(todo.dueDate).toLocaleDateString()}
                  </span>
                )}
                <span className="text-[10px] text-slate-600 ml-auto">
                  {new Date(todo.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              {editingId !== todo.id && (
                <button onClick={() => startEdit(todo)} className="text-slate-700 hover:text-slate-400 transition-colors mt-0.5">
                  <Pencil size={12} />
                </button>
              )}
              <button onClick={() => remove(todo.id)} className="text-slate-700 hover:text-red-400 transition-colors mt-0.5">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
