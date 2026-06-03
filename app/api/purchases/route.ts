import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/session-user'
import { PurchaseModel } from '@/lib/models/purchase'
import { ShoppingListModel } from '@/lib/models/shopping-list'
import { toPurchase } from '@/lib/purchase-serializer'
import { toShoppingList } from '@/lib/shopping-list-serializer'

const createPurchaseSchema = z.object({
  listId: z.string().min(1),
  totalAmount: z.number().positive(),
  paymentMethod: z.enum(['credit', 'debit', 'pix', 'cash', 'meal']),
  store: z.string().trim().max(140).optional(),
})

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    await connectToDatabase()

    const purchases = await PurchaseModel.find({})
      .sort({ completedAt: -1 })
      .lean()

    return NextResponse.json({
      ok: true,
      purchases: purchases.map((purchase) => toPurchase(purchase)),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao listar compras' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createPurchaseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Dados de compra invalidos' }, { status: 400 })
    }

    await connectToDatabase()

    const list = await ShoppingListModel.findOne({
      _id: parsed.data.listId,
      status: 'active',
    })

    if (!list) {
      return NextResponse.json({ ok: false, error: 'Lista nao encontrada' }, { status: 404 })
    }

    const checkedItems = list.items.filter((item) => item.checked)
    if (checkedItems.length === 0) {
      return NextResponse.json({ ok: false, error: 'Nenhum item marcado para compra' }, { status: 400 })
    }

    const purchase = await PurchaseModel.create({
      listId: String(list._id),
      listName: list.name,
      totalAmount: parsed.data.totalAmount,
      paymentMethod: parsed.data.paymentMethod,
      store: parsed.data.store,
      completedAt: new Date(),
      completedBy: authUser.id,
      items: checkedItems,
    })

    list.status = 'completed'
    await list.save()

    return NextResponse.json(
      {
        ok: true,
        purchase: toPurchase(purchase.toObject()),
        list: toShoppingList(list.toObject()),
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao finalizar compra' }, { status: 500 })
  }
}
