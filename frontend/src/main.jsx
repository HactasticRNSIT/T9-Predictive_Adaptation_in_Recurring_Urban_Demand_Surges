import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, AlertTriangle, BarChart3, Bus, Map, RadioTower, Shield, SlidersHorizontal, Zap } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './styles.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY || ''

const CITY_INTELLIGENCE = {
  Bangalore: {
    center: [12.9716, 77.5946],
    zones: [
      { id: 1, name: 'Whitefield', lat: 12.9698, lng: 77.7500, type: 'IT commute', base: 86 },
      { id: 2, name: 'Indiranagar', lat: 12.9784, lng: 77.6408, type: 'nightlife/event', base: 74 },
      { id: 3, name: 'MG Road', lat: 12.9759, lng: 77.6069, type: 'commercial traffic', base: 82 },
      { id: 4, name: 'Electronic City', lat: 12.8452, lng: 77.6602, type: 'tech corridor', base: 78 },
      { id: 5, name: 'Hebbal', lat: 13.0358, lng: 77.5970, type: 'flyover bottleneck', base: 76 },
      { id: 6, name: 'KR Puram', lat: 13.0076, lng: 77.6959, type: 'rail-road bottleneck', base: 84 },
    ],
  },
  Mumbai: {
    center: [19.0760, 72.8777],
    zones: [
      { id: 1, name: 'Bandra Kurla Complex', lat: 19.0676, lng: 72.8675, type: 'office commute', base: 85 },
      { id: 2, name: 'Andheri', lat: 19.1197, lng: 72.8468, type: 'metro congestion', base: 81 },
      { id: 3, name: 'Dadar', lat: 19.0178, lng: 72.8478, type: 'rail interchange', base: 88 },
      { id: 4, name: 'Colaba', lat: 18.9067, lng: 72.8147, type: 'tourism/event', base: 70 },
      { id: 5, name: 'Powai', lat: 19.1176, lng: 72.9060, type: 'tech campus', base: 73 },
      { id: 6, name: 'Lower Parel', lat: 18.9986, lng: 72.8308, type: 'commercial nightlife', base: 79 },
    ],
  },
  Delhi: {
    center: [28.6139, 77.2090],
    zones: [
      { id: 1, name: 'Connaught Place', lat: 28.6315, lng: 77.2167, type: 'commercial rally', base: 84 },
      { id: 2, name: 'Karol Bagh', lat: 28.6518, lng: 77.1909, type: 'market crowd', base: 76 },
      { id: 3, name: 'Saket', lat: 28.5245, lng: 77.2066, type: 'mall/event', base: 70 },
      { id: 4, name: 'Dwarka', lat: 28.5921, lng: 77.0460, type: 'residential commute', base: 68 },
      { id: 5, name: 'Noida Sector 62', lat: 28.6270, lng: 77.3749, type: 'IT commute', base: 80 },
      { id: 6, name: 'India Gate', lat: 28.6129, lng: 77.2295, type: 'public gathering', base: 82 },
    ],
  },
  Hyderabad: {
    center: [17.3850, 78.4867],
    zones: [
      { id: 1, name: 'HITEC City', lat: 17.4435, lng: 78.3772, type: 'IT commute', base: 86 },
      { id: 2, name: 'Gachibowli', lat: 17.4401, lng: 78.3489, type: 'tech corridor', base: 82 },
      { id: 3, name: 'Jubilee Hills', lat: 17.4326, lng: 78.4071, type: 'nightlife/event', base: 74 },
      { id: 4, name: 'Secunderabad', lat: 17.4399, lng: 78.4983, type: 'rail congestion', base: 83 },
      { id: 5, name: 'Charminar', lat: 17.3616, lng: 78.4747, type: 'festival crowd', base: 78 },
      { id: 6, name: 'Kukatpally', lat: 17.4948, lng: 78.3996, type: 'residential commute', base: 72 },
    ],
  },
  Chennai: {
    center: [13.0827, 80.2707],
    zones: [
      { id: 1, name: 'T Nagar', lat: 13.0418, lng: 80.2341, type: 'shopping crowd', base: 84 },
      { id: 2, name: 'OMR', lat: 12.9349, lng: 80.2295, type: 'IT commute', base: 82 },
      { id: 3, name: 'Guindy', lat: 13.0067, lng: 80.2206, type: 'transport bottleneck', base: 81 },
      { id: 4, name: 'Anna Nagar', lat: 13.0850, lng: 80.2101, type: 'residential commute', base: 69 },
      { id: 5, name: 'Marina Beach', lat: 13.0500, lng: 80.2824, type: 'festival crowd', base: 75 },
      { id: 6, name: 'Velachery', lat: 12.9756, lng: 80.2207, type: 'rain flooding', base: 78 },
    ],
  },
}

