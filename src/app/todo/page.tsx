'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Flag, Tag, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

type Priority = 'low' | 'medium' | 'high'
type Todo = {
  id: string
  text: string
  done: boolean
  priority: Priority
  tag: string
  createdAt: number
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
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all')

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
    }
    save([todo, ...todos])
    setText('')
    toast.success('Task added')
  }

  const toggle = (id: string) =>
    save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const remove = (id: string) => {
    save(todos.filter(t => t.id !== id))
    toast('Task removed', { icon: '🗑️' })
  }

  const filtered = todos.filter(t =>
    filter === 'all' ? true : filter === 'open' ? !t.done : t.done
  )

  const counts = { total: todos.length, open: todos.filter(t => !t.done).length, done: todos.filter(t => t.done).length }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="page-title">📋 Todo</h1>
        <p className="page-subtitle">Track your dev tasks & ideas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['total', 'open', 'done'] as const).map(k => (
          <div key={k} className="card text-center">
            <p className="text-2xl font-bold text-white">{counts[k]}</p>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{k}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="card mb-6 space-y-3">
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
          <button onClick={add} className="btn-primary ml-auto">
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-4">
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
              ${todo.done ? 'opacity-50' : ''}`}
          >
            <button
              onClick={() => toggle(todo.id)}
              className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all
                ${todo.done ? 'bg-cyan-500/20 border-cyan-500/60' : 'border-slate-600 hover:border-cyan-500/50'}`}
            >
              {todo.done && <Check size={11} className="text-cyan-400" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${todo.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {todo.text}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`tag border ${PRIORITY_COLOR[todo.priority]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_DOT[todo.priority]}`} />
                  {todo.priority}
                </span>
                <span className="tag bg-slate-700/50 text-slate-400 border border-slate-700">
                  <Tag size={9} className="mr-1" />{todo.tag}
                </span>
                <span className="text-[10px] text-slate-600 ml-auto">
                  {new Date(todo.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button onClick={() => remove(todo.id)} className="text-slate-700 hover:text-red-400 transition-colors mt-0.5">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
