import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { CardInvoiceModel } from "@/lib/models/invoice";
import { CreditCardModel } from "@/lib/models/credit-card";
import { toCardInvoice } from "@/lib/invoice-serializer";
import { dueDateFor, getPeriod } from "@/lib/period";
import { accessibleCardsFilter } from "@/lib/card-access";

const createInvoiceSchema = z.object({
  cardId: z.string().min(1),
  amount: z.number().min(0).default(0),
  year: z.number().int().optional(),
  month: z.number().int().min(0).max(11).optional(),
  notes: z.string().trim().max(240).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const current = getPeriod();
    const year = Number(searchParams.get("year") ?? current.year);
    const month = Number(searchParams.get("month") ?? current.month);

    await connectToDatabase();

    const cards = await CreditCardModel.find(
      accessibleCardsFilter(authUser.id)
    ).lean();
    for (const card of cards) {
      await CardInvoiceModel.findOneAndUpdate(
        { cardId: String(card._id), year, month },
        {
          $setOnInsert: {
            cardId: String(card._id),
            cardName: card.name,
            year,
            month,
            amount: 0,
            status: "open",
            dueDate: dueDateFor(year, month, card.dueDay),
            createdBy: card.createdBy,
          },
        },
        { upsert: true }
      );
    }

    const invoices = await CardInvoiceModel.find({
      cardId: { $in: cards.map((card) => String(card._id)) },
      year,
      month,
    })
      .sort({ dueDate: 1 })
      .lean();

    return NextResponse.json({
      ok: true,
      invoices: invoices.map((invoice) => toCardInvoice(invoice)),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao listar faturas" },
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
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Dados da fatura invalidos" },
        { status: 400 }
      );
    }

    const current = getPeriod();
    const year = parsed.data.year ?? current.year;
    const month = parsed.data.month ?? current.month;

    await connectToDatabase();

    const card = await CreditCardModel.findOne({
      _id: parsed.data.cardId,
      ...accessibleCardsFilter(authUser.id),
    });
    if (!card) {
      return NextResponse.json(
        { ok: false, error: "Cartao nao encontrado" },
        { status: 404 }
      );
    }

    const invoice = await CardInvoiceModel.findOneAndUpdate(
      {
        cardId: String(card._id),
        year,
        month,
      },
      {
        $setOnInsert: {
          cardId: String(card._id),
          cardName: card.name,
          year,
          month,
          amount: parsed.data.amount,
          status: "open",
          dueDate: dueDateFor(year, month, card.dueDay),
          notes: parsed.data.notes,
          createdBy: card.createdBy,
        },
      },
      { new: true, upsert: true }
    );

    if (invoice && invoice.amount === 0 && parsed.data.amount > 0) {
      invoice.amount = parsed.data.amount;
      await invoice.save();
    }

    return NextResponse.json(
      { ok: true, invoice: toCardInvoice(invoice.toObject()) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao criar fatura" },
      { status: 500 }
    );
  }
}
