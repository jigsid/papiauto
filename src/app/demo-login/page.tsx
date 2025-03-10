'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDemoUser } from '@/actions/user/demo'
import { useSignIn } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

export default function DemoLoginPage() {
  const [status, setStatus] = useState<'loading' | 'creating' | 'signing-in' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { signIn, isLoaded } = useSignIn()
  const router = useRouter()

  useEffect(() => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    const performDemoLogin = async () => {
      try {
        if (!isLoaded || !signIn) {
          // If signIn isn't loaded yet, wait and retry
          if (retryCount < MAX_RETRIES) {
            setTimeout(() => setRetryCount(prev => prev + 1), RETRY_DELAY);
            return;
          } else {
            throw new Error('Authentication service not available');
          }
        }

        // Step 1: Create a demo user
        setStatus('creating');
        const demoResult = await createDemoUser();
        
        if (demoResult.status !== 200 || !demoResult.token) {
          throw new Error(demoResult.error || 'Failed to create demo user');
        }

        // Step 2: Sign in with the token
        setStatus('signing-in');
        const signInAttempt = await signIn.create({
          strategy: 'ticket',
          ticket: demoResult.token,
        });

        // Step 3: Complete the sign-in and redirect
        if (signInAttempt.status === 'complete') {
          // Wait a moment to ensure session is established
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Redirect to dashboard
          window.location.href = '/dashboard';
        } else {
          throw new Error('Sign-in not completed successfully');
        }
      } catch (error) {
        console.error('Demo login error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    };

    if (status === 'loading') {
      performDemoLogin();
    }
  }, [isLoaded, signIn, retryCount, status]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-bg">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 rounded-xl shadow-lg backdrop-blur-sm">
        {status === 'error' ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500">Demo Sign-in Failed</h2>
            <p className="mt-2 text-white">{errorMessage || 'An error occurred during demo sign-in'}</p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setStatus('loading')}
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
            <h2 className="mt-4 text-xl font-semibold text-white">
              {status === 'loading' && 'Preparing demo account...'}
              {status === 'creating' && 'Creating your demo account...'}
              {status === 'signing-in' && 'Signing you in...'}
            </h2>
            <p className="mt-2 text-blue-200">Please wait, this will just take a moment</p>
          </div>
        )}
      </div>
    </div>
  );
} 