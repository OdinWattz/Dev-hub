'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Wind, Droplets, Eye, RotateCcw, MapPin, Star, Gauge, Cloud, Sunrise, Sunset, Navigation, Thermometer } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

type WeatherData = {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    wind_direction_10m: number
    wind_gusts_10m: number
    weather_code: number
    apparent_temperature: number
    visibility: number
    surface_pressure: number
    uv_index: number
    cloud_cover: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability: number[]
    precipitation: number[]
    snowfall: number[]
    weather_code: number[]
    uv_index: number[]
    wind_speed_10m: number[]
    wind_direction_10m: number[]
    visibility: number[]
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    precipitation_probability_max: number[]
    precipitation_sum: number[]
    snowfall_sum: number[]
    wind_speed_10m_max: number[]
    wind_gusts_10m_max: number[]
    uv_index_max: number[]
    sunrise: string[]
    sunset: string[]
  }
}

type AQIData = {
  hourly: {
    time: string[]
    european_aqi: number[]
    pm2_5: number[]
    pm10: number[]
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

function windDir(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function uvLabel(uv: number): string {
  if (uv < 3) return 'Low'
  if (uv < 6) return 'Moderate'
  if (uv < 8) return 'High'
  if (uv < 11) return 'Very High'
  return 'Extreme'
}

function uvColor(uv: number): string {
  if (uv < 3) return 'text-green-400'
  if (uv < 6) return 'text-yellow-400'
  if (uv < 8) return 'text-orange-400'
  if (uv < 11) return 'text-red-400'
  return 'text-purple-400'
}

function aqiLabel(aqi: number): string {
  if (aqi <= 20) return 'Good'
  if (aqi <= 40) return 'Fair'
  if (aqi <= 60) return 'Moderate'
  if (aqi <= 80) return 'Poor'
  if (aqi <= 100) return 'Very Poor'
  return 'Extremely Poor'
}

function aqiColor(aqi: number): string {
  if (aqi <= 20) return 'text-green-400'
  if (aqi <= 40) return 'text-yellow-400'
  if (aqi <= 60) return 'text-orange-400'
  if (aqi <= 80) return 'text-red-400'
  if (aqi <= 100) return 'text-purple-400'
  return 'text-fuchsia-400'
}

function aqiBgClass(aqi: number): string {
  if (aqi <= 20) return 'stroke-green-500'
  if (aqi <= 40) return 'stroke-yellow-500'
  if (aqi <= 60) return 'stroke-orange-500'
  if (aqi <= 80) return 'stroke-red-500'
  if (aqi <= 100) return 'stroke-purple-500'
  return 'stroke-fuchsia-500'
}

function calcDewPoint(t: number, rh: number): number {
  const a = 17.625, b = 243.04
  const γ = Math.log(rh / 100) + (a * t) / (b + t)
  return (b * γ) / (a - γ)
}

function toF(c: number): number { return c * 9 / 5 + 32 }

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DAY_PERIODS = [
  { label: 'Morning',   icon: '🌅', hours: [6, 7, 8, 9, 10, 11] },
  { label: 'Afternoon', icon: '☀️', hours: [12, 13, 14, 15, 16, 17] },
  { label: 'Evening',   icon: '🌆', hours: [18, 19, 20, 21] },
  { label: 'Night',     icon: '🌙', hours: [22, 23, 0, 1, 2, 3, 4, 5] },
]

export default function WeatherPage() {
  const [city, setCity] = useState('')
  const [location, setLocation] = useState<GeoResult | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [aqi, setAqi] = useState<AQIData | null>(null)
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoResults, setGeoResults] = useState<GeoResult[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [unit, setUnit] = useState<'C' | 'F'>('C')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [savedCities, setSavedCities] = useState<GeoResult[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('weather_saved') ?? '[]') } catch { return [] }
  })

  const fetchAQI = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
        `&hourly=european_aqi,pm2_5,pm10&timezone=auto&forecast_days=1`
      )
      const data = await res.json()
      setAqi(data)
    } catch { /* silently fail */ }
  }, [])

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,surface_pressure,uv_index,cloud_cover` +
        `&hourly=temperature_2m,precipitation_probability,precipitation,snowfall,weather_code,uv_index,wind_speed_10m,wind_direction_10m,visibility` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,snowfall_sum,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunrise,sunset` +
        `&wind_speed_unit=kmh&forecast_days=7&timezone=auto`
      )
      const data = await res.json()
      setWeather(data)
      setLastUpdated(new Date())
      fetchAQI(lat, lon)
    } catch {
      toast.error('Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }, [fetchAQI])

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
    setSelectedDay(null)
    fetchWeather(geo.latitude, geo.longitude)
  }

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await res.json()
          const name = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'My Location'
          const country = data.address?.country ?? ''
          const geo: GeoResult = { name, latitude, longitude, country }
          setLocation(geo); setCity(name); setSelectedDay(null)
          fetchWeather(latitude, longitude)
        } catch {
          const geo: GeoResult = { name: 'My Location', latitude, longitude, country: '' }
          setLocation(geo); setCity('My Location'); setSelectedDay(null)
          fetchWeather(latitude, longitude)
        } finally { setGeoLoading(false) }
      },
      (err) => {
        setGeoLoading(false)
        toast.error(err.code === 1 ? 'Location access denied' : 'Could not get your location')
      }
    )
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const w = weather?.current
  const fmtShort = (c: number) => unit === 'C' ? `${Math.round(c)}°` : `${Math.round(toF(c))}°`
  const fmtTime = (iso: string) => {
    const d = new Date(iso)
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
  }

  const currentAQI = (() => {
    if (!aqi) return null
    const now = new Date()
    const idx = aqi.hourly.time.findIndex(t => new Date(t) >= now)
    const i = Math.max(0, idx === -1 ? 0 : idx - 1)
    return { aqi: aqi.hourly.european_aqi[i], pm25: aqi.hourly.pm2_5[i], pm10: aqi.hourly.pm10[i] }
  })()

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">🌤️ Weather</h1>
          <p className="page-subtitle">Real-time weather via Open-Meteo (no API key needed)</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setUnit(u => u === 'C' ? 'F' : 'C')}
            className="btn-ghost px-2 py-1 text-xs font-mono"
          >
            °{unit === 'C' ? 'C' : 'F'} → °{unit === 'C' ? 'F' : 'C'}
          </button>
          {lastUpdated && (
            <span className="text-[10px] text-slate-600">
              {lastUpdated.getHours().toString().padStart(2, '0')}:{lastUpdated.getMinutes().toString().padStart(2, '0')}
            </span>
          )}
          {location && (
            <button
              onClick={() => fetchWeather(location.latitude, location.longitude)}
              className="btn-ghost px-2 py-1"
              title="Refresh"
              disabled={loading}
            >
              <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
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
          <button
            onClick={detectLocation}
            className="btn-ghost px-3"
            title="Use my location"
            disabled={geoLoading}
          >
            {geoLoading ? <RotateCcw size={14} className="animate-spin" /> : <Navigation size={14} />}
          </button>
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

      {/* Skeleton loader */}
      {loading && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-16 w-24" />
            <Skeleton className="h-3 w-20" />
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/40">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          </div>
          <div className="card">
            <Skeleton className="h-3 w-24 mb-3" />
            <div className="flex gap-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 w-16 shrink-0" />)}
            </div>
          </div>
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
                <p className="text-6xl font-bold text-white">{fmtShort(w.temperature_2m)}</p>
                <p className="text-slate-400 mt-1">{getWeather(w.weather_code).label}</p>
                <p className="text-xs text-slate-600 mt-0.5">Feels like {fmtShort(w.apparent_temperature)}{unit === 'C' ? 'C' : 'F'}</p>
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
                  <p className="text-sm font-semibold text-white">
                    {Math.round(w.wind_speed_10m)} km/h <span className="text-slate-500 text-xs font-normal">{windDir(w.wind_direction_10m)}</span>
                  </p>
                  <p className="text-[10px] text-slate-600">Gusts {Math.round(w.wind_gusts_10m)} km/h</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-purple-400" />
                <div>
                  <p className="text-xs text-slate-500">Visibility</p>
                  <p className="text-sm font-semibold text-white">{Math.round((w.visibility ?? 0) / 1000)} km</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">🔆</span>
                <div>
                  <p className="text-xs text-slate-500">UV Index</p>
                  <p className={`text-sm font-semibold ${uvColor(w.uv_index ?? 0)}`}>
                    {Math.round(w.uv_index ?? 0)} <span className="text-xs font-normal opacity-70">({uvLabel(w.uv_index ?? 0)})</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Gauge size={14} className="text-orange-400" />
                <div>
                  <p className="text-xs text-slate-500">Pressure</p>
                  <p className="text-sm font-semibold text-white">{Math.round(w.surface_pressure ?? 0)} hPa</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer size={14} className="text-teal-400" />
                <div>
                  <p className="text-xs text-slate-500">Dew Point</p>
                  <p className="text-sm font-semibold text-white">
                    {fmtShort(calcDewPoint(w.temperature_2m, w.relative_humidity_2m))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Cloud size={14} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Cloud Cover</p>
                  <p className="text-sm font-semibold text-white">{w.cloud_cover ?? 0}%</p>
                </div>
              </div>
            </div>
            {/* Sunrise / Sunset */}
            {weather?.daily?.sunrise?.[0] && (
              <div className="flex gap-6 mt-4 pt-3 border-t border-slate-700/40">
                <div className="flex items-center gap-2">
                  <Sunrise size={14} className="text-yellow-400" />
                  <div>
                    <p className="text-xs text-slate-500">Sunrise</p>
                    <p className="text-sm font-semibold text-white">{fmtTime(weather.daily.sunrise[0])}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sunset size={14} className="text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-500">Sunset</p>
                    <p className="text-sm font-semibold text-white">{fmtTime(weather.daily.sunset[0])}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Air Quality */}
          {currentAQI !== null && (
            <div className="card mb-4">
              <p className="section-label mb-3">Air Quality (EU AQI)</p>
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="14" fill="none"
                        strokeWidth="3"
                        className={aqiBgClass(currentAQI.aqi)}
                        strokeDasharray={`${Math.min(currentAQI.aqi, 100) * 0.88} 88`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-sm font-bold text-white">{currentAQI.aqi}</span>
                  </div>
                  <p className={`text-xs mt-1 font-medium ${aqiColor(currentAQI.aqi)}`}>{aqiLabel(currentAQI.aqi)}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div>
                    <p className="text-xs text-slate-500">PM2.5</p>
                    <p className="text-sm font-semibold text-white">{currentAQI.pm25?.toFixed(1) ?? '—'} µg/m³</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">PM10</p>
                    <p className="text-sm font-semibold text-white">{currentAQI.pm10?.toFixed(1) ?? '—'} µg/m³</p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                        className={`flex-shrink-0 card text-center py-3 px-2 w-[4.5rem] ${
                          isNow ? 'border-sky-500/40 bg-sky-500/5' : ''
                        }`}
                      >
                        <p className="text-[10px] text-slate-500 mb-1">
                          {isNow ? 'Now' : d.getHours().toString().padStart(2, '0') + ':00'}
                        </p>
                        <p className="text-xl mb-1">{wInfo.emoji}</p>
                        <p className="text-xs font-semibold text-white">
                          {fmtShort(weather.hourly.temperature_2m[hi])}
                        </p>
                        {(() => {
                          const snow = weather.hourly.snowfall[hi] ?? 0
                          const precip = weather.hourly.precipitation[hi] ?? 0
                          if (snow > 0) return <p className="text-[10px] text-sky-200 mt-0.5">❄️{snow.toFixed(1)}cm</p>
                          if (precip > 0) return <p className="text-[10px] text-blue-400 mt-0.5">💧{precip.toFixed(1)}mm</p>
                          if (weather.hourly.precipitation_probability[hi] > 20)
                            return <p className="text-[10px] text-slate-500 mt-0.5">{weather.hourly.precipitation_probability[hi]}%</p>
                          return null
                        })()}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* 7-day forecast */}
          {weather?.daily && (
            <div className="mb-4">
              <p className="section-label mb-3">
                7-Day Forecast <span className="text-slate-600 font-normal text-xs normal-case">— click a day for details</span>
              </p>
              <div className="grid grid-cols-7 gap-2">
                {weather.daily.time.map((date, i) => {
                  const d = new Date(date)
                  const wInfo = getWeather(weather.daily.weather_code[i])
                  const isSelected = selectedDay === i
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDay(isSelected ? null : i)}
                      className={`card text-center py-3 transition-all hover:border-sky-500/40 cursor-pointer ${
                        isSelected ? 'border-sky-500/40 bg-sky-500/5' : ''
                      }`}
                    >
                      <p className="text-[10px] text-slate-500 mb-1">{i === 0 ? 'Today' : WEEKDAYS[d.getDay()]}</p>
                      <p className="text-xl mb-1">{wInfo.emoji}</p>
                      <p className="text-xs font-semibold text-white">{fmtShort(weather.daily.temperature_2m_max[i])}</p>
                      <p className="text-[10px] text-slate-600">{fmtShort(weather.daily.temperature_2m_min[i])}</p>
                      {(weather.daily.snowfall_sum?.[i] ?? 0) > 0 ? (
                        <p className="text-[10px] text-sky-200 mt-1">❄️{weather.daily.snowfall_sum[i].toFixed(1)}cm</p>
                      ) : weather.daily.precipitation_sum[i] > 0 ? (
                        <p className="text-[10px] text-blue-400 mt-1">💧{weather.daily.precipitation_sum[i].toFixed(1)}mm</p>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Day detail panel */}
          {selectedDay !== null && weather?.hourly && weather?.daily && (() => {
            const date = weather.daily.time[selectedDay]
            const d = new Date(date)
            const dayLabel = selectedDay === 0
              ? 'Today'
              : WEEKDAYS[d.getDay()] + ', ' + d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
            const sr = weather.daily.sunrise?.[selectedDay]
            const ss = weather.daily.sunset?.[selectedDay]

            return (
              <div className="card border-sky-500/20 bg-gradient-to-br from-sky-500/3 to-transparent mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{dayLabel}</p>
                    <p className="text-xs text-slate-500">
                      {fmtShort(weather.daily.temperature_2m_min[selectedDay])}
                      {' – '}
                      {fmtShort(weather.daily.temperature_2m_max[selectedDay])}
                      &nbsp;·&nbsp;UV max {Math.round(weather.daily.uv_index_max[selectedDay])}{' '}
                      <span className={uvColor(weather.daily.uv_index_max[selectedDay])}>
                        ({uvLabel(weather.daily.uv_index_max[selectedDay])})
                      </span>
                      &nbsp;·&nbsp;Gusts {Math.round(weather.daily.wind_gusts_10m_max[selectedDay])} km/h
                    </p>
                  </div>
                  {sr && ss && (
                    <div className="flex gap-3 text-xs text-slate-500 shrink-0">
                      <span>🌅 {fmtTime(sr)}</span>
                      <span>🌇 {fmtTime(ss)}</span>
                    </div>
                  )}
                </div>

                {/* Temperature chart */}
                {(() => {
                  const chartData: { hour: string; temp: number }[] = []
                  for (let h = 0; h < 24; h++) {
                    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(h).padStart(2, '0')}:00`
                    const hi = weather.hourly.time.findIndex(t => t === iso)
                    if (hi !== -1) {
                      chartData.push({
                        hour: `${String(h).padStart(2, '0')}:00`,
                        temp: unit === 'C' ? Math.round(weather.hourly.temperature_2m[hi]) : Math.round(toF(weather.hourly.temperature_2m[hi]))
                      })
                    }
                  }
                  if (chartData.length === 0) return null
                  return (
                    <div className="mb-4 -mx-1">
                      <ResponsiveContainer width="100%" height={90}>
                        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }}
                            labelStyle={{ color: '#94a3b8' }}
                            formatter={(v) => [`${v}°${unit}`, 'Temp']}
                          />
                          <Line type="monotone" dataKey="temp" stroke="#38bdf8" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#38bdf8' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })()}

                {DAY_PERIODS.map(period => {
                  const slots = period.hours.flatMap(h => {
                    const targetDate = h < 6 && period.label === 'Night'
                      ? new Date(d.getTime() + 24 * 60 * 60 * 1000)
                      : d
                    const isoPrefix = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}T${String(h).padStart(2, '0')}:00`
                    const slotIdx = weather.hourly.time.findIndex(t => t === isoPrefix)
                    return slotIdx !== -1 ? [{ t: weather.hourly.time[slotIdx], slotIdx }] : []
                  })
                  if (slots.length === 0) return null

                  return (
                    <div key={period.label} className="mb-3 last:mb-0">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                        {period.icon} {period.label}
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-0.5">
                        {slots.map(({ t, slotIdx }) => {
                          const hour = new Date(t)
                          const wInfo = getWeather(weather.hourly.weather_code[slotIdx])
                          const snow = weather.hourly.snowfall[slotIdx] ?? 0
                          const precip = weather.hourly.precipitation[slotIdx] ?? 0
                          const visKm = Math.round((weather.hourly.visibility[slotIdx] ?? 0) / 1000)
                          return (
                            <div key={t} className="flex-shrink-0 bg-slate-800/60 rounded-lg text-center py-2 px-2 w-[4.5rem]">
                              <p className="text-[10px] text-slate-500 mb-1">
                                {hour.getHours().toString().padStart(2, '0')}:00
                              </p>
                              <p className="text-lg mb-1">{wInfo.emoji}</p>
                              <p className="text-xs font-semibold text-white">
                                {fmtShort(weather.hourly.temperature_2m[slotIdx])}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {Math.round(weather.hourly.wind_speed_10m[slotIdx])} km/h
                              </p>
                              {snow > 0 ? (
                                <p className="text-[10px] text-sky-200">❄️{snow.toFixed(1)}cm</p>
                              ) : precip > 0 ? (
                                <p className="text-[10px] text-blue-400">💧{precip.toFixed(1)}mm</p>
                              ) : weather.hourly.precipitation_probability[slotIdx] > 10 ? (
                                <p className="text-[10px] text-slate-500">{weather.hourly.precipitation_probability[slotIdx]}%</p>
                              ) : null}
                              {visKm < 5 && visKm > 0 && (
                                <p className="text-[10px] text-amber-500">👁 {visKm}km</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
