'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSignIn, useClerk } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

export default function TokenSignInPage({ params }: { params: { token: string } }) {
  const { signIn, isLoaded } = useSignIn()
  const clerk = useClerk()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // 1 second

    const verifyToken = async () => {
      try {
        if (!params.token) {
          setError('No token provided')
          return
        }

        if (!isLoaded || !signIn) {
          // Wait for signIn to be loaded
          if (retryCount < MAX_RETRIES) {
            setTimeout(() => setRetryCount(prev => prev + 1), RETRY_DELAY)
          } else {
            setError('Authentication service not available. Please try again.')
          }
          return
        }

        console.log("Verifying token:", params.token)

        // Verify the token and sign in the user
        const signInAttempt = await signIn.create({
          strategy: 'ticket',
          ticket: params.token,
        })

        console.log("Sign-in attempt status:", signInAttempt.status)

        // Force session creation and wait for it to complete
        if (signInAttempt.status === 'complete') {
          // Wait for session to be fully established
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Redirect to dashboard
          console.log("Redirecting to dashboard...")
          window.location.href = '/dashboard' // Use window.location for hard redirect
        } else {
          setError('Failed to sign in with the provided token')
        }
      } catch (err) {
        console.error('Error verifying token:', err)
        setError('An error occurred while signing in')
      }
    }

    if (isLoaded && signIn) {
      verifyToken()
    }
  }, [params.token, signIn, router, isLoaded, retryCount, clerk])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-bg">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 rounded-xl shadow-lg backdrop-blur-sm">
        {error ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500">Sign-in Failed</h2>
            <p className="mt-2 text-white">{error}</p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-white">Signing you in...</h2>
            <p className="mt-2 text-blue-200">Please wait while we prepare your demo account</p>
          </div>
        )}
      </div>
    </div>
  )
} 