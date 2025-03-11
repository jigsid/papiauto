'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Demo user data
const DEMO_USER = {
  id: 'demo-user-id',
  firstName: 'Demo',
  lastName: 'User',
  email: 'demo@example.com',
  createdAt: new Date().toISOString(),
  // Add any other user data needed for the demo
  subscription: {
    status: 'active',
    plan: 'pro',
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  },
  // Add demo data for any other features
  integrations: [
    {
      id: 'demo-integration-1',
      name: 'Instagram',
      token: 'demo-token',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    }
  ]
}

interface DemoContextType {
  isDemoMode: boolean
  demoUser: typeof DEMO_USER | null
  exitDemoMode: () => void
}

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  demoUser: null,
  exitDemoMode: () => {}
})

export const useDemoMode = () => useContext(DemoContext)

interface DemoProviderProps {
  children: ReactNode
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoUser, setDemoUser] = useState<typeof DEMO_USER | null>(null)

  useEffect(() => {
    // Check if we're in demo mode
    const checkDemoMode = () => {
      const isDemoMode = sessionStorage.getItem('demoMode') === 'true' || 
                         document.cookie.includes('demoMode=true')
      
      setIsDemoMode(isDemoMode)
      
      // If in demo mode, set the demo user data
      if (isDemoMode) {
        setDemoUser(DEMO_USER)
      } else {
        setDemoUser(null)
      }
    }

    checkDemoMode()
    
    // Listen for storage changes (in case demo mode is toggled in another tab)
    const handleStorageChange = () => {
      checkDemoMode()
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Function to exit demo mode
  const exitDemoMode = () => {
    setIsDemoMode(false)
    setDemoUser(null)
    sessionStorage.removeItem('demoMode')
    document.cookie = 'demoMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
    window.location.href = '/' // Return to home page
  }

  return (
    <DemoContext.Provider value={{ isDemoMode, demoUser, exitDemoMode }}>
      {children}
    </DemoContext.Provider>
  )
} 