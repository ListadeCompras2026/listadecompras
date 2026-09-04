import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { PurchaseModel } from "@/lib/models/purchase";
import { ShoppingListModel } from "@/lib/models/shopping-list";
import { toPurchase } from "@/lib/purchase-serializer";
import { toShoppingList } from "@/lib/shopping-list-serializer";
import { addAmountToOpenInvoice } from "@/lib/invoice-service";

const purchaseItemSchema = z.object({
  listItemId: z.string().optional(),
  name: z.string().trim().min(1).max(180),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1).max(20).default("un"),
  category: z.string().trim().max(40).optional(),
  unitPrice: z.number().min(0).optional(),
  totalPrice: z.number().min(0).optional(),
});

const createPurchaseSchema = z
  .object({
    listId: z.string().min(1).optional(),
    name: z.string().trim().min(1).max(180).optional(),
    category: z.string().trim().max(40).optional(),
    source: z.enum(["list", "standalone"]).optional(),
    totalAmount: z.number().positive(),
    paymentMethod: z.enum(["credit", "debit", "pix", "cash", "meal"]),
    store: z.string().trim().max(140).optional(),
    cardId: z.string().min(1).optional(),
    receiptKey: z.string().trim().max(60).optional(),
    receiptUrl: z.string().trim().max(500).optional(),
    completeList: z.boolean().optional(),
    completedAt: z.string().trim().max(30).optional(),
    items: z.array(purchaseItemSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.listId && !data.name) {
      ctx.addIssue({
        code: "custom",
        message: "Informe o nome da despesa",
        path: ["name"],
      });
    }
  });

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const purchases = await PurchaseModel.find({})
      .sort({ completedAt: -1 })
      .lean();

    return NextResponse.json({
      ok: true,
      purchases: purchases.map((purchase) => toPurchase(purchase)),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao listar compras" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createPurchaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Dados de compra invalidos" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (!parsed.data.listId) {
      const completedAt = parsed.data.completedAt
        ? new Date(`${parsed.data.completedAt}T12:00:00`)
        : new Date();

      const purchase = await PurchaseModel.create({
        listId: "",
        listName: parsed.data.name,
        totalAmount: parsed.data.totalAmount,
        paymentMethod: parsed.data.paymentMethod,
        store: parsed.data.store,
        completedAt: Number.isNaN(completedAt.getTime())
          ? new Date()
          : completedAt,
        completedBy: authUser.id,
        items: [],
        cardId: parsed.data.cardId,
        source: "standalone",
        category: parsed.data.category || "others",
      });

      let invoice = null;
      if (parsed.data.paymentMethod === "credit" && parsed.data.cardId) {
        invoice = await addAmountToOpenInvoice(
          authUser.id,
          parsed.data.cardId,
          parsed.data.totalAmount
        );
      }

      return NextResponse.json(
        {
          ok: true,
          purchase: toPurchase(purchase.toObject()),
          invoice,
        },
        { status: 201 }
      );
    }

    const list = await ShoppingListModel.findOne({
      _id: parsed.data.listId,
    });

    if (!list) {
      return NextResponse.json(
        { ok: false, error: "Lista nao encontrada" },
        { status: 404 }
      );
    }

    type ListItem = {
      id: string;
      name: string;
      quantity: number;
      unit: string;
      checked: boolean;
      category: string;
      addedBy: string;
      addedAt: Date;
      unitPrice?: number;
      totalPrice?: number;
    };

    const listItems = list.items as ListItem[];

    const matchedIds = new Set(
      (parsed.data.items ?? [])
        .map((item) => item.listItemId)
        .filter((id): id is string => Boolean(id))
    );

    for (const item of listItems) {
      const payloadItem = (parsed.data.items ?? []).find(
        (entry) => entry.listItemId === item.id
      );
      if (matchedIds.has(item.id)) {
        item.checked = true;
        if (payloadItem?.unitPrice !== undefined)
          item.unitPrice = payloadItem.unitPrice;
        if (payloadItem?.totalPrice !== undefined)
          item.totalPrice = payloadItem.totalPrice;
      }
    }

    const purchasedItems = parsed.data.items?.length
      ? parsed.data.items.map((item, index) => ({
          id: item.listItemId || `receipt-${index}`,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          checked: true,
          category: item.category || "others",
          addedBy: authUser.id,
          addedAt: new Date(),
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        }))
      : listItems.filter((item) => item.checked);

    if (purchasedItems.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nenhum item para registrar na compra" },
        { status: 400 }
      );
    }

    const allChecked =
      listItems.length > 0 && listItems.every((item) => item.checked);
    const shouldComplete = parsed.data.completeList ?? allChecked;
    if (shouldComplete) {
      list.status = "completed";
    } else {
      list.status = "active";
    }

    const purchase = await PurchaseModel.create({
      listId: String(list._id),
      listName: list.name,
      totalAmount: parsed.data.totalAmount,
      paymentMethod: parsed.data.paymentMethod,
      store: parsed.data.store,
      completedAt: new Date(),
      completedBy: authUser.id,
      items: purchasedItems,
      receiptKey: parsed.data.receiptKey,
      receiptUrl: parsed.data.receiptUrl,
      cardId: parsed.data.cardId,
      source: "list",
      category: "shopping",
    });

    await list.save();

    let invoice = null;
    if (parsed.data.paymentMethod === "credit" && parsed.data.cardId) {
      invoice = await addAmountToOpenInvoice(
        authUser.id,
        parsed.data.cardId,
        parsed.data.totalAmount
      );
    }

    return NextResponse.json(
      {
        ok: true,
        purchase: toPurchase(purchase.toObject()),
        list: toShoppingList(list.toObject()),
        invoice,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao finalizar compra" },
      { status: 500 }
    );
  }
}
