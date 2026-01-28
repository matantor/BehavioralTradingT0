console.log('App rendered')

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './ui/pages/Onboarding'
import Dashboard from './ui/pages/Dashboard'
import Portfolio from './ui/pages/Portfolio'
import PositionDetail from './ui/pages/PositionDetail'
import Journal from './ui/pages/Journal'
import JournalDetail from './ui/pages/JournalDetail'
import Thoughts from './ui/pages/Thoughts'
import ThoughtDetail from './ui/pages/ThoughtDetail'
import NorthStar from './ui/pages/NorthStar'
import NorthStarEdit from './ui/pages/NorthStarEdit'
import NorthStarHistory from './ui/pages/NorthStarHistory'
import NorthStarVersionDetail from './ui/pages/NorthStarVersionDetail'
import LinkItems from './ui/pages/LinkItems'
import Analytics from './ui/pages/Analytics'
import Settings from './ui/pages/Settings'
import About from './ui/pages/About'
import AppShell from './ui/components/AppShell'
import BottomTabs from './ui/components/BottomTabs'
import { OnboardingService } from '@/domain/services'

// Root redirect component: checks onboarding status
function RootRedirect() {
  // If onboarding completed/skipped, go to dashboard; otherwise go to onboarding
  const target = OnboardingService.isCompleted() ? '/dashboard' : '/onboarding'
  return <Navigate to={target} replace />
}

function TabbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <BottomTabs />
    </AppShell>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        
        <Route path="/onboarding" element={<Onboarding />} />
        
        <Route
          path="/dashboard"
          element={
            <TabbedLayout>
              <Dashboard />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/portfolio"
          element={
            <TabbedLayout>
              <Portfolio />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/positions/:id"
          element={
            <TabbedLayout>
              <PositionDetail />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/journal"
          element={
            <TabbedLayout>
              <Journal />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/journal/:id"
          element={
            <TabbedLayout>
              <JournalDetail />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/thoughts"
          element={
            <TabbedLayout>
              <Thoughts />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/thoughts/:id"
          element={
            <TabbedLayout>
              <ThoughtDetail />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/northstar"
          element={
            <TabbedLayout>
              <NorthStar />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/northstar/edit"
          element={
            <TabbedLayout>
              <NorthStarEdit />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/northstar/history"
          element={
            <TabbedLayout>
              <NorthStarHistory />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/northstar/versions/:id"
          element={
            <TabbedLayout>
              <NorthStarVersionDetail />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/link-items"
          element={
            <TabbedLayout>
              <LinkItems />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/analytics"
          element={
            <TabbedLayout>
              <Analytics />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/settings"
          element={
            <TabbedLayout>
              <Settings />
            </TabbedLayout>
          }
        />
        
        <Route
          path="/about"
          element={
            <TabbedLayout>
              <About />
            </TabbedLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
