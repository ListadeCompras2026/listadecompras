import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { hashPassword } from '@/lib/auth'
import { UserModel } from '@/lib/models/user'

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Dados invalidos' }, { status: 400 })
    }

    const { name, email, password } = parsed.data

    await connectToDatabase()

    const normalizedEmail = email.toLowerCase()
    const existing = await UserModel.findOne({ email: normalizedEmail }).lean()

    if (existing) {
      return NextResponse.json({ ok: false, error: 'E-mail ja cadastrado' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const created = await UserModel.create({
      name,
      email: normalizedEmail,
      passwordHash,
    })

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: String(created._id),
          name: created.name,
          email: created.email,
          avatar: created.avatar,
        },
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao criar usuario' }, { status: 500 })
  }
}
