import { pad } from './format.js'

export function dhakaDate(now = new Date()) {
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
}

export function dateKey(date = dhakaDate()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayStr(now = new Date()) {
  return dateKey(dhakaDate(now))
}

export function yesterdayStr(now = new Date()) {
  const d = dhakaDate(now)
  d.setDate(d.getDate() - 1)
  return dateKey(d)
}

export function daysBetween(a, b) {
  const da = new Date(`${a}T00:00:00`)
  const db = new Date(`${b}T00:00:00`)
  return Math.max(0, Math.round((db - da) / 86400000))
}

export function daysLeft(endDate, today = todayStr()) {
  return daysBetween(today, endDate)
}

// minutes-from-midnight -> "h:mm AM/PM"
export function minutesToClock12h(mins) {
  const m = ((mins % 1440) + 1440) % 1440
  const h24 = Math.floor(m / 60)
  const mm = String(m % 60).padStart(2, '0')
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${mm} ${ampm}`
}

// current Dhaka wall-clock as minutes-from-midnight
export function dhakaNowMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka', hour12: false, hour: '2-digit', minute: '2-digit',
  }).formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour').value) % 24
  const min = Number(parts.find((p) => p.type === 'minute').value)
  return h * 60 + min
}
