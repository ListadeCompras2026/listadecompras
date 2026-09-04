import type { BillDocument } from "@/lib/models/bill";
import type { Bill } from "@/lib/types";

export function toBill(doc: BillDocument): Bill {
  return {
    id: String(doc._id),
    name: doc.name,
    amount: doc.amount,
    dueDay: doc.dueDay,
    category: doc.category,
    status: doc.status,
    recurrence: doc.recurrence,
    year: doc.year,
    month: doc.month,
    paidAt: doc.paidAt ? new Date(doc.paidAt) : undefined,
    paymentMethod: doc.paymentMethod ?? undefined,
    notes: doc.notes ?? undefined,
    createdBy: doc.createdBy,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}
