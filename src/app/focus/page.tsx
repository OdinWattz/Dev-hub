'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Settings2, X, Volume2, VolumeX, Coffee, Zap, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'

type Mode = 'work' | 'short' | 'long'
type ConfigKey = 'work' | 'short' | 'long' | 'longAfter'
const CONFIG_FIELDS: { key: ConfigKey; label: string; unit: string }[] = [
  { key: 'work',      label: 'Focus duration',   unit: 'min' },
  { key: 'short',     label: 'Short break',       unit: 'min' },
  { key: 'long',      label: 'Long break',        unit: 'min' },
  { key: 'longAfter', label: 'Long break after',  unit: 'pomodoros' },
]
type Session = { date: string; completedPomodoros: number; totalMinutes: number }

const MODE_LABELS: Record<Mode, string> = { work: 'Focus', short: 'Short Break', long: 'Long Break' }
const MODE_COLORS: Record<Mode, string> = {
  work:  'text-cyan-400 border-cyan-400',
  short: 'text-green-400 border-green-400',
  long:  'text-purple-400 border-purple-400',
}
const MODE_BG: Record<Mode, string> = {
  work:  'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20',
  short: 'from-green-500/10 to-green-500/5 border-green-500/20',
  long:  'from-purple-500/10 to-purple-500/5 border-purple-500/20',
}

type TimerConfig = { work: number; short: number; long: number; longAfter: number }

const DEFAULT_CONFIG: TimerConfig = { work: 25, short: 5, long: 15, longAfter: 4 }

function beep(type: 'start' | 'end') {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const freqs = type === 'end' ? [523, 659, 784] : [440]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.4)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.4)
    })
  } catch { /* AudioContext not available */ }
}

