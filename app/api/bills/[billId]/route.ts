import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { BillModel } from "@/lib/models/bill";
import { toBill } from "@/lib/bill-serializer";
import { addAmountToOpenInvoice } from "@/lib/invoice-service";

const patchBillSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  amount: z.number().min(0).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  category: z
    .enum([
      "housing",
      "utilities",
      "transport",
      "health",
      "education",
      "subscriptions",
      "insurance",
      "taxes",
      "others",
    ])
    .optional(),
  status: z.enum(["pending", "paid"]).optional(),
  paymentMethod: z.enum(["credit", "debit", "pix", "cash", "meal"]).optional(),
  notes: z.string().trim().max(240).optional(),
  cardId: z.string().min(1).optional(),
});

type RouteContext = {
  params: Promise<{ billId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const { billId } = await context.params;
    const body = await request.json();
    const parsed = patchBillSchema.safeParse(body);

    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Dados de atualizacao invalidos" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const bill = await BillModel.findOne({
      _id: billId,
      createdBy: authUser.id,
    });
    if (!bill) {
      return NextResponse.json(
        { ok: false, error: "Conta nao encontrada" },
        { status: 404 }
      );
    }

    const wasPaid = bill.status === "paid";
    const nextStatus = parsed.data.status ?? bill.status;

    if (parsed.data.name) bill.name = parsed.data.name;
    if (typeof parsed.data.amount === "number")
      bill.amount = parsed.data.amount;
    if (typeof parsed.data.dueDay === "number")
      bill.dueDay = parsed.data.dueDay;
    if (parsed.data.category) bill.category = parsed.data.category;
    if (parsed.data.notes !== undefined) bill.notes = parsed.data.notes;
    if (parsed.data.paymentMethod)
      bill.paymentMethod = parsed.data.paymentMethod;

    if (nextStatus === "paid" && !wasPaid) {
      bill.status = "paid";
      bill.paidAt = new Date();
      if (parsed.data.paymentMethod === "credit" && parsed.data.cardId) {
        await addAmountToOpenInvoice(
          authUser.id,
          parsed.data.cardId,
          bill.amount
        );
      }
    }

    if (nextStatus === "pending" && wasPaid) {
      bill.status = "pending";
      bill.paidAt = undefined;
    }

    await bill.save();

    return NextResponse.json({ ok: true, bill: toBill(bill.toObject()) });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao atualizar conta" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const { billId } = await context.params;
    await connectToDatabase();

    const deleted = await BillModel.findOneAndDelete({
      _id: billId,
      createdBy: authUser.id,
    });
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: "Conta nao encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao excluir conta" },
      { status: 500 }
    );
  }
}
