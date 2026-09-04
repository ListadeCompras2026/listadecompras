import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { CreditCardModel } from "@/lib/models/credit-card";
import { CardInvoiceModel } from "@/lib/models/invoice";
import { toCreditCard } from "@/lib/credit-card-serializer";

const patchCardSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  lastDigits: z
    .string()
    .trim()
    .regex(/^\d{4}$/)
    .optional()
    .or(z.literal("")),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
});

type RouteContext = {
  params: Promise<{ cardId: string }>;
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

    const { cardId } = await context.params;
    const body = await request.json();
    const parsed = patchCardSchema.safeParse(body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Dados de atualizacao invalidos" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const card = await CreditCardModel.findOne({
      _id: cardId,
      createdBy: authUser.id,
    });
    if (!card) {
      return NextResponse.json(
        { ok: false, error: "Cartao nao encontrado" },
        { status: 404 }
      );
    }

    if (parsed.data.name) card.name = parsed.data.name;
    if (parsed.data.lastDigits !== undefined)
      card.lastDigits = parsed.data.lastDigits || undefined;
    if (typeof parsed.data.closingDay === "number")
      card.closingDay = parsed.data.closingDay;
    if (typeof parsed.data.dueDay === "number")
      card.dueDay = parsed.data.dueDay;
    await card.save();

    if (parsed.data.name) {
      await CardInvoiceModel.updateMany(
        { cardId, createdBy: authUser.id, status: "open" },
        { $set: { cardName: parsed.data.name } }
      );
    }

    return NextResponse.json({ ok: true, card: toCreditCard(card.toObject()) });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao atualizar cartao" },
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

    const { cardId } = await context.params;
    await connectToDatabase();

    const deleted = await CreditCardModel.findOneAndDelete({
      _id: cardId,
      createdBy: authUser.id,
    });
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: "Cartao nao encontrado" },
        { status: 404 }
      );
    }

    await CardInvoiceModel.deleteMany({ cardId, createdBy: authUser.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao excluir cartao" },
      { status: 500 }
    );
  }
}
