export function messagesToday(rooms, nowMs) {
  const midnight = new Date(nowMs)
  midnight.setHours(0, 0, 0, 0)
  const cutoff = midnight.getTime()
  let count = 0
  for (const room of Object.values(rooms || {})) {
    for (const msg of Object.values(room?.chat || {})) {
      if ((msg.ts || 0) >= cutoff) count++
    }
  }
  return count
}

export function roomTimestamps(room) {
  const joins = ['A', 'B'].map((s) => room?.[s]?.joinedAt || 0).filter(Boolean)
  const updates = ['A', 'B'].map((s) => room?.[s]?.updatedAt || 0)
  const chatTimes = Object.values(room?.chat || {}).map((m) => m.ts || 0)
  const created = joins.length ? Math.min(...joins) : 0
  const lastActive = Math.max(0, ...updates, ...chatTimes)
  return { created, lastActive }
}

export function filterRooms(rooms, query) {
  const entries = Object.entries(rooms || {})
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(([code, room]) => {
    if (code.toLowerCase().includes(q)) return true
    return ['A', 'B'].some((s) => (room?.[s]?.name || '').toLowerCase().includes(q))
  })
}
