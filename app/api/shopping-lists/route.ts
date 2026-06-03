import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/session-user'
import { ShoppingListModel } from '@/lib/models/shopping-list'
import { toShoppingList } from '@/lib/shopping-list-serializer'

const createListSchema = z.object({
  name: z.string().trim().min(2).max(120),
})

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    await connectToDatabase()

    const lists = await ShoppingListModel.find({})
      .sort({ updatedAt: -1 })
      .lean()

    return NextResponse.json({
      ok: true,
      lists: lists.map((list) => toShoppingList(list)),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao listar listas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createListSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Nome de lista invalido' }, { status: 400 })
    }

    await connectToDatabase()

    const created = await ShoppingListModel.create({
      name: parsed.data.name,
      items: [],
      createdBy: authUser.id,
      sharedWith: [],
      status: 'active',
    })

    return NextResponse.json(
      {
        ok: true,
        list: toShoppingList(created.toObject()),
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao criar lista' }, { status: 500 })
  }
}
