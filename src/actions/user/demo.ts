'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createUser, findUser } from './queries'
import { v4 as uuidv4 } from 'uuid'

/**
 * Creates a demo user with random credentials and signs them in
 * This allows visitors to explore the application without creating an account
 * 
 * Predefined demo values:
 * - First name: Demo
 * - Last name: User
 * - Email: dynamic (demo-{random}@example.com)
 * - Password: dynamic but strong (Demo{random}!)
 */
export const createDemoUser = async () => {
  try {
    // Generate random credentials with a more reliable pattern
    const uniqueId = uuidv4().substring(0, 8)
    const timestamp = Date.now()
    const email = `demo-${uniqueId}-${timestamp}@example.com`
    const password = `Demo${uniqueId}${timestamp.toString().slice(-4)}!`
    const firstName = 'Demo'
    const lastName = 'User'

    console.log(`Creating demo user with email: ${email}`)

    // Create a user in Clerk
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.createUser({
      firstName,
      lastName,
      password,
      emailAddress: [email],
      publicMetadata: {
        isDemo: true,
        createdAt: new Date().toISOString()
      }
    })

    if (!clerkUser) {
      throw new Error('Failed to create demo user')
    }

    console.log(`Demo user created with ID: ${clerkUser.id}`)

    // Create user in our database
    await createUser(
      clerkUser.id,
      firstName,
      lastName,
      email
    )

    // Generate a sign-in token that will be used to authenticate the user
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: clerkUser.id,
      expiresInSeconds: 60 * 60, // 1 hour is enough for demo
    })

    console.log(`Generated sign-in token for demo user`)

    // Return the token for client-side redirection
    return {
      status: 200,
      token: signInToken.token,
      email,
      password,
      userId: clerkUser.id
    }
  } catch (error) {
    console.error('Error creating demo user:', error)
    return { status: 500, error: String(error) }
  }
} 