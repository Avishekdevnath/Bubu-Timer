export function filterUsers(users, query) {
  const q = query.trim().toLowerCase()
  if (!q) return users
  return users.filter((u) =>
    (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
}

const SORTERS = {
  name: (u) => (u.displayName || '').toLowerCase(),
  subjects: (u) => u.subjectsCount || 0,
  devices: (u) => u.tokenCount || 0,
  lastSignIn: (u) => (u.lastSignInTime ? new Date(u.lastSignInTime).getTime() : 0),
}

export function sortUsers(users, key, dir) {
  const getter = SORTERS[key]
  if (!getter) return users
  const sorted = [...users].sort((a, b) => {
    const av = getter(a)
    const bv = getter(b)
    if (av < bv) return -1
    if (av > bv) return 1
    return 0
  })
  return dir === 'desc' ? sorted.reverse() : sorted
}
