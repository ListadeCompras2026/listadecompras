import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/session-user'
import { ShoppingListModel } from '@/lib/models/shopping-list'
import { UserModel } from '@/lib/models/user'
import { toShoppingList } from '@/lib/shopping-list-serializer'

const shareSchema = z.object({
  email: z.string().trim().email(),
})

type RouteContext = {
  params: Promise<{ listId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    const { listId } = await context.params
    const body = await request.json()
    const parsed = shareSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'E-mail invalido' }, { status: 400 })
    }

    await connectToDatabase()

    const normalizedEmail = parsed.data.email.toLowerCase()
    const targetUser = await UserModel.findOne({ email: normalizedEmail }).lean()

    if (!targetUser) {
      return NextResponse.json({ ok: false, error: 'Usuario nao encontrado' }, { status: 404 })
    }

    if (String(targetUser._id) === authUser.id) {
      return NextResponse.json({ ok: false, error: 'Voce ja possui acesso a lista' }, { status: 400 })
    }

    const list = await ShoppingListModel.findOne({
      _id: listId,
      createdBy: authUser.id,
      status: 'active',
    })

    if (!list) {
      return NextResponse.json({ ok: false, error: 'Lista nao encontrada' }, { status: 404 })
    }

    const targetUserId = String(targetUser._id)
    if (!list.sharedWith.includes(targetUserId)) {
      list.sharedWith.push(targetUserId)
      await list.save()
    }

    return NextResponse.json({
      ok: true,
      list: toShoppingList(list.toObject()),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao compartilhar lista' }, { status: 500 })
  }
}
