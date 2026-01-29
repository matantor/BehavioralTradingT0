import { NavLink, useLocation } from 'react-router-dom'
import { MOBILE_MAX_WIDTH } from './AppShell'
import { cn } from '@/lib/utils'

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
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-around py-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      style={{ maxWidth: MOBILE_MAX_WIDTH }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            cn(
              "text-sm p-2 no-underline transition-colors",
              isActive
                ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 dark:text-zinc-400 font-normal hover:text-zinc-700 dark:hover:text-zinc-300"
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
