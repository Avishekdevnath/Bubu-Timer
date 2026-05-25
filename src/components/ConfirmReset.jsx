import { AppModal } from './AppModal.jsx'
import { createDefaultState } from '../state/defaultState.js'

export function ConfirmReset({ onClose, persistState, setAppState }) {
  return (
    <AppModal title="Full Reset?" onClose={onClose}>
      <p className="text-sm text-stone-500 mb-4">Clears all subjects, sessions, bank minutes, and progress. Cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={() => { const clean = createDefaultState(); persistState(clean); setAppState(clean); onClose() }}
          className="flex-1 py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">
          Yes, Reset All
        </button>
        <button onClick={onClose}
          className="flex-1 py-3 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors">
          Cancel
        </button>
      </div>
    </AppModal>
  )
}
