'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DemoContextType {
  isDemoMode: boolean
  setDemoMode: (value: boolean) => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Check if we're in demo mode by looking at the URL parameters
    const url = new URL(window.location.href)
    const demoParam = url.searchParams.get('demo')
    
    if (demoParam === 'true') {
      setIsDemoMode(true)
      
      // Store demo mode in session storage
      sessionStorage.setItem('demoMode', 'true')
      
      // Clean URL by removing demo parameter while preserving history
      url.searchParams.delete('demo')
      window.history.replaceState({}, '', url.toString())
    } else {
      // Check if demo mode is stored in session storage
      const storedDemoMode = sessionStorage.getItem('demoMode')
      if (storedDemoMode === 'true') {
        setIsDemoMode(true)
      }
    }
  }, [])

  const setDemoMode = (value: boolean) => {
    setIsDemoMode(value)
    if (value) {
      sessionStorage.setItem('demoMode', 'true')
    } else {
      sessionStorage.removeItem('demoMode')
    }
  }

  return (
    <DemoContext.Provider value={{ isDemoMode, setDemoMode }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoMode() {
  const context = useContext(DemoContext)
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoProvider')
  }
  return context
} 