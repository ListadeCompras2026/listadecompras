import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/session-user'
import { ShoppingListModel } from '@/lib/models/shopping-list'
import { toShoppingList } from '@/lib/shopping-list-serializer'

const createItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(9999),
  unit: z.string().trim().min(1).max(20),
  category: z.string().trim().min(1).max(40),
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
    const parsed = createItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Dados de item invalidos' }, { status: 400 })
    }

    await connectToDatabase()

    const list = await ShoppingListModel.findOne({ _id: listId })

    if (!list) {
      return NextResponse.json({ ok: false, error: 'Lista nao encontrada' }, { status: 404 })
    }

    list.items.push({
      id: randomUUID(),
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      category: parsed.data.category,
      checked: false,
      addedBy: authUser.id,
      addedAt: new Date(),
    })

    // Any new item means the list is active again.
    if (list.status === 'completed') {
      list.status = 'active'
    }

    await list.save()

    return NextResponse.json({
      ok: true,
      list: toShoppingList(list.toObject()),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao adicionar item' }, { status: 500 })
  }
}
