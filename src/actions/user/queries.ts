'use server'

import { prisma } from '@/lib/prisma'

export const findUser = async (clerkId: string) => {
  return await prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      subscription: true,
      integrations: true,
    },
  })
}

export const createUser = async (
  clerkId: string,
  email: string,
  firstname?: string,
  lastname?: string
) => {
  return await prisma.user.create({
    data: {
      clerkId,
      email,
      firstname,
      lastname,
      subscription: {
        create: {
          plan: 'PRO'
        },
      },
    },
  })
}

export const updateUser = async (
  clerkId: string,
  data: {
    firstname?: string
    lastname?: string
  }
) => {
  return await prisma.user.update({
    where: {
      clerkId,
    },
    data,
  })
}
