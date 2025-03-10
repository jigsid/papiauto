'use client'

import { useEffect, useState, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Info, X } from 'lucide-react'

interface DemoModeWrapperProps {
  children: ReactNode
}

export default function DemoModeWrapper({ children }: DemoModeWrapperProps) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Check if we're in demo mode by looking at the URL or storage
    const checkDemoMode = () => {
      // Check URL param
      const urlParams = new URLSearchParams(window.location.search)
      const demoParam = urlParams.get('demo')
      
      if (demoParam === 'true') {
        setIsDemoMode(true)
        
        // Store in both sessionStorage and cookies for better persistence
        sessionStorage.setItem('demoMode', 'true')
        document.cookie = 'demoMode=true; path=/; max-age=3600;' // 1 hour expiration
        
        // Remove the demo parameter from URL
        urlParams.delete('demo')
        const newUrl = window.location.pathname + 
          (urlParams.toString() ? `?${urlParams.toString()}` : '') + 
          window.location.hash
        window.history.replaceState({}, '', newUrl)
      } else {
        // Check storage
        const storedDemoMode = sessionStorage.getItem('demoMode') === 'true' || 
                              document.cookie.includes('demoMode=true')
        if (storedDemoMode) {
          setIsDemoMode(true)
        }
      }
    }

    checkDemoMode()
    
    // Listen for path changes
    const handleRouteChange = () => {
      checkDemoMode()
    }
    
    window.addEventListener('popstate', handleRouteChange)
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  // Function to exit demo mode if needed
  const exitDemoMode = () => {
    setIsDemoMode(false)
    sessionStorage.removeItem('demoMode')
    document.cookie = 'demoMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
    window.location.href = '/' // Return to home page
  }

  if (!isDemoMode) {
    return <>{children}</>
  }

  return (
    <>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 bg-yellow-500 text-black py-2 px-4 flex items-center justify-between text-sm font-medium"
        >
          <div className="flex items-center gap-x-2">
            <Info className="w-5 h-5" />
            <span>
              You are in <strong>Demo Mode</strong> with full access to all features. 
              Changes will not be saved.
            </span>
            <button 
              onClick={exitDemoMode}
              className="ml-2 px-2 py-1 bg-black text-white rounded-md text-xs hover:bg-gray-800 transition-colors"
            >
              Exit Demo
            </button>
          </div>
          <button onClick={() => setIsVisible(false)} aria-label="Hide demo banner">
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
      {children}
    </>
  )
} 