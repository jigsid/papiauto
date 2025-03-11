'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Demo user data
const DEMO_USER = {
  id: 'demo-user-id',
  firstName: 'Demo',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'demo@example.com' }],
  imageUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=random',
  createdAt: new Date().toISOString(),
  // Add data needed for the dashboard
  subscription: {
    status: 'active',
    plan: 'PRO' as 'PRO' | 'FREE',
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  integrations: [
    {
      id: 'demo-integration-1',
      name: 'Instagram',
      token: 'demo-token',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    }
  ]
}

// Check if the request is in demo mode
export async function isDemoMode() {
  const cookieStore = cookies()
  return cookieStore.get('demoMode')?.value === 'true'
}

// Get the current user, either from Clerk or demo data
export async function getDemoOrRealUser(clerkUserFn: () => Promise<any>) {
  if (await isDemoMode()) {
    return DEMO_USER
  }
  
  try {
    return await clerkUserFn()
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Protect a route, allowing demo mode to bypass
export async function protectWithDemoMode(clerkUserFn: () => Promise<any>, redirectPath = '/sign-in') {
  if (await isDemoMode()) {
    return DEMO_USER
  }
  
  try {
    const user = await clerkUserFn()
    if (!user) redirect(redirectPath)
    return user
  } catch (error) {
    console.error('Error protecting route:', error)
    redirect(redirectPath)
  }
} 