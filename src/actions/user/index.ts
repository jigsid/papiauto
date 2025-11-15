'use server'

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createUser, findUser } from './queries'
import { refreshToken } from '@/lib/fetch'
import { updateIntegration } from '../integrations/queries'
import { createDemoUser } from './demo'
import { isDemoMode, getDemoOrRealUser, protectWithDemoMode } from './demo-wrapper'

export { createDemoUser }

// Demo user data for server actions
const DEMO_USER_DATA = {
  id: 'demo-user-id',
  firstname: 'Demo',
  lastname: 'User',
  email: 'demo@example.com',
  subscription: {
    status: 'active',
    plan: 'PRO' as 'PRO' | 'FREE',
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  integrations: [
    {
      id: 'demo-integration-1',
      name: 'Instagram',
      token: 'demo-token',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    }
  ]
}

export const onCurrentUser = async () => {
  return await protectWithDemoMode(() => currentUser())
}

export const onBoardUser = async () => {
  // If in demo mode, return demo user data
  if (await isDemoMode()) {
    return {
      status: 200,
      data: {
        firstname: DEMO_USER_DATA.firstname,
        lastname: DEMO_USER_DATA.lastname,
      },
    }
  }

  const user = await onCurrentUser()
  try {
    const found = await findUser(user.id)
    if (found) {
      if (found.integrations.length > 0) {
        const today = new Date()
        const time_left =
          found.integrations[0].expiresAt?.getTime()! - today.getTime()

        const days = Math.round(time_left / (1000 * 3600 * 24))
        if (days < 5) {
          console.log('refresh')

          try {
            const refresh = await refreshToken(found.integrations[0].token)

            const today = new Date()
            const expire_date = today.setDate(today.getDate() + 60)

            const update_token = await updateIntegration(
              refresh.access_token,
              new Date(expire_date),
              found.integrations[0].id
            )
            if (!update_token) {
              console.log('Update token failed')
            }
          } catch (error: any) {
            // Token refresh failed - token may be expired or invalid
            // Log the error but continue without crashing
            console.error('Failed to refresh Instagram token:', error?.response?.data || error?.message || error)
            // The integration will need to be re-authenticated
          }
        }
      }

      return {
        status: 200,
        data: {
          firstname: found.firstname,
          lastname: found.lastname,
        },
      }
    }
    const created = await createUser(
      user.id,
      user.firstName!,
      user.lastName!,
      user.emailAddresses[0].emailAddress
    )
    return { status: 201, data: created }
  } catch (error) {
    console.log(error)
    return { status: 500 }
  }
}

export const onUserInfo = async () => {
  // If in demo mode, return demo user data
  if (await isDemoMode()) {
    return { status: 200, data: DEMO_USER_DATA }
  }

  const user = await onCurrentUser()
  try {
    const profile = await findUser(user.id)
    if (profile) return { status: 200, data: profile }

    return { status: 404 }
  } catch (error) {
    return { status: 500 }
  }
}
