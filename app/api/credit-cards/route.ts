import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { CreditCardModel } from "@/lib/models/credit-card";
import { serializeCards, serializeCard } from "@/lib/card-access";
import { getOrCreateOpenInvoice } from "@/lib/invoice-service";
import { toCardInvoice } from "@/lib/invoice-serializer";
import { z } from "zod";

const createCardSchema = z.object({
  name: z.string().trim().min(2).max(80),
  lastDigits: z
    .string()
    .trim()
    .regex(/^\d{4}$/)
    .optional()
    .or(z.literal("")),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
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
    const cards = await CreditCardModel.find({
      $or: [{ createdBy: authUser.id }, { sharedWith: authUser.id }],
    })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      ok: true,
      cards: await serializeCards(cards, authUser.id),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao listar cartoes" },
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
    const parsed = createCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Dados do cartao invalidos" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const created = await CreditCardModel.create({
      name: parsed.data.name,
      lastDigits: parsed.data.lastDigits || undefined,
      closingDay: parsed.data.closingDay,
      dueDay: parsed.data.dueDay,
      createdBy: authUser.id,
      sharedWith: [],
    });

    const invoiceResult = await getOrCreateOpenInvoice(
      authUser.id,
      String(created._id)
    );

    return NextResponse.json(
      {
        ok: true,
        card: await serializeCard(created.toObject(), authUser.id),
        invoice: invoiceResult
          ? toCardInvoice(invoiceResult.invoice.toObject())
          : null,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao criar cartao" },
      { status: 500 }
    );
  }
}