const EVENTS = ['IPL Match', 'Bharat Bandh', 'Heavy Rain', 'Political Rally', 'Music Concert', 'Festival Crowd', 'Metro Delay']

const fallbackWeather = {
  Bangalore: { temperature: 27, rainfall: 1.4, severity: 'moderate', label: 'patchy rain' },
  Mumbai: { temperature: 30, rainfall: 5.8, severity: 'high', label: 'coastal showers' },
  Delhi: { temperature: 34, rainfall: 0.2, severity: 'low', label: 'dry haze' },
  Hyderabad: { temperature: 31, rainfall: 0.8, severity: 'moderate', label: 'humid clouds' },
  Chennai: { temperature: 32, rainfall: 3.2, severity: 'high', label: 'monsoon bands' },
}

async function fetchWeather(city) {
  if (!OPENWEATHER_KEY) return fallbackWeather[city]
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&units=metric&appid=${OPENWEATHER_KEY}`)
    if (!res.ok) throw new Error('weather unavailable')
    const data = await res.json()
    const rainfall = data.rain?.['1h'] || data.rain?.['3h'] || 0
    const weatherId = data.weather?.[0]?.id || 800
    const severity = rainfall > 7 || weatherId < 600 ? 'critical' : rainfall > 3 ? 'high' : rainfall > 0 ? 'moderate' : 'low'
    return { temperature: Math.round(data.main?.temp || 28), rainfall, severity, label: data.weather?.[0]?.description || 'live weather' }
  } catch {
    return fallbackWeather[city]
  }
}

async function fetchCityCoordinates(city) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${city}, India`)}`)
    if (!res.ok) throw new Error('geocode unavailable')
    const data = await res.json()
    if (!data.length) throw new Error('city not found')
    return [Number(data[0].lat), Number(data[0].lon)]
  } catch {
    return CITY_INTELLIGENCE[city].center
  }
}

async function api(path, options) {
  const res = await fetch(`${API}${path}`, options)
  if (!res.ok) throw new Error('API request failed')
  return res.json()
}

function App() {
  const [page, setPage] = useState('Dashboard')
  const [zones, setZones] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [apiError, setApiError] = useState('')
  const [selectedZone, setSelectedZone] = useState(1)
  const [selectedCity, setSelectedCity] = useState('Bangalore')
  const [selectedEvent, setSelectedEvent] = useState('IPL Match')
  const [crowdSize, setCrowdSize] = useState(52000)
  const [eventPulse, setEventPulse] = useState(null)
  const [weather, setWeather] = useState(fallbackWeather.Bangalore)
  const [cityCenter, setCityCenter] = useState(CITY_INTELLIGENCE.Bangalore.center)

  useEffect(() => {
    api('/api/zones').then(setZones).catch(() => setApiError('Backend API is not reachable at http://localhost:8000'))
    api('/api/dashboard').then((data) => { setDashboard(data); setApiError('') }).catch(() => setApiError('Backend API is not reachable at http://localhost:8000'))
    const timer = setInterval(() => api('/api/dashboard').then((data) => { setDashboard(data); setApiError('') }).catch(() => setApiError('Backend API is not reachable at http://localhost:8000')), 7000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchWeather(selectedCity).then(setWeather)
    fetchCityCoordinates(selectedCity).then(setCityCenter)
  }, [selectedCity])

  const pages = {
    Dashboard: <Dashboard dashboard={dashboard} selectedZone={selectedZone} setSelectedZone={setSelectedZone} apiError={apiError} selectedCity={selectedCity} setSelectedCity={setSelectedCity} selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} crowdSize={crowdSize} setCrowdSize={setCrowdSize} eventPulse={eventPulse} setEventPulse={setEventPulse} weather={weather} cityCenter={cityCenter} />,
    Forecast: <Forecast zones={zones} selectedZone={selectedZone} setSelectedZone={setSelectedZone} />,
    Anomalies: <Anomalies zones={zones} selectedZone={selectedZone} setSelectedZone={setSelectedZone} />,
    Simulation: <Simulation zones={zones} selectedZone={selectedZone} setSelectedZone={setSelectedZone} />,
    Analytics: <Analytics zones={zones} />,
  }

  return <div className="min-h-screen bg-city-bg text-slate-100">
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,.24),transparent_34%)]" />
    <div className="relative flex min-h-screen">
      <aside className="w-72 border-r border-white/10 bg-slate-950/60 p-5 backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3"><div className="rounded-2xl bg-cyan-400/20 p-3 text-cyan-300"><RadioTower /></div><div><h1 className="text-2xl font-black">SurgeSense</h1><p className="text-xs text-cyan-200">AI Smart City Command</p></div></div>
        {['Dashboard','Forecast','Anomalies','Simulation','Analytics'].map((item) => <button key={item} onClick={() => setPage(item)} className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${page === item ? 'bg-cyan-400/20 text-cyan-200 shadow-glow' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>{icons[item]}{item}</button>)}
      </aside>
      <main className="flex-1 overflow-hidden p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm uppercase tracking-[.45em] text-cyan-300">Live Urban Demand Intelligence</p><h2 className="text-4xl font-black">{page}</h2></div><div className="rounded-full border border-lime-300/30 bg-lime-300/10 px-4 py-2 text-sm text-lime-200">● Simulated live stream</div></div>{pages[page]}</main>
    </div>
  </div>
}

const icons = { Dashboard: <Map size={18}/>, Forecast: <BarChart3 size={18}/>, Anomalies: <AlertTriangle size={18}/>, Simulation: <SlidersHorizontal size={18}/>, Analytics: <Shield size={18}/> }

function Card({ children, className = '' }) { return <div className={`rounded-3xl border border-white/10 bg-white/[.07] p-5 shadow-glow backdrop-blur-xl ${className}`}>{children}</div> }
function Stat({ label, value, icon }) { return <Card><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">{label}</p><h3 className="mt-2 text-3xl font-black">{value}</h3></div><div className="text-cyan-300">{icon}</div></div></Card> }
function ZoneSelect({ zones, value, onChange }) { return <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">{zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}</select> }

function buildCityModel(selectedCity, selectedEvent, crowdSize, eventPulse, weather, cityCenter) {
  const city = CITY_INTELLIGENCE[selectedCity]
  const eventImpact = { 'IPL Match': 18, 'Bharat Bandh': 24, 'Heavy Rain': 21, 'Political Rally': 20, 'Music Concert': 16, 'Festival Crowd': 19, 'Metro Delay': 22 }[selectedEvent]
  const crowdImpact = Math.min(22, crowdSize / 4500)
  const now = new Date()
  const hour = now.getHours()
  const weekend = now.getDay() === 0 || now.getDay() === 6
  const rushImpact = hour >= 8 && hour <= 10 || hour >= 17 && hour <= 20 ? 11 : 0
  const lateNightImpact = hour >= 21 || hour <= 1 ? 8 : 0
  const weekendImpact = weekend ? 7 : 0
  const rainImpact = Math.min(20, weather.rainfall * 2.8) + (weather.severity === 'critical' ? 11 : weather.severity === 'high' ? 7 : 0)
  const heatImpact = weather.temperature > 35 ? 6 : weather.temperature > 31 ? 3 : 0
  const eventLabels = {
    'IPL Match': 'stadium traffic spike',
    'Bharat Bandh': 'civic disruption surge',
    'Heavy Rain': 'rain flooding demand',
    'Political Rally': 'rally crowd surge',
    'Music Concert': 'event exit surge',
    'Festival Crowd': 'festival crowd pressure',
    'Metro Delay': 'metro delay spillover',
  }
  const active = eventPulse?.city === selectedCity ? eventImpact + crowdImpact : 0
  const zones = city.zones.map((zone, index) => {
    const type = zone.type.toLowerCase()
    const transportBoost = type.includes('metro') || type.includes('rail') || type.includes('bottleneck') || type.includes('traffic') ? 9 : 0
    const officeBoost = type.includes('it') || type.includes('tech') || type.includes('office') ? rushImpact : 0
    const nightlifeBoost = type.includes('nightlife') || type.includes('event') ? lateNightImpact + weekendImpact : 0
    const waterloggingBoost = selectedEvent === 'Heavy Rain' || type.includes('rain') ? rainImpact : rainImpact * 0.45
    const eventLocalBoost = type.includes('metro') && selectedEvent === 'Metro Delay' ? 12 : type.includes('rain') && selectedEvent === 'Heavy Rain' ? 14 : type.includes('rally') && selectedEvent === 'Political Rally' ? 12 : index < 2 ? 8 : 3
    const intensity = Math.min(99, Math.round(zone.base + active + eventLocalBoost + officeBoost + nightlifeBoost + waterloggingBoost + heatImpact))
    const anomalyReason = waterloggingBoost > 9 ? 'waterlogging and emergency delay risk' : transportBoost > 0 ? 'transport density and bottleneck pressure' : nightlifeBoost > 0 ? 'late-night crowd clustering' : officeBoost > 0 ? 'office rush-hour demand' : 'synthetic baseline demand variance'
    return {
      ...zone,
      intensity,
      severity: intensity > 90 ? 'Critical' : intensity > 78 ? 'High' : intensity > 66 ? 'Elevated' : 'Stable',
      surge: active ? eventLabels[selectedEvent] : `${zone.type} surge`,
      timestamp: new Date(Date.now() - index * 7 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      traffic: Math.round(900 + intensity * 18 + crowdSize / 180 + rainImpact * 19 + transportBoost * 12),
      utility: Math.round(420 + intensity * 8 + crowdSize / 420 + heatImpact * 18),
      anomalyReason,
    }
  })
  return {
    city: { ...city, center: cityCenter },
    zones,
    heatmap: zones.map(z => ({ lat: z.lat, lng: z.lng, intensity: z.intensity / 100, name: z.name })),
    activity: zones.slice().sort((a, b) => b.intensity - a.intensity),
  }
}

function Dashboard({ dashboard, selectedZone, setSelectedZone, apiError, selectedCity, setSelectedCity, selectedEvent, setSelectedEvent, crowdSize, setCrowdSize, eventPulse, setEventPulse, weather, cityCenter }) {
  if (!dashboard) return <Card><div className="text-cyan-200">Booting city sensors...</div>{apiError && <p className="mt-3 text-red-300">{apiError}. Start the backend with: python -m uvicorn main:app --reload</p>}</Card>
  const model = buildCityModel(selectedCity, selectedEvent, crowdSize, eventPulse, weather, cityCenter)
  const focusedZone = model.zones.find(z => z.id === selectedZone) || model.zones[0]
  const predictionCards = [focusedZone, ...model.zones.filter(z => z.id !== focusedZone.id).slice(0, 2)]
  const criticalCount = model.zones.filter(z => z.severity === 'Critical' || z.severity === 'High').length
  return <div className="grid h-[calc(100vh-130px)] grid-cols-12 gap-5 overflow-y-auto pr-1">
    <Card className="col-span-8 row-span-2 overflow-hidden p-0"><CityMap heatmap={model.heatmap} focusZone={focusedZone} center={model.city.center} /></Card>
    <div className="col-span-4 grid grid-cols-2 gap-4"><Stat label="Rainfall" value={`${weather.rainfall}mm`} icon={<Map/>}/><Stat label="Surge Risk" value={criticalCount} icon={<Zap/>}/><Stat label="Temp" value={`${weather.temperature}°C`} icon={<AlertTriangle/>}/><Stat label="Efficiency" value={`${Math.max(61, 93 - criticalCount * 4)}%`} icon={<Activity/>}/></div>
    <Card className="col-span-4 overflow-hidden"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-xl font-bold">Live Prediction Cards</h3><ZoneSelect zones={model.zones} value={selectedZone} onChange={setSelectedZone}/></div>{predictionCards.map(item => <div key={item.id} className="mb-3 rounded-2xl bg-slate-900/70 p-3"><div className="flex justify-between"><b>{item.name}</b><span className={item.severity === 'Critical' ? 'text-red-300' : 'text-cyan-300'}>{item.intensity}%</span></div><p className="text-xs text-slate-400">{item.surge} · Traffic {item.traffic} · Utility {item.utility}</p></div>)}</Card>
    <Card className="col-span-4"><h3 className="mb-4 text-xl font-bold">Event Intelligence Engine</h3><div className="grid gap-3"><select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedZone(1) }} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">{Object.keys(CITY_INTELLIGENCE).map(city => <option key={city}>{city}</option>)}</select><div className="rounded-xl bg-slate-950/70 p-3 text-sm text-slate-300">Weather: <b className="text-cyan-200">{weather.label}</b> · {weather.severity} severity</div><select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">{EVENTS.map(event => <option key={event}>{event}</option>)}</select><label className="text-sm text-slate-300">Crowd size: {Number(crowdSize).toLocaleString()}</label><input type="range" min="5000" max="120000" step="1000" value={crowdSize} onChange={(e) => setCrowdSize(Number(e.target.value))} /><button onClick={() => setEventPulse({ city: selectedCity, event: selectedEvent, crowdSize, at: Date.now() })} className="rounded-xl bg-cyan-400 px-4 py-3 font-black text-slate-950 shadow-glow">Simulate Event</button></div></Card>
    <Card className="col-span-8"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-bold">Animated Activity Feed</h3><span className="text-sm text-cyan-200">Focus: {selectedCity}</span></div><div className="grid grid-cols-2 gap-3">{model.activity.map(a => <div key={a.id} className="animate-pulse rounded-2xl border border-red-400/20 bg-red-500/10 p-3"><div className="flex justify-between gap-3"><b>{a.name}</b><span className="text-xs text-slate-400">{a.timestamp}</span></div><p className="text-sm text-slate-300">{a.surge} — <span className={a.severity === 'Critical' ? 'text-red-300' : 'text-amber-200'}>{a.severity}</span></p></div>)}</div></Card>
    <Card className="col-span-12"><h3 className="mb-4 text-xl font-bold">Dynamic Anomaly Cards</h3><div className="grid grid-cols-3 gap-3">{model.activity.slice(0, 6).map(a => <div key={a.name} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"><p className="text-xs uppercase text-red-300">{a.severity}</p><h4 className="text-lg font-bold">{a.name}</h4><p className="text-sm text-slate-400">{a.surge} detected at {a.timestamp}</p><p className="mt-2 text-xs text-cyan-200">{a.anomalyReason}</p></div>)}</div></Card>
  </div>
}

function CityMap({ heatmap, focusZone, center }) {
  useEffect(() => {
    if (!heatmap?.length) return
    const mapCenter = focusZone ? [focusZone.lat, focusZone.lng] : center
    const map = L.map('city-map', { zoomControl: false }).setView(mapCenter, focusZone ? 12 : 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    heatmap.forEach((point) => {
      const radius = 360 + point.intensity * 1200
      const color = point.intensity > 0.78 ? '#ef4444' : point.intensity > 0.6 ? '#8b5cf6' : '#22d3ee'
      const isFocused = focusZone?.name === point.name
      L.circle([point.lat, point.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: isFocused ? 0.55 : 0.28,
        weight: isFocused ? 4 : 2,
      }).addTo(map).bindPopup(`<strong>${point.name}</strong><br/>Surge intensity: ${Math.round(point.intensity * 100)}%`)
    })
    return () => map.remove()
  }, [heatmap, focusZone, center])
  return <div id="city-map" className="h-full w-full" />
}

function Forecast({ zones, selectedZone, setSelectedZone }) {
  const [data, setData] = useState([])
  useEffect(() => { api(`/api/forecast?zone_id=${selectedZone}`).then(setData) }, [selectedZone])
  return <Card><div className="mb-5 flex justify-between"><h3 className="text-2xl font-black">Prophet Time-Series Forecast</h3><ZoneSelect zones={zones} value={selectedZone} onChange={setSelectedZone}/></div><div className="h-[560px]"><ResponsiveContainer><AreaChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="timestamp" hide/><YAxis stroke="#94a3b8"/><Tooltip contentStyle={{background:'#020617',border:'1px solid #334155'}}/><Area type="monotone" dataKey="traffic_pred" stroke="#22d3ee" fill="#22d3ee44"/><Area type="monotone" dataKey="utility_pred" stroke="#a3e635" fill="#a3e63533"/></AreaChart></ResponsiveContainer></div></Card>
}

function Anomalies({ zones, selectedZone, setSelectedZone }) {
  const [data, setData] = useState([])
  useEffect(() => { api(`/api/anomalies?zone_id=${selectedZone}`).then(setData) }, [selectedZone])
  return <div className="grid grid-cols-3 gap-5"><Card className="col-span-2"><div className="mb-5 flex justify-between"><h3 className="text-2xl font-black">Isolation Forest Timeline</h3><ZoneSelect zones={zones} value={selectedZone} onChange={setSelectedZone}/></div><div className="h-[520px]"><ResponsiveContainer><LineChart data={data.slice().reverse()}><CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="timestamp" hide/><YAxis stroke="#94a3b8"/><Tooltip contentStyle={{background:'#020617',border:'1px solid #334155'}}/><Line dataKey="value" stroke="#fb7185" strokeWidth={3}/></LineChart></ResponsiveContainer></div></Card><div>{data.map(a => <Card key={a.id} className="mb-4"><p className="text-xs uppercase text-red-300">{a.severity}</p><h4 className="text-xl font-bold">{a.metric} spike</h4><p className="text-slate-400">{a.reason}</p><b>{a.value}</b></Card>)}</div></div>
}

function Simulation({ zones, selectedZone, setSelectedZone }) {
  const [form, setForm] = useState({ buses: 6, sanitation_workers: 10, water_redistribution: 4, emergency_rerouting: 2 })
  const [result, setResult] = useState(null)
  const run = () => api('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zone_id: selectedZone, ...form }) }).then(setResult)
  return <div className="grid grid-cols-2 gap-5"><Card><div className="mb-5 flex justify-between"><h3 className="text-2xl font-black">Adaptive Resource Allocation</h3><ZoneSelect zones={zones} value={selectedZone} onChange={setSelectedZone}/></div>{Object.keys(form).map(k => <label key={k} className="mb-5 block capitalize text-slate-300">{k.replaceAll('_',' ')}<input type="range" min="0" max="20" value={form[k]} onChange={e => setForm({...form, [k]: Number(e.target.value)})} className="mt-2 w-full accent-cyan-300"/><span className="text-cyan-300">{form[k]}</span></label>)}<button onClick={run} className="w-full rounded-2xl bg-cyan-300 px-5 py-4 font-black text-slate-950">Run Simulation</button></Card><Card>{result ? <><h3 className="text-2xl font-black">Before / After</h3><div className="mt-5 grid grid-cols-2 gap-4"><Stat label="Congestion Down" value={`${result.congestion_reduction}%`} icon={<Bus/>}/><Stat label="Efficiency Up" value={`${result.efficiency_increase}%`} icon={<Zap/>}/></div><ResponsiveContainer height={280}><BarChart data={[{name:'Before',risk:result.before_risk},{name:'After',risk:result.after_risk}]}><XAxis dataKey="name" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/><Tooltip/><Bar dataKey="risk" fill="#22d3ee"/></BarChart></ResponsiveContainer><p className="text-lime-200">{result.recommendation}</p></> : <div className="grid h-full place-items-center text-slate-400">Tune resources and run the optimizer.</div>}</Card></div>
}

function Analytics({ zones }) {
  if (!zones.length) return <Card><div className="text-cyan-200">Loading zone analytics...</div></Card>
  return <div className="grid grid-cols-2 gap-5">
    <Card>
      <h3 className="mb-4 text-2xl font-black">Vulnerability Scoring</h3>
      <div className="h-[520px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={zones}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={90} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: '#020617', border: '1px solid #334155' }} />
            <Bar dataKey="vulnerability_score" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
    <Card>
      <h3 className="mb-4 text-2xl font-black">Zone Risk Trends</h3>
      <div className="max-h-[520px] overflow-y-auto pr-2">
        {zones.map(z => <div key={z.id} className="mb-4 rounded-2xl bg-slate-900/70 p-4">
          <div className="flex justify-between"><b>{z.name}</b><span className="text-cyan-300">{z.risk_level}</span></div>
          <div className="mt-3 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-red-400" style={{width:`${z.vulnerability_score}%`}} /></div>
          <p className="mt-2 text-xs text-slate-400">Density {z.population_density}/km² · Historical demand baseline {z.baseline_traffic}</p>
        </div>)}
      </div>
    </Card>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
