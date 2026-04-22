'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, RotateCcw, Copy, Zap, MessageSquare, Key, ChevronDown, ChevronUp } from 'lucide-react'
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
  {
    label: 'NASA Astronomy Pic',
    url: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY',
    desc: 'NASA APOD — today\'s astronomy picture + info',
    emoji: '🔭',
  },
  {
    label: 'Random Cocktail',
    url: 'https://www.thecocktaildb.com/api/json/v1/1/random.php',
    desc: 'CocktailDB — random drink recipe',
    emoji: '🍹',
  },
  {
    label: 'Bitcoin Price',
    url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
    desc: 'CoinDesk — live BTC/USD price',
    emoji: '₿',
  },
  {
    label: 'Open Library Search',
    url: 'https://openlibrary.org/search.json?q=javascript&limit=3&fields=title,author_name,first_publish_year',
    desc: 'Open Library — search books about JavaScript',
    emoji: '📚',
  },
  {
    label: 'Random Fox',
    url: 'https://randomfox.ca/floof/',
    desc: 'Random Fox — because foxes are cool',
    emoji: '🦊',
  },
  {
    label: 'Country Info (NL)',
    url: 'https://restcountries.com/v3.1/alpha/nl',
    desc: 'REST Countries — Netherlands data',
    emoji: '🇳🇱',
  },
]

type ChatMsg = { role: 'user' | 'assistant'; content: string }

export default function APIExplorerPage() {
  const [url, setUrl] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<number | null>(null)
  const [time, setTime] = useState<number | null>(null)

  // Chat state
  const [tab, setTab] = useState<'explorer' | 'chat'>('explorer')
  const [apiKey, setApiKey] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('groq_api_key') ?? '' : '')
  const [showKey, setShowKey] = useState(false)
  const [chatModel, setChatModel] = useState('llama-3.3-70b-versatile')
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('chat_messages') ?? '[]') } catch { return [] }
  })
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages))
  }, [messages])
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

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

  const sendChat = async () => {
    if (!chatInput.trim()) return
    if (!apiKey.trim()) { toast.error('Voer eerst een Groq API key in'); return }
    const newMsg: ChatMsg = { role: 'user', content: chatInput.trim() }
    const updated = [...messages, newMsg]
    setMessages(updated)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: chatModel, messages: updated, max_tokens: 1024 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? `HTTP ${res.status}`)
      const reply = data.choices?.[0]?.message?.content ?? '(no response)'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chat failed')
    } finally {
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">🌐 API Explorer</h1>
        <p className="page-subtitle">Fire off quick API calls and inspect responses</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['explorer', 'chat'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all capitalize flex items-center gap-1.5
              ${tab === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            {t === 'chat' && <MessageSquare size={13} />}{t}
          </button>
        ))}
      </div>

      {tab === 'explorer' && (<>
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
          <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
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
      </>)}

      {/* Chat tab */}
      {tab === 'chat' && (
        <div className="space-y-4">
          {/* Config */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Key size={13} className="text-cyan-400" /> Groq API Key</p>
              <a href="/settings" className="text-xs text-cyan-500 hover:text-cyan-300">⚙️ Beheer in Settings →</a>
            </div>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="input !pr-9"
                  placeholder="gsk_..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
                <button onClick={() => setShowKey(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showKey ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
              <select
                className="input w-auto"
                value={chatModel}
                onChange={e => setChatModel(e.target.value)}
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B (snel)</option>
                <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B</option>
                <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 70B</option>
                <option value="qwen-qwq-32b">Qwen QwQ 32B</option>
                <option value="gemma2-9b-it">Gemma 2 9B</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-600">Key wordt alleen lokaal bewaard in de browser — nooit opgeslagen op een server.</p>
          </div>

          {/* Messages */}
          <div className="card min-h-[320px] max-h-[480px] overflow-y-auto space-y-3 flex flex-col">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-slate-700 text-sm">
                Stuur een bericht om te beginnen…
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-cyan-500/15 text-cyan-100 border border-cyan-500/20'
                    : 'bg-[#141414] text-slate-200 border border-[#1a1a1a]'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#141414] border border-[#1a1a1a] rounded-xl px-3 py-2 text-slate-500 text-sm flex items-center gap-2">
                  <RotateCcw size={12} className="animate-spin" /> Denken…
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Typ een bericht…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
            />
            <button onClick={sendChat} disabled={chatLoading} className="btn-primary">
              {chatLoading ? <RotateCcw size={14} className="animate-spin" /> : <Send size={14} />}
              Stuur
            </button>
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); localStorage.removeItem('chat_messages') }} className="btn-ghost">Wissen</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
