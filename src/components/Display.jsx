import { useState } from 'react'

export function Stat({ label, value, color }) {
  return (
    <div className="stat-pill">
      <div className={`s-val ${color}`}>{value}</div>
      <div className="s-lbl">{label}</div>
    </div>
  )
}

const STUDY_PRESETS = [15, 25, 30, 45, 60]
const BREAK_PRESETS = [3, 5, 10, 15]

export function SettingNumber({ label, value, onChange }) {
  const [draft, setDraft] = useState(value)
  const isStudy = label.toLowerCase().includes('study')
  const presets = isStudy ? STUDY_PRESETS : BREAK_PRESETS
  const min = 1
  const max = isStudy ? 120 : 60

  const commit = (v) => {
    const clamped = Math.max(min, Math.min(max, v || min))
    setDraft(clamped)
    onChange(clamped)
  }

  return (
    <div className="snum-card">
      <div className="snum-label">{label} <span className="snum-unit">min</span></div>
      <div className="snum-stepper">
        <button
          className="snum-btn"
          onClick={() => commit(draft - (isStudy ? 5 : 1))}
          type="button"
          aria-label="decrease"
        >−</button>
        <input
          className="snum-input"
          type="number"
          min={min}
          max={max}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          onBlur={(e) => commit(Number(e.target.value))}
        />
        <button
          className="snum-btn"
          onClick={() => commit(draft + (isStudy ? 5 : 1))}
          type="button"
          aria-label="increase"
        >+</button>
      </div>
      <div className="snum-presets">
        {presets.map(v => (
          <button
            key={v}
            type="button"
            className={`snum-preset${draft === v ? ' active' : ''}`}
            onClick={() => commit(v)}
          >{v}m</button>
        ))}
      </div>
    </div>
  )
}

export function SettingStat({ label, value }) {
  return (
    <div className="sstat-card">
      <div className="sstat-val">{value}</div>
      <div className="sstat-lbl">{label}</div>
    </div>
  )
}

export function Empty({ icon, text }) {
  return (
    <div className="log-empty">
      <div className="log-empty-icon">{icon}</div>
      <div>{text}</div>
    </div>
  )
}
