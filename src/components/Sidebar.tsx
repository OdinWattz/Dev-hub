'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Code2,
  FileText,
  Globe,
  Github,
  CloudSun,
  Cpu,
  ExternalLink,
  Settings,
} from 'lucide-react'

const NAV = [
  { href: '/',              label: 'Dashboard',    icon: LayoutDashboard, color: 'text-cyan-400' },
  { href: '/todo',          label: 'Todo',         icon: CheckSquare,     color: 'text-green-400' },
  { href: '/snippets',      label: 'Snippets',     icon: Code2,           color: 'text-purple-400' },
  { href: '/notes',         label: 'Notes',        icon: FileText,        color: 'text-yellow-400' },
  { href: '/weather',       label: 'Weather',      icon: CloudSun,        color: 'text-sky-400' },
  { href: '/github',        label: 'GitHub Stats', icon: Github,          color: 'text-slate-300' },
  { href: '/api-explorer',  label: 'API Explorer', icon: Globe,           color: 'text-orange-400' },
  { href: '/settings',       label: 'Settings',     icon: Settings,        color: 'text-slate-400' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-slate-900/80 border-r border-slate-700/40 backdrop-blur-md flex flex-col z-40">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-700/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Cpu size={14} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">DevHub</p>
            <p className="text-[10px] text-slate-500">v1.0.0 · local</p>
          </div>
        </div>
        {/* Live indicator */}
        <div className="mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-slow" />
          <span className="text-[10px] text-slate-500 font-mono">localhost:3000</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        <p className="section-label px-2 mb-3">Workspace</p>
        {NAV.map(({ href, label, icon: Icon, color }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group
                ${active
                  ? 'bg-cyan-500/10 text-white border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
            >
              <Icon size={15} className={active ? color : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="font-medium">{label}</span>
              {active && <span className="ml-auto w-1 h-1 rounded-full bg-cyan-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700/40">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          <ExternalLink size={11} />
          Open on GitHub
        </a>
      </div>
    </aside>
  )
}
