'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Users, Star, GitFork, Code2, ExternalLink, RotateCcw, BookOpen, AlertCircle, X, GitCommit, Globe, Calendar, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

type GitHubUser = {
  login: string
  name: string
  avatar_url: string
  bio: string
  public_repos: number
  followers: number
  following: number
  company: string
  location: string
  blog: string
  created_at: string
  html_url: string
}

type GitHubRepo = {
  id: number
  name: string
  full_name: string
  description: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  language: string
  html_url: string
  pushed_at: string
  topics: string[]
  size: number
  default_branch: string
  private: boolean
  homepage: string | null
  license: { name: string } | null
}

type RepoDetail = GitHubRepo & {
  languages: Record<string, number>
  commits: { sha: string; commit: { message: string; author: { name: string; date: string } } }[]
  contributors: { login: string; avatar_url: string; contributions: number }[]
}

const LANG_COLORS: Record<string, string> = {
  TypeScript:  'text-blue-400   bg-blue-400/10',
  JavaScript:  'text-yellow-400 bg-yellow-400/10',
  Python:      'text-green-400  bg-green-400/10',
  Rust:        'text-orange-400 bg-orange-400/10',
  Go:          'text-cyan-400   bg-cyan-400/10',
  Java:        'text-red-400    bg-red-400/10',
  'C#':        'text-purple-400 bg-purple-400/10',
  CSS:         'text-pink-400   bg-pink-400/10',
  HTML:        'text-orange-300 bg-orange-300/10',
  Shell:       'text-green-300  bg-green-300/10',
  Vue:         'text-emerald-400 bg-emerald-400/10',
}

const LANG_HEX: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', 'C#': '#178600', CSS: '#563d7c',
  HTML: '#e34c26', Shell: '#89e051', Vue: '#41b883',
}

const DEFAULT_USER = 'OdinWattz'

