'use client'

import { useState, useEffect } from 'react'
import { Search, Wind, Droplets, Eye, RotateCcw, MapPin, Star } from 'lucide-react'
import toast from 'react-hot-toast'

type WeatherData = {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    apparent_temperature: number
    visibility: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability: number[]
    weather_code: number[]
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    precipitation_probability_max: number[]
  }
}

type GeoResult = { name: string; latitude: number; longitude: number; country: string; admin1?: string }

const WMO: Record<number, { label: string; emoji: string }> = {
  0:  { label: 'Clear sky',        emoji: '☀️' },
  1:  { label: 'Mainly clear',     emoji: '🌤️' },
  2:  { label: 'Partly cloudy',    emoji: '⛅' },
  3:  { label: 'Overcast',         emoji: '☁️' },
  45: { label: 'Foggy',            emoji: '🌫️' },
  48: { label: 'Icy fog',          emoji: '🌫️' },
  51: { label: 'Light drizzle',    emoji: '🌦️' },
  61: { label: 'Light rain',       emoji: '🌧️' },
  63: { label: 'Moderate rain',    emoji: '🌧️' },
  65: { label: 'Heavy rain',       emoji: '🌧️' },
  71: { label: 'Light snow',       emoji: '🌨️' },
  73: { label: 'Moderate snow',    emoji: '❄️' },
  75: { label: 'Heavy snow',       emoji: '❄️' },
  80: { label: 'Rain showers',     emoji: '🌦️' },
  95: { label: 'Thunderstorm',     emoji: '⛈️' },
  99: { label: 'Thunderstorm+hail',emoji: '⛈️' },
}

