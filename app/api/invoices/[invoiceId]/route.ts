import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { CardInvoiceModel } from "@/lib/models/invoice";
import { toCardInvoice } from "@/lib/invoice-serializer";
import { findAccessibleCard } from "@/lib/card-access";
import {
  applyBankIfNeeded,
  refundBankIfNeeded,
} from "@/lib/bank-account-service";

const patchInvoiceSchema = z.object({
  amount: z.number().min(0).optional(),
  status: z.enum(["open", "paid"]).optional(),
  notes: z.string().trim().max(240).optional(),
  paymentMethod: z.enum(["credit", "debit", "pix", "cash", "meal"]).optional(),
});

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
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

    const { invoiceId } = await context.params;
    const body = await request.json();
    const parsed = patchInvoiceSchema.safeParse(body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Dados de atualizacao invalidos" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const invoice = await CardInvoiceModel.findById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { ok: false, error: "Fatura nao encontrada" },
        { status: 404 }
      );
    }

    const card = await findAccessibleCard(authUser.id, invoice.cardId);
    if (!card) {
      return NextResponse.json(
        { ok: false, error: "Fatura nao encontrada" },
        { status: 404 }
      );
    }

    const wasPaid = invoice.status === "paid";

    if (typeof parsed.data.amount === "number") {
      invoice.amount = parsed.data.amount;
    }
    if (parsed.data.notes !== undefined) {
      invoice.notes = parsed.data.notes;
    }

    let bankAccount = null;
    if (parsed.data.status === "paid" && !wasPaid) {
      invoice.status = "paid";
      invoice.paidAt = new Date();
      if (parsed.data.paymentMethod) {
        invoice.paymentMethod = parsed.data.paymentMethod;
      }
      bankAccount = await applyBankIfNeeded(
        authUser.id,
        invoice.paymentMethod,
        invoice.amount
      );
    }
    if (parsed.data.status === "open" && wasPaid) {
      bankAccount = await refundBankIfNeeded(
        authUser.id,
        invoice.paymentMethod,
        invoice.amount
      );
      invoice.status = "open";
      invoice.paidAt = undefined;
      invoice.set("paymentMethod", undefined);
    }

    await invoice.save();
    return NextResponse.json({
      ok: true,
      invoice: toCardInvoice(invoice.toObject()),
      bankAccount,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao atualizar fatura" },
      { status: 500 }
    );
  }
}
