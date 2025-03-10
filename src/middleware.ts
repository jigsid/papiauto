import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/payment(.*)',
  '/callback(.*)',
])

// Public routes that should be accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/demo-login',
])

export default clerkMiddleware(async (auth, req) => {
  // Special handling for demo mode
  const url = new URL(req.url)
  const isDemoMode = url.searchParams.get('demo') === 'true' || 
                     req.headers.get('cookie')?.includes('demoMode=true')
  
  // If it's the dashboard and we're in demo mode, bypass authentication
  if (url.pathname.startsWith('/dashboard') && isDemoMode) {
    console.log('Demo mode active - bypassing authentication for', url.pathname)
    return NextResponse.next()
  }
  
  // Regular authentication check for protected routes
  if (isProtectedRoute(req)) {
    try {
      await auth.protect()
    } catch (error) {
      // If authentication fails and it's a dashboard route, check if we should redirect to demo login
      if (url.pathname.startsWith('/dashboard')) {
        // Redirect to home with a demo prompt
        return NextResponse.redirect(new URL('/?demo_prompt=true', req.url))
      }
      throw error
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
