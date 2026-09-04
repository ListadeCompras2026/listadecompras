import type { CreditCardDocument } from "@/lib/models/credit-card";
import type { CreditCard, CreditCardMember } from "@/lib/types";

export function toCreditCard(
  doc: CreditCardDocument,
  extras?: {
    sharedWith?: string[];
    members?: CreditCardMember[];
    isOwner?: boolean;
    isShared?: boolean;
  }
): CreditCard {
  const sharedWith = extras?.sharedWith ?? doc.sharedWith ?? [];
  return {
    id: String(doc._id),
    name: doc.name,
    lastDigits: doc.lastDigits ?? undefined,
    closingDay: doc.closingDay,
    dueDay: doc.dueDay,
    creditLimit:
      typeof doc.creditLimit === "number" ? doc.creditLimit : undefined,
    createdBy: doc.createdBy,
    sharedWith,
    members: extras?.members ?? [],
    isOwner: extras?.isOwner ?? true,
    isShared: extras?.isShared ?? sharedWith.length > 0,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}
