import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/session-user'
import { ShoppingListModel } from '@/lib/models/shopping-list'
import { toShoppingList } from '@/lib/shopping-list-serializer'

const patchItemSchema = z.object({
  checked: z.boolean().optional(),
  quantity: z.number().int().min(1).max(9999).optional(),
})

type RouteContext = {
  params: Promise<{ listId: string; itemId: string }>
}

type ListItem = {
  id: string
  checked: boolean
  quantity: number
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    const { listId, itemId } = await context.params
    const body = await request.json()
    const parsed = patchItemSchema.safeParse(body)

    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ ok: false, error: 'Dados de atualizacao invalidos' }, { status: 400 })
    }

    await connectToDatabase()

    const list = await ShoppingListModel.findOne({ _id: listId })

    if (!list) {
      return NextResponse.json({ ok: false, error: 'Lista nao encontrada' }, { status: 404 })
    }

    const items = list.items as ListItem[]
    let item: ListItem | undefined
    for (const current of items) {
      if (current.id === itemId) {
        item = current
        break
      }
    }
    if (!item) {
      return NextResponse.json({ ok: false, error: 'Item nao encontrado' }, { status: 404 })
    }

    if (typeof parsed.data.checked === 'boolean') {
      item.checked = parsed.data.checked
    }

    if (typeof parsed.data.quantity === 'number') {
      item.quantity = parsed.data.quantity
    }

    // Editing a completed list reopens it for further changes.
    if (list.status === 'completed') {
      list.status = 'active'
    }

    await list.save()

    return NextResponse.json({
      ok: true,
      list: toShoppingList(list.toObject()),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao atualizar item' }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    const { listId, itemId } = await context.params

    await connectToDatabase()

    const list = await ShoppingListModel.findOne({ _id: listId })

    if (!list) {
      return NextResponse.json({ ok: false, error: 'Lista nao encontrada' }, { status: 404 })
    }

    const items = list.items as ListItem[]
    let itemExists = false
    for (const current of items) {
      if (current.id === itemId) {
        itemExists = true
        break
      }
    }
    if (!itemExists) {
      return NextResponse.json({ ok: false, error: 'Item nao encontrado' }, { status: 404 })
    }

    const nextItems: ListItem[] = []
    for (const current of items) {
      if (current.id !== itemId) {
        nextItems.push(current)
      }
    }

    list.items = nextItems

    // Removing an item from a completed list reopens it.
    if (list.status === 'completed') {
      list.status = 'active'
    }

    await list.save()

    return NextResponse.json({
      ok: true,
      list: toShoppingList(list.toObject()),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao remover item' }, { status: 500 })
  }
}
