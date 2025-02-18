'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    // Force theme application on mount
    document.documentElement.classList.add(props.defaultTheme || 'dark')
  }, [props.defaultTheme])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
