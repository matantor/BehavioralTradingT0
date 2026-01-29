import type { ReactNode } from 'react'

// Mobile-fidelity mode: max-width preserved for MVP (see docs/UI_SYSTEM_SPEC_PATCHES.md Patch 6)
export const MOBILE_MAX_WIDTH = '480px'
const TAB_BAR_HEIGHT = '56px' // pb-14 in Tailwind

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex justify-center">
      <div
        className="w-full bg-white dark:bg-zinc-900 min-h-screen"
        style={{ maxWidth: MOBILE_MAX_WIDTH, paddingBottom: TAB_BAR_HEIGHT }}
      >
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
