import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// This middleware handles both demo mode and regular authentication
export default clerkMiddleware((auth, req) => {
  const url = new URL(req.url)
  const isDemoMode = url.searchParams.get('demo') === 'true' || 
                     req.headers.get('cookie')?.includes('demoMode=true')
  
  // If it's a dashboard route and we're in demo mode, bypass authentication completely
  if (url.pathname.startsWith('/dashboard') && isDemoMode) {
    console.log('Demo mode active - bypassing authentication for', url.pathname)
    return NextResponse.next()
  }
  
  // For non-demo routes, let Clerk handle authentication normally
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