export default function GitHubPage() {
  const [username, setUsername]         = useState(DEFAULT_USER)
  const [user, setUser]                 = useState<GitHubUser | null>(null)
  const [repos, setRepos]               = useState<GitHubRepo[]>([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [selectedRepo, setSelectedRepo] = useState<RepoDetail | null>(null)
  const [repoLoading, setRepoLoading]   = useState(false)
  const [sortBy, setSortBy]             = useState<'stars' | 'updated' | 'name'>('stars')

  const fetchUser = useCallback(async (u: string) => {
    if (!u.trim()) return
    setLoading(true)
    setError('')
    setUser(null)
    setRepos([])
    setSelectedRepo(null)

    try {
      const [uRes, rRes] = await Promise.all([
        fetch(`https://api.github.com/users/${u.trim()}`),
        fetch(`https://api.github.com/users/${u.trim()}/repos?sort=pushed&per_page=30`),
      ])

      if (!uRes.ok) {
        setError(uRes.status === 404 ? 'User not found' : `GitHub API error: ${uRes.status}`)
        return
      }

      const [userData, repoData] = await Promise.all([uRes.json(), rRes.json()])
      setUser(userData)
      setRepos(Array.isArray(repoData) ? repoData : [])
    } catch {
      setError('Network error — check your connection')
      toast.error('Failed to fetch GitHub data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUser(DEFAULT_USER) }, [fetchUser])

  const openRepo = async (repo: GitHubRepo) => {
    setRepoLoading(true)
    setSelectedRepo(null)
    try {
      const [langRes, commitRes, contribRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${repo.full_name}/languages`),
        fetch(`https://api.github.com/repos/${repo.full_name}/commits?per_page=8`),
        fetch(`https://api.github.com/repos/${repo.full_name}/contributors?per_page=6`),
      ])
      const [languages, commits, contributors] = await Promise.all([
        langRes.ok ? langRes.json() : {},
        commitRes.ok ? commitRes.json() : [],
        contribRes.ok ? contribRes.json() : [],
      ])
      setSelectedRepo({ ...repo, languages, commits: Array.isArray(commits) ? commits : [], contributors: Array.isArray(contributors) ? contributors : [] })
    } catch {
      toast.error('Failed to load repo details')
    } finally {
      setRepoLoading(false)
    }
  }

  const sortedRepos = [...repos].sort((a, b) => {
    if (sortBy === 'stars')   return b.stargazers_count - a.stargazers_count
    if (sortBy === 'updated') return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
    return a.name.localeCompare(b.name)
  })

  const QUICK_USERS = ['torvalds', 'gaearon', 'sindresorhus', 'tj', 'yyx990803']

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="page-title">🐙 GitHub Stats</h1>
        <p className="page-subtitle">Explore any GitHub profile & repositories</p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              className="input pl-10"
              placeholder="GitHub username…"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchUser(username)}
            />
          </div>
          <button onClick={() => fetchUser(username)} disabled={loading} className="btn-primary">
            {loading ? <RotateCcw size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-slate-600">Quick:</span>
          {QUICK_USERS.map(u => (
            <button key={u} onClick={() => { setUsername(u); fetchUser(u) }}
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
              @{u}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-500/20 bg-red-500/5 flex items-center gap-3 mb-6">
          <AlertCircle size={16} className="text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: profile + repo list */}
          <div className={selectedRepo || repoLoading ? 'lg:col-span-1' : 'lg:col-span-3'}>
            {/* Profile */}
            <div className="card mb-4">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar_url} alt={user.login} className="w-14 h-14 rounded-full border-2 border-slate-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-bold text-white">{user.name || user.login}</h2>
                      <p className="text-xs text-slate-500">@{user.login}</p>
                    </div>
                    <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="btn-ghost py-0.5 px-2 text-xs">
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  {user.bio && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{user.bio}</p>}
                  <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] text-slate-500">
                    {user.company  && <span>🏢 {user.company}</span>}
                    {user.location && <span>📍 {user.location}</span>}
                    <span>📅 {new Date(user.created_at).getFullYear()}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/40 text-center">
                <div>
                  <p className="text-lg font-bold text-white">{user.public_repos}</p>
                  <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1"><BookOpen size={9} /> Repos</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{user.followers.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1"><Users size={9} /> Followers</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{user.following}</p>
                  <p className="text-[10px] text-slate-600">Following</p>
                </div>
              </div>
            </div>

            {/* Sort tabs */}
            <div className="flex gap-1 mb-3">
              {(['stars', 'updated', 'name'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all capitalize
                    ${sortBy === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Repo list */}
            <div className={`${selectedRepo || repoLoading ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'}`}>
              {sortedRepos.map(repo => (
                <button
                  key={repo.id}
                  onClick={() => openRepo(repo)}
                  className={`w-full card text-left transition-all group hover:border-cyan-500/40
                    ${selectedRepo?.id === repo.id ? 'border-cyan-500/60 bg-cyan-500/5' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-semibold text-cyan-400 group-hover:text-cyan-300 truncate">{repo.name}</h3>
                    {repo.private && <span className="tag bg-slate-700/50 text-slate-500 border border-slate-700 text-[9px] ml-1 flex-shrink-0">private</span>}
                  </div>
                  {!(selectedRepo || repoLoading) && repo.description && (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-1">{repo.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    {repo.language && (
                      <span className={`tag ${LANG_COLORS[repo.language] ?? 'text-slate-400 bg-slate-400/10'} border-0 py-0`}>
                        <Code2 size={8} className="mr-0.5" />{repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5"><Star size={9} className="text-yellow-500" />{repo.stargazers_count}</span>
                    <span className="flex items-center gap-0.5"><GitFork size={9} />{repo.forks_count}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: repo detail panel */}
          {(selectedRepo || repoLoading) && (
            <div className="lg:col-span-2">
              {repoLoading ? (
                <div className="card flex items-center justify-center py-20 text-slate-600">
                  <RotateCcw size={20} className="animate-spin mr-2" /> Loading repo details…
                </div>
              ) : selectedRepo ? (
                <RepoDetailPanel repo={selectedRepo} onClose={() => setSelectedRepo(null)} />
              ) : null}
            </div>
          )}
        </div>
      )}

      {!user && !loading && !error && (
        <div className="card text-center py-16 text-slate-700">
          <p className="text-5xl mb-3">🐙</p>
          <p className="text-sm">Laden…</p>
        </div>
      )}
    </div>
  )
}

function RepoDetailPanel({ repo, onClose }: { repo: RepoDetail; onClose: () => void }) {
  const totalBytes = Object.values(repo.languages).reduce((a, b) => a + b, 0)
  const LANG_HEX: Record<string, string> = {
    TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
    Rust: '#dea584', Go: '#00ADD8', 'C#': '#178600', CSS: '#563d7c',
    HTML: '#e34c26', Shell: '#89e051', Vue: '#41b883',
  }
  const LC: Record<string, string> = {
    TypeScript: 'text-blue-400', JavaScript: 'text-yellow-400', Python: 'text-green-400',
    Rust: 'text-orange-400', Go: 'text-cyan-400', 'C#': 'text-purple-400',
    CSS: 'text-pink-400', HTML: 'text-orange-300', Shell: 'text-green-300', Vue: 'text-emerald-400',
  }

  return (
    <div className="card border-cyan-500/20 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors"><ChevronLeft size={16} /></button>
            <h2 className="text-lg font-bold text-white">{repo.name}</h2>
          </div>
          {repo.description && <p className="text-sm text-slate-400 ml-6">{repo.description}</p>}
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors"><X size={15} /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Stars',  val: repo.stargazers_count,  color: 'text-yellow-400' },
          { label: 'Forks',  val: repo.forks_count,       color: 'text-cyan-400'   },
          { label: 'Issues', val: repo.open_issues_count, color: 'text-orange-400' },
          { label: 'Size',   val: `${Math.round(repo.size / 1024 * 10) / 10} MB`, color: 'text-purple-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/40">
            <p className={`text-sm font-bold ${color}`}>{val}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><GitCommit size={11} /> <code className="text-cyan-400">{repo.default_branch}</code></span>
        <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(repo.pushed_at).toLocaleDateString()}</span>
        {repo.license && <span>📄 {repo.license.name}</span>}
        {repo.homepage && (
          <a href={repo.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-500 hover:text-cyan-300">
            <Globe size={11} /> {repo.homepage.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>

      {/* Topics */}
      {repo.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.map(t => (
            <span key={t} className="tag bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px]">{t}</span>
          ))}
        </div>
      )}

      {/* Language bar */}
      {Object.keys(repo.languages).length > 0 && (
        <div>
          <p className="section-label mb-2">Languages</p>
          <div className="flex rounded-full overflow-hidden h-2 mb-2">
            {Object.entries(repo.languages).map(([lang, bytes]) => (
              <div key={lang}
                style={{ width: `${(bytes / totalBytes) * 100}%`, backgroundColor: LANG_HEX[lang] ?? '#64748b' }}
                title={`${lang}: ${((bytes / totalBytes) * 100).toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(repo.languages).map(([lang, bytes]) => (
              <span key={lang} className={`flex items-center gap-1 text-xs ${LC[lang] ?? 'text-slate-400'}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: LANG_HEX[lang] ?? '#64748b' }} />
                {lang} <span className="text-slate-600">{((bytes / totalBytes) * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Commits */}
      {repo.commits.length > 0 && (
        <div>
          <p className="section-label mb-2">Recent Commits</p>
          <div className="space-y-1.5">
            {repo.commits.slice(0, 6).map(c => (
              <div key={c.sha} className="flex items-start gap-2 text-xs">
                <code className="text-slate-600 font-mono flex-shrink-0">{c.sha.slice(0, 7)}</code>
                <span className="text-slate-300 flex-1 line-clamp-1">{c.commit.message.split('\n')[0]}</span>
                <span className="text-slate-600 flex-shrink-0">{c.commit.author.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contributors */}
      {repo.contributors.length > 0 && (
        <div>
          <p className="section-label mb-2">Contributors</p>
          <div className="flex gap-3 flex-wrap">
            {repo.contributors.map(c => (
              <div key={c.login} className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.avatar_url} alt={c.login} className="w-6 h-6 rounded-full border border-slate-700" />
                <span className="text-xs text-slate-400">{c.login}</span>
                <span className="text-[10px] text-slate-600">{c.contributions}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
