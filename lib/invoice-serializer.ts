import type { CardInvoiceDocument } from "@/lib/models/invoice";
import type { CardInvoice } from "@/lib/types";

export function toCardInvoice(doc: CardInvoiceDocument): CardInvoice {
  return {
    id: String(doc._id),
    cardId: doc.cardId,
    cardName: doc.cardName,
    year: doc.year,
    month: doc.month,
    amount: doc.amount,
    status: doc.status,
    dueDate: new Date(doc.dueDate),
    paidAt: doc.paidAt ? new Date(doc.paidAt) : undefined,
    notes: doc.notes ?? undefined,
    createdBy: doc.createdBy,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}
