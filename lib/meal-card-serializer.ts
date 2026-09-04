import type { MealCard } from "@/lib/types";

export function toMealCard(doc: {
  _id: { toString(): string } | string;
  name: string;
  lastDigits?: string | null;
  balance: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}): MealCard {
  return {
    id: String(doc._id),
    name: doc.name,
    lastDigits: doc.lastDigits ?? undefined,
    balance: Number(doc.balance.toFixed(2)),
    createdBy: doc.createdBy,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}
