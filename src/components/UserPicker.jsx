import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { filterUsers } from '../features/admin/userStats.js'

export function UserPicker({ users, value, onChange, placeholder = 'Search user by name, email or uid (blank = everyone)' }) {
  const [search, setSearch] = useState('')
  const matches = users && search.trim() ? filterUsers(users, search).slice(0, 6) : []

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-800 truncate">{value.displayName || '(no name)'}</p>
          <p className="text-xs text-stone-400 truncate">{value.email}</p>
        </div>
        <button onClick={() => onChange(null)}
          className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 shrink-0" aria-label="Clear target user">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
      <input className="field-in pl-8" placeholder={placeholder}
        value={search} onChange={(e) => setSearch(e.target.value)} />
      {matches.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          {matches.map((u) => (
            <button key={u.uid} onClick={() => { onChange(u); setSearch('') }}
              className="w-full text-left px-3 py-2 hover:bg-stone-50 border-b border-stone-100 last:border-0">
              <p className="text-sm font-medium text-stone-800 truncate">{u.displayName || '(no name)'}</p>
              <p className="text-xs text-stone-400 truncate">{u.email} · {u.uid}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
