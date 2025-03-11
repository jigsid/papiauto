'use client'

import { useUser } from '@clerk/nextjs'
import { useDemoMode } from '@/context/demo-context'

export function useCurrentUser() {
  const { user, isLoaded: isClerkLoaded } = useUser()
  const { isDemoMode, demoUser } = useDemoMode()
  
  // If in demo mode, return the demo user
  if (isDemoMode && demoUser) {
    return {
      user: demoUser,
      isLoaded: true
    }
  }
  
  // Otherwise, return the Clerk user
  return {
    user,
    isLoaded: isClerkLoaded
  }
} 