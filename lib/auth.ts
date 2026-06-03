import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE_NAME = 'session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('Defina a variavel de ambiente AUTH_SECRET')
  }
  return new TextEncoder().encode(secret)
}

export type SessionUser = {
  id: string
  name: string
  email: string
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    name: user.name,
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getAuthSecret())
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret())

  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
  } as { id?: string; name?: string; email?: string }
}

export const sessionCookieConfig = {
  name: SESSION_COOKIE_NAME,
  maxAge: SESSION_DURATION_SECONDS,
}
