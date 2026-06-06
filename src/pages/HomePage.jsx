import { useNavigate } from 'react-router-dom'

const TILES = [
  { label: 'Daily Plan', icon: '📅', path: '/', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { label: 'Subjects', icon: '📚', path: '/subjects', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { label: 'Chat', icon: '💬', path: '/buddy', color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { label: 'Notes', icon: '📝', path: null, color: 'bg-stone-50 text-stone-400 border-stone-100', locked: true },
  { label: 'Checklists', icon: '✅', path: '/buddy/checklists', color: 'bg-teal-50 text-teal-700 border-teal-100' },
  { label: 'Pinned', icon: '📌', path: '/buddy/pins', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  { label: 'Starred', icon: '⭐', path: '/buddy/starred', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  { label: 'Reports', icon: '📊', path: '/reports', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { label: 'Partner', icon: '👥', path: '/partner-settings', color: 'bg-pink-50 text-pink-700 border-pink-100' },
]

export function HomePage() {
  const navigate = useNavigate()
  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <h2 className="text-2xl font-light tracking-tight text-stone-800 mb-1">Study Hub</h2>
      <p className="text-sm text-stone-400 mb-6">All your tools in one place</p>
      <div className="grid grid-cols-3 gap-3">
        {TILES.map((tile) => (
          <button
            key={tile.label}
            disabled={tile.locked}
            onClick={() => tile.path && navigate(tile.path)}
            className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border shadow-sm transition-all aspect-square
              ${tile.locked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.03] active:scale-[0.97]'}
              ${tile.color}`}
          >
            <span className="text-2xl">{tile.icon}</span>
            <span className="text-[11px] font-bold tracking-wide text-center leading-tight">{tile.label}</span>
            {tile.locked && (
              <span className="absolute top-2 right-2 text-[8px] font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">SOON</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
