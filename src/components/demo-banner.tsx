'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Info, X } from 'lucide-react'

export default function DemoBanner() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Check if we're in demo mode
    const checkDemoMode = () => {
      const isDemoMode = sessionStorage.getItem('demoMode') === 'true' || 
                         document.cookie.includes('demoMode=true')
      setIsDemoMode(isDemoMode)
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
    sessionStorage.removeItem('demoMode')
    document.cookie = 'demoMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
    window.location.href = '/' // Return to home page
  }

  if (!isDemoMode || !isVisible) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-500 text-black py-2 px-4 flex items-center justify-between text-sm font-medium"
    >
      <div className="flex items-center gap-x-2">
        <Info className="w-4 h-4" />
        <span>
          You are in <strong>Demo Mode</strong> with full access to all features.
        </span>
        <button 
          onClick={exitDemoMode}
          className="ml-2 px-2 py-1 bg-black text-white rounded-md text-xs hover:bg-gray-800 transition-colors"
        >
          Exit Demo
        </button>
      </div>
      <button onClick={() => setIsVisible(false)} aria-label="Hide demo banner">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
} 