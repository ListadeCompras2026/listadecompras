import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/session-user'
import { PushSubscriptionModel } from '@/lib/models/push-subscription'

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = subscriptionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Assinatura invalida' }, { status: 400 })
    }

    await connectToDatabase()

    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: parsed.data.endpoint },
      {
        userId: authUser.id,
        endpoint: parsed.data.endpoint,
        keys: parsed.data.keys,
        userAgent: request.headers.get('user-agent') || undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao salvar assinatura' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = unsubscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Assinatura invalida' }, { status: 400 })
    }

    await connectToDatabase()

    await PushSubscriptionModel.deleteOne({
      userId: authUser.id,
      endpoint: parsed.data.endpoint,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao remover assinatura' }, { status: 500 })
  }
}