export default function FocusPage() {
  const [config, setConfig] = useState<TimerConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG
    try { return JSON.parse(localStorage.getItem('focus_config') ?? 'null') ?? DEFAULT_CONFIG } catch { return DEFAULT_CONFIG }
  })
  const [mode, setMode] = useState<Mode>('work')
  const [timeLeft, setTimeLeft] = useState(config.work * 60)
  const [running, setRunning] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [totalToday, setTotalToday] = useState(0)
  const [sound, setSound] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [configDraft, setConfigDraft] = useState(config)
  const [sessions, setSessions] = useState<Session[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('focus_sessions') ?? '[]') } catch { return [] }
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalSeconds = config[mode] * 60
  const progress = (totalSeconds - timeLeft) / totalSeconds

  const saveSession = useCallback((count: number, mins: number) => {
    const today = new Date().toISOString().slice(0, 10)
    setSessions(prev => {
      const idx = prev.findIndex(s => s.date === today)
      let next: Session[]
      if (idx >= 0) {
        next = prev.map((s, i) => i === idx ? { ...s, completedPomodoros: s.completedPomodoros + count, totalMinutes: s.totalMinutes + mins } : s)
      } else {
        next = [{ date: today, completedPomodoros: count, totalMinutes: mins }, ...prev].slice(0, 30)
      }
      localStorage.setItem('focus_sessions', JSON.stringify(next))
      return next
    })
  }, [])

  const switchMode = useCallback((m: Mode) => {
    setMode(m)
    setTimeLeft(config[m] * 60)
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [config])

  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        setRunning(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (sound) beep('end')
        // determine next mode
        setMode((currentMode: Mode) => {
          if (currentMode === 'work') {
            setPomodoroCount(c => {
              const next = c + 1
              setTotalToday(t => t + 1)
              saveSession(1, config.work)
              toast.success(`🍅 Pomodoro #${next} done!`, { duration: 4000 })
              // next break
              const nextMode: Mode = next % config.longAfter === 0 ? 'long' : 'short'
              setTimeout(() => switchMode(nextMode), 100)
              return next
            })
          } else {
            toast(`☕ Break over — time to focus!`, { icon: '⏰', duration: 4000 })
            setTimeout(() => switchMode('work'), 100)
          }
          return currentMode
        })
        return 0
      }
      return prev - 1
    })
  }, [sound, config, saveSession, switchMode])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, tick])

  const toggle = () => {
    if (!running && sound) beep('start')
    setRunning(v => !v)
  }

  const reset = () => {
    setRunning(false)
    setTimeLeft(config[mode] * 60)
  }

  const skip = () => {
    const next: Mode = mode === 'work'
      ? (pomodoroCount + 1) % config.longAfter === 0 ? 'long' : 'short'
      : 'work'
    switchMode(next)
  }

  const saveConfig = () => {
    setConfig(configDraft)
    localStorage.setItem('focus_config', JSON.stringify(configDraft))
    setTimeLeft(configDraft[mode] * 60)
    setRunning(false)
    setShowSettings(false)
    toast.success('Settings saved')
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  const todayStr = new Date().toISOString().slice(0, 10)
  const todaySession = sessions.find(s => s.date === todayStr)

  // SVG ring
  const R = 88
  const C = 2 * Math.PI * R
  const dash = C * (1 - progress)

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="page-title">🍅 Focus Timer</h1>
          <p className="page-subtitle">Pomodoro timer — stay in flow, one session at a time</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSound(v => !v)} className="btn-ghost px-2.5" title="Toggle sound">
            {sound ? <Volume2 size={15} /> : <VolumeX size={15} className="text-slate-600" />}
          </button>
          <button onClick={() => { setConfigDraft(config); setShowSettings(true) }} className="btn-ghost px-2.5" title="Settings">
            <Settings2 size={15} />
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-6">
        {(['work', 'short', 'long'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-4 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5
              ${mode === m ? `bg-slate-800 ${MODE_COLORS[m]} border` : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
          >
            {m === 'work' ? <Zap size={11} /> : <Coffee size={11} />}
            {MODE_LABELS[m]}
            <span className="text-[10px] opacity-60">{config[m]}m</span>
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className={`card mb-6 bg-gradient-to-br ${MODE_BG[mode]} flex flex-col items-center py-10`}>
        <div className="relative mb-6">
          <svg width="220" height="220" className="-rotate-90">
            {/* Track */}
            <circle cx="110" cy="110" r={R} fill="none" stroke="#1e293b" strokeWidth="8" />
            {/* Progress */}
            <circle
              cx="110" cy="110" r={R}
              fill="none"
              stroke={mode === 'work' ? '#22d3ee' : mode === 'short' ? '#4ade80' : '#a78bfa'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={dash}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-mono font-bold text-white tracking-tight">{mm}:{ss}</p>
            <p className={`text-xs mt-1 font-medium ${MODE_COLORS[mode].split(' ')[0]}`}>{MODE_LABELS[mode]}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">#{pomodoroCount + (mode === 'work' ? 1 : 0)}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button onClick={reset} className="btn-ghost p-2.5 rounded-full" title="Reset">
            <RotateCcw size={16} />
          </button>
          <button
            onClick={toggle}
            className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all shadow-lg
              ${mode === 'work' ? 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/30'
                : mode === 'short' ? 'bg-green-500 hover:bg-green-400 shadow-green-500/30'
                : 'bg-purple-500 hover:bg-purple-400 shadow-purple-500/30'}`}
          >
            {running ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" />}
          </button>
          <button onClick={skip} className="btn-ghost p-2.5 rounded-full" title="Skip to next">
            <SkipForward size={16} />
          </button>
        </div>

        {/* Pomodoro dots */}
        <div className="flex items-center gap-2 mt-6">
          {Array.from({ length: config.longAfter }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i < (pomodoroCount % config.longAfter)
                  ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                  : 'bg-slate-700'
              }`}
            />
          ))}
          <span className="text-[10px] text-slate-600 ml-1">until long break</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{pomodoroCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">This session</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-cyan-400">{todaySession?.completedPomodoros ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Today total</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-400">{todaySession ? Math.round(todaySession.totalMinutes) : 0}m</p>
          <p className="text-xs text-slate-500 mt-0.5">Focus time today</p>
        </div>
      </div>

      {/* History */}
      {sessions.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={13} className="text-yellow-400" />
            <p className="section-label">Session History</p>
          </div>
          <div className="space-y-2">
            {sessions.slice(0, 7).map(s => {
              const isToday = s.date === todayStr
              return (
                <div key={s.date} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isToday ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}>
                      {isToday ? 'Today' : new Date(s.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">
                      {'🍅'.repeat(Math.min(s.completedPomodoros, 8))}{s.completedPomodoros > 8 ? ` +${s.completedPomodoros - 8}` : ''}
                    </span>
                    <span className="text-[10px] text-slate-600 w-16 text-right">{s.totalMinutes}m focused</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm space-y-4 border-slate-600/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Settings2 size={14} /> Timer Settings</p>
              <button onClick={() => setShowSettings(false)} className="text-slate-600 hover:text-slate-300"><X size={15} /></button>
            </div>
            {CONFIG_FIELDS.map(({ key, label, unit }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">{label}</p>
                  <p className="text-[10px] text-slate-600">{unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setConfigDraft((d: TimerConfig) => ({ ...d, [key]: Math.max(1, d[key] - 1) }))} className="btn-ghost w-7 h-7 flex items-center justify-center p-0 text-lg leading-none">−</button>
                  <span className="w-8 text-center text-sm font-mono text-white">{configDraft[key]}</span>
                  <button onClick={() => setConfigDraft((d: TimerConfig) => ({ ...d, [key]: d[key] + 1 }))} className="btn-ghost w-7 h-7 flex items-center justify-center p-0 text-lg leading-none">+</button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={saveConfig} className="btn-primary flex-1 justify-center">Save</button>
              <button onClick={() => setShowSettings(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
