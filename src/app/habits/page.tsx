'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Flame, RotateCcw, Shield, Zap, Trophy, Heart, Wind,
  ChevronDown, ChevronUp, X, Plus, CheckCircle2, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────
type CheckIn = { date: string; mood: number; note: string }
type HabitData = {
  startDate: string | null   // ISO date of current streak start
  resets: string[]           // ISO dates of each reset
  checkins: CheckIn[]
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MILESTONES = [
  { days: 1,   label: '1 Day',     icon: '🌱', color: 'text-green-400'  },
  { days: 3,   label: '3 Days',    icon: '✨', color: 'text-cyan-400'   },
  { days: 7,   label: '1 Week',    icon: '🔥', color: 'text-orange-400' },
  { days: 14,  label: '2 Weeks',   icon: '💪', color: 'text-yellow-400' },
  { days: 21,  label: '21 Days',   icon: '🧠', color: 'text-purple-400' },
  { days: 30,  label: '1 Month',   icon: '🏅', color: 'text-yellow-300' },
  { days: 60,  label: '2 Months',  icon: '⚡', color: 'text-sky-400'    },
  { days: 90,  label: '90 Days',   icon: '🏆', color: 'text-amber-400'  },
  { days: 180, label: '6 Months',  icon: '💎', color: 'text-blue-400'   },
  { days: 365, label: '1 Year',    icon: '👑', color: 'text-rose-400'   },
]

const QUOTES = [
  'Discipline is choosing between what you want now and what you want most.',
  'Every time you resist, you get stronger. Every time.',
  'You don\'t have to feel ready. You just have to start.',
  'The urge always passes. Always.',
  'Freedom is on the other side of discomfort.',
  'You\'ve survived every hard moment so far — 100% success rate.',
  'Small steps every day. That\'s all it takes.',
  'The version of you that you want to be is built in moments like this.',
  'Resilience isn\'t the absence of struggle — it\'s choosing to keep going.',
  'You are not your urges. You are the one who can observe and choose.',
]

const TOOLKIT = [
  { icon: '🚶', action: 'Go for a 10-min walk outside' },
  { icon: '🧊', action: 'Splash cold water on your face' },
  { icon: '📞', action: 'Call or text a friend right now' },
  { icon: '💪', action: 'Do 20 push-ups or jumping jacks' },
  { icon: '🎵', action: 'Put on your favourite playlist' },
  { icon: '📖', action: 'Read a book for 10 minutes' },
  { icon: '🍵', action: 'Make yourself a hot drink' },
  { icon: '✍️', action: 'Write down how you\'re feeling' },
]

const MOODS = ['😞', '😕', '😐', '🙂', '😄']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.floor(ms / 86400000)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function loadData(): HabitData {
  if (typeof window === 'undefined') return { startDate: null, resets: [], checkins: [] }
  try {
    return JSON.parse(localStorage.getItem('habit_data') ?? 'null') ?? { startDate: null, resets: [], checkins: [] }
  } catch { return { startDate: null, resets: [], checkins: [] } }
}

function saveData(d: HabitData) {
  localStorage.setItem('habit_data', JSON.stringify(d))
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HabitsPage() {
  const [data, setData] = useState<HabitData>(loadData)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [quote, setQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  // Urge timer
  const [urgeRunning, setUrgeRunning] = useState(false)
  const [urgeLeft, setUrgeLeft] = useState(600) // 10 min default
  const [urgeTotal, setUrgeTotal] = useState(600)
  const [urgeDone, setUrgeDone] = useState(false)
  const urgeRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Check-in form
  const [showCheckin, setShowCheckin] = useState(false)
  const [checkinMood, setCheckinMood] = useState(2)
  const [checkinNote, setCheckinNote] = useState('')

  // Expanded sections
  const [showToolkit, setShowToolkit] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const streakDays = data.startDate ? daysBetween(data.startDate, today()) : 0
  const todayCheckin = data.checkins.find(c => c.date === today())
  const nextMilestone = MILESTONES.find(m => m.days > streakDays)
  const achieved = MILESTONES.filter(m => m.days <= streakDays)
  const lastAchieved = achieved[achieved.length - 1]

  // Urge timer tick
  useEffect(() => {
    if (urgeRunning) {
      urgeRef.current = setInterval(() => {
        setUrgeLeft(prev => {
          if (prev <= 1) {
            clearInterval(urgeRef.current!)
            setUrgeRunning(false)
            setUrgeDone(true)
            toast.success('You made it through! 💪 The urge has passed.', { duration: 6000 })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (urgeRef.current) clearInterval(urgeRef.current)
    }
    return () => { if (urgeRef.current) clearInterval(urgeRef.current) }
  }, [urgeRunning])

  const startStreak = useCallback(() => {
    const next = { ...data, startDate: today() }
    setData(next)
    saveData(next)
    toast.success('Streak started — Day 1 begins today! 🌱')
  }, [data])

  const resetStreak = useCallback(() => {
    const next: HabitData = {
      ...data,
      startDate: today(),
      resets: [...data.resets, today()],
    }
    setData(next)
    saveData(next)
    setShowResetConfirm(false)
    toast('Reset logged. Day 1 again — you got this.', { icon: '💪' })
  }, [data])

  const submitCheckin = useCallback(() => {
    if (todayCheckin) { toast.error('Already checked in today'); return }
    const entry: CheckIn = { date: today(), mood: checkinMood, note: checkinNote.trim() }
    const next = { ...data, checkins: [entry, ...data.checkins].slice(0, 90) }
    setData(next)
    saveData(next)
    setShowCheckin(false)
    setCheckinNote('')
    toast.success('Check-in saved ✓')
  }, [data, checkinMood, checkinNote, todayCheckin])

  const startUrge = (minutes: number) => {
    const secs = minutes * 60
    setUrgeLeft(secs)
    setUrgeTotal(secs)
    setUrgeDone(false)
    setUrgeRunning(true)
  }

  const urgePercent = (urgeTotal - urgeLeft) / urgeTotal
  const R = 42
  const C = 2 * Math.PI * R

  const urgeM = String(Math.floor(urgeLeft / 60)).padStart(2, '0')
  const urgeS = String(urgeLeft % 60).padStart(2, '0')

  return (
    <div className="max-w-2xl space-y-5">
      <div className="mb-2">
        <h1 className="page-title">Habit Tracker</h1>
        <p className="page-subtitle">Build streaks, track progress, break the cycle</p>
      </div>

      {/* ── Streak card ── */}
      <div className="card bg-gradient-to-br from-orange-500/10 to-rose-500/5 border-orange-500/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Flame size={22} className="text-orange-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{streakDays}</p>
              <p className="text-xs text-slate-500">{streakDays === 1 ? 'day streak' : 'days streak'}</p>
            </div>
          </div>
          <div className="text-right">
            {lastAchieved && (
              <p className="text-lg mb-0.5">{lastAchieved.icon}</p>
            )}
            {nextMilestone && (
              <p className="text-[10px] text-slate-500">
                {nextMilestone.days - streakDays}d until {nextMilestone.label}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar to next milestone */}
        {nextMilestone && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>{lastAchieved?.label ?? 'Start'}</span>
              <span>{nextMilestone.label}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-rose-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (streakDays / nextMilestone.days) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {!data.startDate ? (
            <button onClick={startStreak} className="btn-primary flex items-center gap-1.5">
              <Plus size={13} /> Start Streak
            </button>
          ) : (
            <>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="btn-ghost text-xs flex items-center gap-1.5 text-slate-500"
                >
                  <RotateCcw size={11} /> Log Reset
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-slate-400">Log a reset and start over?</p>
                  <button onClick={resetStreak} className="text-xs px-3 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all">Confirm</button>
                  <button onClick={() => setShowResetConfirm(false)} className="btn-ghost text-xs px-2 py-1">Cancel</button>
                </div>
              )}
            </>
          )}
          {data.resets.length > 0 && (
            <span className="text-[10px] text-slate-600 self-center ml-auto">
              {data.resets.length} reset{data.resets.length > 1 ? 's' : ''} logged
            </span>
          )}
        </div>
      </div>

      {/* ── Quote ── */}
      <div
        className="card border-slate-700/30 cursor-pointer hover:border-slate-600/40 transition-all"
        onClick={() => setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])}
        title="Click for a new quote"
      >
        <p className="text-sm text-slate-400 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
        <p className="text-[10px] text-slate-700 mt-2">Click for new quote</p>
      </div>

      {/* ── Urge Surfer ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Wind size={14} className="text-sky-400" />
          <p className="section-label">Urge Surfer</p>
          <span className="text-[10px] text-slate-600 ml-1">— wait it out, urges pass in minutes</span>
        </div>
        <div className="flex items-center gap-6">
          {/* Mini ring */}
          <div className="relative shrink-0">
            <svg width="104" height="104" className="-rotate-90">
              <circle cx="52" cy="52" r={R} fill="none" stroke="#1e293b" strokeWidth="6" />
              <circle
                cx="52" cy="52" r={R}
                fill="none"
                stroke={urgeDone ? '#4ade80' : '#38bdf8'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - urgePercent)}
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {urgeDone ? (
                <CheckCircle2 size={22} className="text-green-400" />
              ) : (
                <>
                  <p className="text-lg font-mono font-bold text-white">{urgeM}:{urgeS}</p>
                  <p className="text-[9px] text-slate-600">{urgeRunning ? 'hold on' : 'ready'}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              Start the timer and breathe. The urge will pass before it ends — it always does.
            </p>
            {!urgeRunning ? (
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15].map(m => (
                  <button key={m} onClick={() => startUrge(m)} className="btn-ghost text-xs px-3">
                    {m} min
                  </button>
                ))}
                {urgeRunning && (
                  <button onClick={() => { setUrgeRunning(false); setUrgeLeft(urgeTotal) }} className="btn-ghost text-xs px-2 text-slate-600">
                    <X size={11} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <p className="text-xs text-sky-400 font-medium">Breathe in… hold… breathe out…</p>
                <button onClick={() => { setUrgeRunning(false); setUrgeLeft(urgeTotal) }} className="btn-ghost p-1">
                  <X size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Daily check-in ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={14} className="text-rose-400" />
          <p className="section-label">Daily Check-in</p>
          {todayCheckin && <span className="text-[10px] text-green-400 ml-auto">✓ Done today</span>}
        </div>
        {todayCheckin ? (
          <div className="flex items-center gap-3">
            <p className="text-2xl">{MOODS[todayCheckin.mood]}</p>
            {todayCheckin.note && <p className="text-xs text-slate-500 italic">&ldquo;{todayCheckin.note}&rdquo;</p>}
          </div>
        ) : showCheckin ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-2">How are you feeling today?</p>
              <div className="flex gap-3">
                {MOODS.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setCheckinMood(i)}
                    className={`text-xl transition-all ${checkinMood === i ? 'scale-125' : 'opacity-40 hover:opacity-70'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className="input w-full text-xs resize-none"
              rows={2}
              placeholder="Optional note — how was today? (private)"
              value={checkinNote}
              onChange={e => setCheckinNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={submitCheckin} className="btn-primary text-xs">Save</button>
              <button onClick={() => setShowCheckin(false)} className="btn-ghost text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCheckin(true)} className="btn-ghost text-xs flex items-center gap-1.5">
            <Plus size={11} /> Check in now
          </button>
        )}
      </div>

      {/* ── Emergency Toolkit ── */}
      <div className="card">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setShowToolkit(v => !v)}
        >
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-purple-400" />
            <p className="section-label">Emergency Toolkit</p>
            <span className="text-[10px] text-slate-600 ml-1">— things to do right now</span>
          </div>
          {showToolkit ? <ChevronUp size={13} className="text-slate-600" /> : <ChevronDown size={13} className="text-slate-600" />}
        </button>
        {showToolkit && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {TOOLKIT.map((t, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700/30">
                <span className="text-base shrink-0">{t.icon}</span>
                <p className="text-xs text-slate-400 leading-snug">{t.action}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Milestones ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className="text-yellow-400" />
          <p className="section-label">Milestones</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MILESTONES.map(m => {
            const done = streakDays >= m.days
            return (
              <div
                key={m.days}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all
                  ${done
                    ? 'bg-slate-800 border-slate-600/40 text-slate-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-700'
                  }`}
              >
                <span className={done ? '' : 'grayscale opacity-30'}>{m.icon}</span>
                <span className={done ? m.color : ''}>{m.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Mood History ── */}
      {data.checkins.length > 0 && (
        <div className="card">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowHistory(v => !v)}
          >
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-cyan-400" />
              <p className="section-label">Check-in History</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600">{data.checkins.length} entries</span>
              {showHistory ? <ChevronUp size={13} className="text-slate-600" /> : <ChevronDown size={13} className="text-slate-600" />}
            </div>
          </button>
          {showHistory && (
            <div className="mt-3 space-y-1.5">
              {data.checkins.slice(0, 14).map(c => (
                <div key={c.date} className="flex items-center gap-3 py-1.5 border-b border-slate-800 last:border-0">
                  <span className="text-xs text-slate-600 w-24 shrink-0">{new Date(c.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="text-base">{MOODS[c.mood]}</span>
                  {c.note && <span className="text-xs text-slate-500 italic truncate">&ldquo;{c.note}&rdquo;</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Streak resets chart ── */}
      {data.resets.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-slate-500" />
            <p className="section-label">Reset Log</p>
            <span className="text-[10px] text-slate-700 ml-1">— every reset is data, not failure</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...data.resets].reverse().map((d, i) => (
              <span key={i} className="text-[10px] text-slate-600 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/30">
                {new Date(d + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
