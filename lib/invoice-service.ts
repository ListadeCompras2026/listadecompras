import { CardInvoiceModel } from "@/lib/models/invoice";
import { dueDateFor, currentInvoicePeriod } from "@/lib/period";
import { toCardInvoice } from "@/lib/invoice-serializer";
import { findAccessibleCard } from "@/lib/card-access";
import type { CardInvoice } from "@/lib/types";

export async function getOrCreateOpenInvoice(userId: string, cardId: string) {
  const card = await findAccessibleCard(userId, cardId);
  if (!card) return null;

  const period = currentInvoicePeriod(card.closingDay);
  const existing = await CardInvoiceModel.findOne({
    cardId: String(card._id),
    year: period.year,
    month: period.month,
  });

  if (existing) {
    return { card, invoice: existing };
  }

  const created = await CardInvoiceModel.create({
    cardId: String(card._id),
    cardName: card.name,
    year: period.year,
    month: period.month,
    amount: 0,
    status: "open",
    dueDate: dueDateFor(period.year, period.month, card.dueDay),
    createdBy: card.createdBy,
  });

  return { card, invoice: created };
}

export async function addAmountToOpenInvoice(
  userId: string,
  cardId: string,
  amount: number
): Promise<CardInvoice | null> {
  const result = await getOrCreateOpenInvoice(userId, cardId);
  if (!result) return null;

  result.invoice.amount = Number((result.invoice.amount + amount).toFixed(2));
  if (result.invoice.status === "paid") {
    result.invoice.status = "open";
    result.invoice.set("paidAt", null);
    result.invoice.set("paymentMethod", undefined);
  }
  await result.invoice.save();
  return toCardInvoice(result.invoice.toObject());
}
