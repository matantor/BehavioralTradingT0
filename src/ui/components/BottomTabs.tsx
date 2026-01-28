import { NavLink, useLocation } from 'react-router-dom'
import { MOBILE_MAX_WIDTH } from './AppShell'

export default function BottomTabs() {
  const location = useLocation()
  const isOnboarding = location.pathname === '/onboarding'

  if (isOnboarding) return null

  const tabs = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/northstar', label: 'Thesis' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/journal', label: 'Journal' },
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: MOBILE_MAX_WIDTH,
      display: 'flex',
      justifyContent: 'space-around',
      padding: '0.5rem 0',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      boxSizing: 'border-box'
    }}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          style={({ isActive }) => ({
            textDecoration: 'none',
            color: isActive ? '#3b82f6' : '#6b7280',
            fontSize: '0.875rem',
            fontWeight: isActive ? '600' : '400',
            padding: '0.5rem'
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
