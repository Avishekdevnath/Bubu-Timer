import { NavLink } from 'react-router-dom'

export function TabBar({ tabs }) {
  return (
    <nav className="tab-bar" role="tablist" aria-label="Primary">
      {tabs.map(({ label, path, icon: Icon }) => (
        <NavLink className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`} key={path} to={path} end={path === '/'}>
          <Icon size={19} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
