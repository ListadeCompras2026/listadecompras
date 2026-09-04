import type { BankAccountDocument } from "@/lib/models/bank-account";
import type { BankAccount } from "@/lib/types";

export function toBankAccount(doc: BankAccountDocument): BankAccount {
  return {
    id: String(doc._id),
    balance: doc.balance,
    configured: Boolean(doc.configured),
    updatedAt: new Date(doc.updatedAt),
  };
}
