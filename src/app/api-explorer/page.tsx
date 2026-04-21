'use client'

import { useState } from 'react'
import { Send, RotateCcw, Copy, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

type Preset = { label: string; url: string; desc: string; emoji: string }

const PRESETS: Preset[] = [
  {
    label: 'Programming Joke',
    url: 'https://v2.jokeapi.dev/joke/Programming?type=single',
    desc: 'JokeAPI — single-line programming joke',
    emoji: '😂',
  },
  {
    label: 'Random Advice',
    url: 'https://api.adviceslip.com/advice',
    desc: 'Advice Slip — random life advice',
    emoji: '💡',
  },
  {
    label: 'Cat Fact',
    url: 'https://catfact.ninja/fact',
    desc: 'Cat Facts API — because why not',
    emoji: '🐱',
  },
  {
    label: 'ISS Location',
    url: 'https://api.wheretheiss.at/v1/satellites/25544',
    desc: 'Real-time ISS position & velocity',
    emoji: '🛸',
  },
  {
    label: 'Random Dog',
    url: 'https://dog.ceo/api/breeds/image/random',
    desc: 'Dog API — random dog image URL',
    emoji: '🐕',
  },
  {
    label: 'IP Info',
    url: 'https://ipapi.co/json/',
    desc: 'Your current IP & geolocation',
    emoji: '🌍',
  },
  {
    label: 'Chuck Norris',
    url: 'https://api.chucknorris.io/jokes/random',
    desc: 'Random Chuck Norris fact',
    emoji: '🥋',
  },
  {
    label: 'Ron Swanson Quote',
    url: 'https://ron-swanson-quotes.herokuapp.com/v2/quotes',
    desc: 'Ron Swanson Quotes API — Parks & Recreation wisdom',
    emoji: '🥩',
  },
  {
    label: 'Useless Fact',
    url: 'https://uselessfacts.jsph.pl/api/v2/facts/random',
    desc: 'A completely useless random fact',
    emoji: '🧠',
  },
  {
    label: 'Yes or No?',
    url: 'https://yesno.wtf/api',
    desc: 'Random yes/no answer with GIF',
    emoji: '🎱',
  },
  {
    label: 'Trivia Question',
    url: 'https://opentdb.com/api.php?amount=1&type=multiple',
    desc: 'Open Trivia DB — random multiple choice',
    emoji: '🎓',
  },
  {
    label: 'Bored? Activity',
    url: 'https://bored-api.appbrewery.com/random',
    desc: 'Bored API — random activity suggestion',
    emoji: '🎯',
  },
  {
    label: 'Random Number',
    url: 'https://www.random.org/integers/?num=5&min=1&max=100&col=1&base=10&format=plain&rnd=new',
    desc: 'Random.org — true random numbers (plain text)',
    emoji: '🎲',
  },
]

export default function APIExplorerPage() {
  const [url, setUrl] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<number | null>(null)
  const [time, setTime] = useState<number | null>(null)

  const call = async (endpoint = url) => {
    if (!endpoint.trim()) { toast.error('Enter a URL'); return }
    setLoading(true)
    setResponse(null)
    const t0 = performance.now()
    try {
      const res = await fetch(endpoint)
      const t1 = performance.now()
      setTime(Math.round(t1 - t0))
      setStatus(res.status)
      const text = await res.text()
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2))
      } catch {
        setResponse(text)
      }
    } catch (err) {
      setStatus(0)
      setResponse(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    if (response) {
      navigator.clipboard.writeText(response)
      toast.success('Copied!')
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">🌐 API Explorer</h1>
        <p className="page-subtitle">Fire off quick API calls and inspect responses</p>
      </div>

      {/* URL bar */}
      <div className="card mb-4">
        <div className="flex gap-2">
          <div className="flex items-center px-2.5 bg-green-500/10 border border-green-500/20 rounded-md text-xs text-green-400 font-mono">
            GET
          </div>
          <input
            className="input flex-1"
            placeholder="https://api.example.com/endpoint"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && call()}
          />
          <button onClick={() => call()} disabled={loading} className="btn-primary">
            {loading ? (
              <RotateCcw size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Send
          </button>
        </div>

        {/* Status bar */}
        {status !== null && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700/40 text-xs">
            <span className={`tag border font-mono ${
              status >= 200 && status < 300 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              status >= 400 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}>
              {status === 0 ? 'NETWORK ERROR' : `${status}`}
            </span>
            {time !== null && <span className="text-slate-500">{time}ms</span>}
            {response && (
              <button onClick={copy} className="ml-auto btn-ghost py-0.5 px-2">
                <Copy size={11} /> Copy
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Presets */}
        <div className="lg:col-span-2">
          <p className="section-label mb-3">Quick Presets</p>
          <div className="space-y-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { setUrl(p.url); call(p.url) }}
                className="w-full card text-left hover:border-cyan-500/30 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-white">{p.label}</p>
                    <p className="text-xs text-slate-600 truncate">{p.desc}</p>
                  </div>
                  <Zap size={11} className="text-slate-700 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Response */}
        <div className="lg:col-span-3">
          <p className="section-label mb-3">Response</p>
          <div className="card min-h-[500px] font-mono text-xs">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-600">
                <RotateCcw size={20} className="animate-spin mr-2" /> Calling API…
              </div>
            ) : response ? (
              <pre className="text-green-300/90 whitespace-pre-wrap break-all leading-relaxed overflow-auto max-h-[600px]">
                {response}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-700">
                <Send size={24} className="mb-2 opacity-30" />
                <p className="text-sm">Pick a preset or enter a URL and hit Send</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
