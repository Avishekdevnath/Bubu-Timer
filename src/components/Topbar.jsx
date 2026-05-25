import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { pad } from '../lib/format.js'

export function ClockDisplay() {
  const [clock, setClock] = useState('')

  useEffect(() => {
    // Set initial clock value immediately
    const updateClock = () => {
      const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
      const h = d.getHours()
      const ampm = h >= 12 ? 'PM' : 'AM'
      setClock(`${pad(h % 12 || 12)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`)
    }
    
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="clock-pill">
      <div className="clock-hms">{clock.split(' ')[0] || '--:--:--'}</div>
      <div className="clock-loc">{clock.split(' ')[1] || ''} · DHAKA</div>
    </div>
  )
}

export function Topbar({ title, theme, onTheme }) {
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <ClockDisplay />
        <button className="icon-btn" onClick={onTheme} type="button">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </div>
  )
}
