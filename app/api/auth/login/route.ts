import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { createSessionToken, sessionCookieConfig, verifyPassword } from '@/lib/auth'
import { UserModel } from '@/lib/models/user'

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Credenciais invalidas' }, { status: 400 })
    }

    const { email, password } = parsed.data

    await connectToDatabase()

    const normalizedEmail = email.toLowerCase()
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+passwordHash')

    if (!user) {
      return NextResponse.json({ ok: false, error: 'E-mail ou senha invalidos' }, { status: 401 })
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json({ ok: false, error: 'E-mail ou senha invalidos' }, { status: 401 })
    }

    user.lastLoginAt = new Date()
    await user.save()

    const token = await createSessionToken({
      id: String(user._id),
      name: user.name,
      email: user.email,
    })

    const response = NextResponse.json({
      ok: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    })

    response.cookies.set(sessionCookieConfig.name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sessionCookieConfig.maxAge,
    })

    return response
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao autenticar' }, { status: 500 })
  }
}
