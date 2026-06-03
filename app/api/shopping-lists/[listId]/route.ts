import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/session-user'
import { ShoppingListModel } from '@/lib/models/shopping-list'

type RouteContext = {
  params: Promise<{ listId: string }>
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    const { listId } = await context.params

    await connectToDatabase()

    const deleted = await ShoppingListModel.findOneAndDelete({
      _id: listId,
    }).lean()

    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'Lista nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao excluir lista' }, { status: 500 })
  }
}
