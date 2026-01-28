import type { ReactNode } from 'react'

export const MOBILE_MAX_WIDTH = '480px'
const TAB_BAR_HEIGHT = '56px'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: MOBILE_MAX_WIDTH,
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        paddingBottom: TAB_BAR_HEIGHT
      }}>
        <div style={{
          padding: '1rem'
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}
