export const pad = (value) => String(value).padStart(2, '0')

export function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0))
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`
}

export function formatStudyMinutes(minutes) {
  const safe = Math.max(0, Math.floor(minutes || 0))
  const h = Math.floor(safe / 60)
  const m = safe % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
}
