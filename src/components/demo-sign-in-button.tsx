'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface DemoSignInButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export default function DemoSignInButton({
  variant = 'default',
  size = 'lg',
  className = '',
}: DemoSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDemoSignIn = async () => {
    try {
      setIsLoading(true)
      
      // Redirect to the direct demo login page
      window.location.href = '/demo-login'
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
      onClick={handleDemoSignIn}
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