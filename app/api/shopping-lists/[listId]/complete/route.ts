import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/session-user'
import { ShoppingListModel } from '@/lib/models/shopping-list'
import { toShoppingList } from '@/lib/shopping-list-serializer'

type RouteContext = {
  params: Promise<{ listId: string }>
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    const { listId } = await context.params

    await connectToDatabase()

    const list = await ShoppingListModel.findOne({
      _id: listId,
      status: 'active',
    })

    if (!list) {
      return NextResponse.json({ ok: false, error: 'Lista nao encontrada' }, { status: 404 })
    }

    list.status = 'completed'
    await list.save()

    return NextResponse.json({
      ok: true,
      list: toShoppingList(list.toObject()),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao finalizar lista' }, { status: 500 })
  }
}
