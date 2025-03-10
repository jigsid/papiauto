'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function useCheckAdmin() {
  const { user, isLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      // In demo mode, always return true for isAdmin
      const isDemoMode = sessionStorage.getItem('demoMode') === 'true' || 
                         document.cookie.includes('demoMode=true')
      
      if (isDemoMode) {
        setIsAdmin(true)
        return
      }
      
      // Check if user has admin role in publicMetadata
      // This is just a placeholder - implement your actual admin check logic
      const userMetadata = user.publicMetadata
      setIsAdmin(userMetadata.role === 'admin')
    }
  }, [isLoaded, user])

  return { isLoaded, isAdmin }
} 