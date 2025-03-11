'use client'

/**
 * Check if the current session is in demo mode
 * This is a client-side utility function
 */
export function isClientDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('demo') === 'true') return true
  
  // Check sessionStorage
  if (sessionStorage.getItem('demoMode') === 'true') return true
  
  // Check cookies
  if (document.cookie.includes('demoMode=true')) return true
  
  return false
}

/**
 * Set demo mode in client storage
 */
export function setDemoMode(): void {
  if (typeof window === 'undefined') return
  
  // Set in sessionStorage
  sessionStorage.setItem('demoMode', 'true')
  
  // Set in cookies with proper attributes
  document.cookie = 'demoMode=true; path=/; max-age=3600; SameSite=Lax;' // 1 hour expiration
}

/**
 * Clear demo mode from client storage
 */
export function clearDemoMode(): void {
  if (typeof window === 'undefined') return
  
  // Clear from sessionStorage
  sessionStorage.removeItem('demoMode')
  
  // Clear from cookies
  document.cookie = 'demoMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;'
} 