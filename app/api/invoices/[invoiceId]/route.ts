import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { CardInvoiceModel } from "@/lib/models/invoice";
import { toCardInvoice } from "@/lib/invoice-serializer";

const patchInvoiceSchema = z.object({
  amount: z.number().min(0).optional(),
  status: z.enum(["open", "paid"]).optional(),
  notes: z.string().trim().max(240).optional(),
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
    const invoice = await CardInvoiceModel.findOne({
      _id: invoiceId,
      createdBy: authUser.id,
    });
    if (!invoice) {
      return NextResponse.json(
        { ok: false, error: "Fatura nao encontrada" },
        { status: 404 }
      );
    }

    if (typeof parsed.data.amount === "number") {
      invoice.amount = parsed.data.amount;
    }
    if (parsed.data.notes !== undefined) {
      invoice.notes = parsed.data.notes;
    }
    if (parsed.data.status === "paid" && invoice.status !== "paid") {
      invoice.status = "paid";
      invoice.paidAt = new Date();
    }
    if (parsed.data.status === "open" && invoice.status === "paid") {
      invoice.status = "open";
      invoice.paidAt = undefined;
    }

    await invoice.save();
    return NextResponse.json({
      ok: true,
      invoice: toCardInvoice(invoice.toObject()),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao atualizar fatura" },
      { status: 500 }
    );
  }
}
