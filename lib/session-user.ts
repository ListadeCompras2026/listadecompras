import { cookies } from 'next/headers'
import { connectToDatabase } from '@/lib/mongodb'
import { sessionCookieConfig, verifySessionToken } from '@/lib/auth'
import { UserModel } from '@/lib/models/user'

export type AuthenticatedUser = {
  id: string
  name: string
  email: string
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionCookieConfig.name)?.value

  if (!token) {
    return null
  }

  const payload = await verifySessionToken(token)
  if (!payload.id) {
    return null
  }

  await connectToDatabase()

  const user = await UserModel.findById(payload.id).lean()
  if (!user) {
    return null
  }

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
  }
}
