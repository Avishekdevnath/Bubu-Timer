export const pad = (value) => String(value).padStart(2, '0')

export function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0))
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`
}

// seconds -> "MM:SS" or "H:MM:SS"; negative (overtime) -> "+MM:SS" / "+H:MM:SS"
export function formatRemaining(sec) {
  const neg = sec < 0
  const s = Math.abs(Math.floor(sec))
  const hh = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  const body = hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`
  return `${neg ? '+' : ''}${body}`
}

export function formatStudyMinutes(minutes) {
  const safe = Math.max(0, Math.floor(minutes || 0))
  const h = Math.floor(safe / 60)
  const m = safe % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
}
