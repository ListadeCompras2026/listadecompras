import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { sessionCookieConfig, verifySessionToken } from '@/lib/auth'
import { UserModel } from '@/lib/models/user'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(sessionCookieConfig.name)?.value

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    const payload = await verifySessionToken(token)
    if (!payload.id) {
      return NextResponse.json({ ok: false, error: 'Sessao invalida' }, { status: 401 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(payload.id).lean()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario nao encontrado' }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Sessao invalida' }, { status: 401 })
  }
}
