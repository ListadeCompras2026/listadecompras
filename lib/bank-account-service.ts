import { BankAccountModel } from "@/lib/models/bank-account";
import { toBankAccount } from "@/lib/bank-account-serializer";
import type { BankAccount, PaymentMethod } from "@/lib/types";

export function affectsBankBalance(method?: PaymentMethod | string) {
  return method === "debit" || method === "pix";
}

export async function getBankAccount(userId: string): Promise<BankAccount> {
  const existing = await BankAccountModel.findOne({ createdBy: userId });
  if (existing) {
    return toBankAccount(existing.toObject());
  }

  const created = await BankAccountModel.create({
    createdBy: userId,
    balance: 0,
    configured: false,
  });
  return toBankAccount(created.toObject());
}

export async function setBankBalance(
  userId: string,
  balance: number
): Promise<BankAccount> {
  const account = await BankAccountModel.findOneAndUpdate(
    { createdBy: userId },
    {
      $set: { balance: Number(balance.toFixed(2)), configured: true },
      $setOnInsert: { createdBy: userId },
    },
    { new: true, upsert: true }
  );
  return toBankAccount(account.toObject());
}

export async function applyBankMovement(
  userId: string,
  amount: number
): Promise<BankAccount | null> {
  if (!Number.isFinite(amount) || amount === 0) return null;

  const account = await BankAccountModel.findOne({
    createdBy: userId,
    configured: true,
  });
  if (!account) return null;

  account.balance = Number((account.balance + amount).toFixed(2));
  await account.save();
  return toBankAccount(account.toObject());
}

export async function applyBankIfNeeded(
  userId: string,
  method: PaymentMethod | string | undefined,
  amount: number
): Promise<BankAccount | null> {
  if (!affectsBankBalance(method)) return null;
  return applyBankMovement(userId, -Math.abs(amount));
}

export async function refundBankIfNeeded(
  userId: string,
  method: PaymentMethod | string | undefined,
  amount: number
): Promise<BankAccount | null> {
  if (!affectsBankBalance(method)) return null;
  return applyBankMovement(userId, Math.abs(amount));
}
