import type { CreditCardDocument } from "@/lib/models/credit-card";
import type { CreditCard } from "@/lib/types";

export function toCreditCard(doc: CreditCardDocument): CreditCard {
  return {
    id: String(doc._id),
    name: doc.name,
    lastDigits: doc.lastDigits ?? undefined,
    closingDay: doc.closingDay,
    dueDay: doc.dueDay,
    createdBy: doc.createdBy,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}
