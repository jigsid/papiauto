'use client'

import { UserButton } from '@clerk/nextjs'

export default function AccountDropdown() {
  return (
    <UserButton afterSignOutUrl="/" />
  )
} 