function getWeather(code: number) {
  const nearest = Object.keys(WMO).map(Number).reduce((a, b) =>
    Math.abs(b - code) < Math.abs(a - code) ? b : a
  )
  return WMO[nearest] ?? { label: 'Unknown', emoji: '❓' }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeatherPage() {
  const [city, setCity] = useState('')
  const [location, setLocation] = useState<GeoResult | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [geoResults, setGeoResults] = useState<GeoResult[]>([])
  const [savedCities, setSavedCities] = useState<GeoResult[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('weather_saved') ?? '[]') } catch { return [] }
  })

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility` +
        `&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&wind_speed_unit=kmh&forecast_days=7&timezone=auto`
      )
      const data = await res.json()
      setWeather(data)
    } catch {
      toast.error('Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  const searchCity = async () => {
    if (!city.trim()) return
    setGeoResults([])
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`)
      const data = await res.json()
      if (data.results?.length) {
        setGeoResults(data.results)
      } else {
        toast.error('City not found')
      }
    } catch {
      toast.error('Geocoding failed')
    }
  }

  const selectCity = (geo: GeoResult) => {
    setLocation(geo)
    setGeoResults([])
    setCity(geo.name)
    fetchWeather(geo.latitude, geo.longitude)
  }

  const toggleSave = (geo: GeoResult) => {
    setSavedCities(prev => {
      const exists = prev.some(c => c.name === geo.name && c.country === geo.country)
      const next = exists
        ? prev.filter(c => !(c.name === geo.name && c.country === geo.country))
        : [...prev, geo].slice(0, 8)
      localStorage.setItem('weather_saved', JSON.stringify(next))
      toast(exists ? 'Removed from favourites' : '⭐ Added to favourites')
      return next
    })
  }

  const isSaved = (geo: GeoResult | null) =>
    geo ? savedCities.some(c => c.name === geo.name && c.country === geo.country) : false

  // Auto-load with Beilen as default
  useEffect(() => {
    fetchWeather(52.861, 6.513)
    setLocation({ name: 'Beilen', latitude: 52.861, longitude: 6.513, country: 'Netherlands' })
    setCity('Beilen')
  }, [])

  const w = weather?.current

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="page-title">🌤️ Weather</h1>
        <p className="page-subtitle">Real-time weather via Open-Meteo (no API key needed)</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              className="input !pl-10"
              placeholder="Search city…"
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchCity()}
            />
          </div>
          <button onClick={searchCity} className="btn-primary">
            <Search size={14} /> Search
          </button>
        </div>
        {/* Dropdown */}
        {geoResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 card z-10 py-1">
            {geoResults.map((g, i) => (
              <button
                key={i}
                onClick={() => selectCity(g)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors text-slate-300"
              >
                {g.name}{g.admin1 ? `, ${g.admin1}` : ''} — {g.country}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Saved cities */}
      {savedCities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {savedCities.map(c => (
            <button
              key={`${c.name}-${c.country}`}
              onClick={() => selectCity(c)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-all
                ${location?.name === c.name && location?.country === c.country
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
            >
              <Star size={9} className="fill-yellow-400 text-yellow-400" />
              {c.name}
              <span className="text-slate-600">{c.country}</span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="card flex items-center justify-center py-16 text-slate-600">
          <RotateCcw size={20} className="animate-spin mr-2" /> Fetching weather…
        </div>
      )}

      {w && location && !loading && (
        <>
          {/* Current */}
          <div className="card mb-4 bg-gradient-to-br from-sky-500/5 to-cyan-500/5 border-sky-500/20">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={13} className="text-sky-400" />
              <span className="text-sm text-slate-300">{location.name}, {location.country}</span>
              <button
                onClick={() => toggleSave(location)}
                className="ml-auto btn-ghost px-2 py-1"
                title={isSaved(location) ? 'Remove from favourites' : 'Save city'}
              >
                <Star size={13} className={isSaved(location) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-6xl font-bold text-white">{Math.round(w.temperature_2m)}°</p>
                <p className="text-slate-400 mt-1">{getWeather(w.weather_code).label}</p>
                <p className="text-xs text-slate-600 mt-0.5">Feels like {Math.round(w.apparent_temperature)}°C</p>
              </div>
              <p className="text-7xl">{getWeather(w.weather_code).emoji}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700/40">
              <div className="flex items-center gap-2">
                <Droplets size={14} className="text-blue-400" />
                <div>
                  <p className="text-xs text-slate-500">Humidity</p>
                  <p className="text-sm font-semibold text-white">{w.relative_humidity_2m}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind size={14} className="text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-500">Wind</p>
                  <p className="text-sm font-semibold text-white">{Math.round(w.wind_speed_10m)} km/h</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-purple-400" />
                <div>
                  <p className="text-xs text-slate-500">Visibility</p>
                  <p className="text-sm font-semibold text-white">{Math.round((w.visibility ?? 0) / 1000)} km</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly forecast – next 24 hours */}
          {weather?.hourly && (() => {
            const now = new Date()
            const startIdx = weather.hourly.time.findIndex(t => new Date(t) >= now)
            const idx = startIdx === -1 ? 0 : startIdx
            const slice = weather.hourly.time.slice(idx, idx + 24)
            return (
              <div className="mb-4">
                <p className="section-label mb-3">Next 24 Hours</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {slice.map((t, i) => {
                    const d = new Date(t)
                    const hi = idx + i
                    const wInfo = getWeather(weather.hourly.weather_code[hi])
                    const isNow = i === 0
                    return (
                      <div
                        key={t}
                        className={`flex-shrink-0 card text-center py-3 px-2 w-16 ${
                          isNow ? 'border-sky-500/40 bg-sky-500/5' : ''
                        }`}
                      >
                        <p className="text-[10px] text-slate-500 mb-1">
                          {isNow ? 'Now' : d.getHours().toString().padStart(2, '0') + ':00'}
                        </p>
                        <p className="text-xl mb-1">{wInfo.emoji}</p>
                        <p className="text-xs font-semibold text-white">
                          {Math.round(weather.hourly.temperature_2m[hi])}°
                        </p>
                        {weather.hourly.precipitation_probability[hi] > 20 && (
                          <p className="text-[10px] text-blue-400 mt-1">
                            💧{weather.hourly.precipitation_probability[hi]}%
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* 7-day forecast */}
          {weather?.daily && (
            <div>
              <p className="section-label mb-3">7-Day Forecast</p>
              <div className="grid grid-cols-7 gap-2">
                {weather.daily.time.map((date, i) => {
                  const d = new Date(date)
                  const wInfo = getWeather(weather.daily.weather_code[i])
                  return (
                    <div key={date} className="card text-center py-3">
                      <p className="text-[10px] text-slate-500 mb-1">{i === 0 ? 'Today' : WEEKDAYS[d.getDay()]}</p>
                      <p className="text-xl mb-1">{wInfo.emoji}</p>
                      <p className="text-xs font-semibold text-white">{Math.round(weather.daily.temperature_2m_max[i])}°</p>
                      <p className="text-[10px] text-slate-600">{Math.round(weather.daily.temperature_2m_min[i])}°</p>
                      {weather.daily.precipitation_probability_max[i] > 20 && (
                        <p className="text-[10px] text-blue-400 mt-1">💧{weather.daily.precipitation_probability_max[i]}%</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
