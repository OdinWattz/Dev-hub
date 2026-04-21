'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Code2, FileText, Globe, Github, CloudSun, ArrowRight, Activity, Clock } from 'lucide-react'
import Link from 'next/link'

type StatCard = { label: string; count: number; href: string; icon: React.ElementType; color: string }

export default function DashboardPage() {
  const [todos, setTodos]     = useState<unknown[]>([])
  const [snippets, setSnippets] = useState<unknown[]>([])
  const [notes, setNotes]     = useState<unknown[]>([])
  const [time, setTime]       = useState(new Date())

  useEffect(() => {
    const t = localStorage.getItem('devhub-todos')
    const s = localStorage.getItem('devhub-snippets')
    const n = localStorage.getItem('devhub-notes')
    if (t) setTodos(JSON.parse(t))
    if (s) setSnippets(JSON.parse(s))
    if (n) setNotes(JSON.parse(n))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const openTodos = (todos as { done: boolean }[]).filter(t => !t.done).length

  const STATS: StatCard[] = [
    { label: 'Open Tasks',  count: openTodos,       href: '/todo',         icon: CheckSquare, color: 'text-green-400  border-green-500/20  bg-green-500/5' },
    { label: 'Snippets',    count: snippets.length, href: '/snippets',     icon: Code2,       color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
    { label: 'Notes',       count: notes.length,    href: '/notes',        icon: FileText,    color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' },
    { label: 'Total Tasks', count: todos.length,    href: '/todo',         icon: CheckSquare, color: 'text-cyan-400   border-cyan-500/20   bg-cyan-500/5'   },
  ]

  const QUICK_LINKS = [
    { label: 'Weather',      href: '/weather',      icon: CloudSun, desc: 'Real-time forecast',         color: 'text-sky-400'    },
    { label: 'GitHub Stats', href: '/github',       icon: Github,   desc: 'Explore GitHub profiles',    color: 'text-slate-300'  },
    { label: 'API Explorer', href: '/api-explorer', icon: Globe,    desc: 'Fire off API calls',         color: 'text-orange-400' },
  ]

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-600 font-mono mb-1">{'//'} welcome back</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Dev<span className="text-cyan-400">Hub</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Your personal developer toolkit</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono text-white tabular-nums">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
        <Activity size={12} className="text-cyan-400" />
        <span className="text-xs text-cyan-400/80 font-mono">System online · All services running · localhost:3000</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Live
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, count, href, icon: Icon, color }) => (
          <Link key={label} href={href} className={`card border ${color} hover:scale-[1.02] transition-all duration-200 group`}>
            <div className="flex items-center justify-between mb-3">
              <Icon size={16} className={color.split(' ')[0]} />
              <ArrowRight size={12} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{count}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent todos */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Recent Tasks</p>
            <Link href="/todo" className="text-xs text-cyan-500 hover:text-cyan-300 transition-colors">View all →</Link>
          </div>
          <div className="space-y-2">
            {(todos as { id: string; text: string; done: boolean; priority: string; tag: string }[]).slice(0, 5).map(todo => (
              <div key={todo.id} className="card flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  todo.done ? 'bg-cyan-400' :
                  todo.priority === 'high' ? 'bg-red-400' :
                  todo.priority === 'medium' ? 'bg-yellow-400' : 'bg-slate-500'
                }`} />
                <span className={`text-sm flex-1 ${todo.done ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                  {todo.text}
                </span>
                <span className="text-[10px] text-slate-700 bg-slate-800 px-1.5 py-0.5 rounded">{todo.tag}</span>
              </div>
            ))}
            {todos.length === 0 && (
              <div className="card text-center py-8 text-slate-700">
                <p className="text-sm">No tasks yet</p>
                <Link href="/todo" className="text-xs text-cyan-600 hover:text-cyan-400 mt-1 block">Add your first task →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick links + recent snippets */}
        <div className="space-y-6">
          <div>
            <p className="section-label mb-3">Quick Access</p>
            <div className="space-y-2">
              {QUICK_LINKS.map(({ label, href, icon: Icon, desc, color }) => (
                <Link key={label} href={href} className="card flex items-center gap-3 hover:border-slate-600 transition-all group">
                  <Icon size={15} className={color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-white">{label}</p>
                    <p className="text-[10px] text-slate-600">{desc}</p>
                  </div>
                  <ArrowRight size={12} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">Recent Snippets</p>
              <Link href="/snippets" className="text-xs text-cyan-500 hover:text-cyan-300 transition-colors">All →</Link>
            </div>
            <div className="space-y-2">
              {(snippets as { id: string; title: string; language: string }[]).slice(0, 3).map(s => (
                <div key={s.id} className="card flex items-center gap-2">
                  <Code2 size={12} className="text-purple-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300 flex-1 truncate">{s.title}</span>
                  <span className="text-[10px] text-purple-400/60">{s.language}</span>
                </div>
              ))}
              {snippets.length === 0 && (
                <p className="text-xs text-slate-700 text-center py-4">No snippets saved yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
