import { MealCardModel } from "@/lib/models/meal-card";
import { toMealCard } from "@/lib/meal-card-serializer";
import type { MealCard, PaymentMethod } from "@/lib/types";

export async function listMealCards(userId: string): Promise<MealCard[]> {
  const cards = await MealCardModel.find({ createdBy: userId })
    .sort({ name: 1 })
    .lean();
  return cards.map((card) => toMealCard(card));
}

export async function applyMealIfNeeded(
  userId: string,
  method: PaymentMethod | string | undefined,
  mealCardId: string | undefined,
  amount: number
): Promise<MealCard | null> {
  if (method !== "meal" || !mealCardId) return null;
  if (!Number.isFinite(amount) || amount === 0) return null;

  const card = await MealCardModel.findOne({
    _id: mealCardId,
    createdBy: userId,
  });
  if (!card) return null;

  card.balance = Number((card.balance - Math.abs(amount)).toFixed(2));
  await card.save();
  return toMealCard(card.toObject());
}

export async function refundMealIfNeeded(
  userId: string,
  method: PaymentMethod | string | undefined,
  mealCardId: string | undefined,
  amount: number
): Promise<MealCard | null> {
  if (method !== "meal" || !mealCardId) return null;
  if (!Number.isFinite(amount) || amount === 0) return null;

  const card = await MealCardModel.findOne({
    _id: mealCardId,
    createdBy: userId,
  });
  if (!card) return null;

  card.balance = Number((card.balance + Math.abs(amount)).toFixed(2));
  await card.save();
  return toMealCard(card.toObject());
}

export async function rechargeMealCard(
  userId: string,
  mealCardId: string,
  amount: number
): Promise<MealCard | null> {
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const card = await MealCardModel.findOne({
    _id: mealCardId,
    createdBy: userId,
  });
  if (!card) return null;

  card.balance = Number((card.balance + amount).toFixed(2));
  await card.save();
  return toMealCard(card.toObject());
}
