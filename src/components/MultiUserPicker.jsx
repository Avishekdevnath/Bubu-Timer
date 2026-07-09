import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { filterUsers } from '../features/admin/userStats.js'

export function MultiUserPicker({ users, value, onChange, placeholder = 'Search user by name, email or uid (blank = everyone)' }) {
  const [search, setSearch] = useState('')
  const selectedUids = new Set(value.map((u) => u.uid))
  const matches = users && search.trim()
    ? filterUsers(users, search).filter((u) => !selectedUids.has(u.uid)).slice(0, 6)
    : []

  function add(u) {
    onChange([...value, u])
    setSearch('')
  }

  function remove(uid) {
    onChange(value.filter((u) => u.uid !== uid))
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((u) => (
            <span key={u.uid} className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-full pl-3 pr-1.5 py-1 text-xs">
              <span className="font-medium text-stone-700">{u.displayName || u.email}</span>
              <button onClick={() => remove(u.uid)} className="p-0.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200" aria-label={`Remove ${u.email}`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
        <input className="field-in pl-8" placeholder={value.length > 0 ? 'Add another user…' : placeholder}
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {matches.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
            {matches.map((u) => (
              <button key={u.uid} onClick={() => add(u)}
                className="w-full text-left px-3 py-2 hover:bg-stone-50 border-b border-stone-100 last:border-0">
                <p className="text-sm font-medium text-stone-800 truncate">{u.displayName || '(no name)'}</p>
                <p className="text-xs text-stone-400 truncate">{u.email} · {u.uid}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
