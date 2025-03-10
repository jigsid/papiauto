'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface DirectDemoLoginProps {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export default function DirectDemoLogin({
  variant = 'default',
  size = 'lg',
  className = '',
}: DirectDemoLoginProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoLogin = async () => {
    try {
      setIsLoading(true)
      
      // Set demo mode in both sessionStorage and cookies
      sessionStorage.setItem('demoMode', 'true')
      document.cookie = 'demoMode=true; path=/; max-age=3600;' // 1 hour expiration
      
      // Redirect directly to dashboard with demo flag to bypass authentication
      window.location.href = '/dashboard?demo=true'
    } catch (error) {
      console.error('Error navigating to demo login:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`relative group ${className}`}
      onClick={handleDemoLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Preparing demo...
        </>
      ) : (
        <>
          Try Demo
          <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        </>
      )}
    </Button>
  )
} 