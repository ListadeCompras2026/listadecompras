import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { MealCardModel } from "@/lib/models/meal-card";
import { toMealCard } from "@/lib/meal-card-serializer";
import { listMealCards } from "@/lib/meal-card-service";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  lastDigits: z
    .string()
    .trim()
    .regex(/^\d{4}$/)
    .optional()
    .or(z.literal("")),
  balance: z.number().min(0).default(0),
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const cards = await listMealCards(authUser.id);
    return NextResponse.json({ ok: true, cards });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao listar cartoes alimentacao" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Dados do cartao invalidos" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const created = await MealCardModel.create({
      name: parsed.data.name,
      lastDigits: parsed.data.lastDigits || undefined,
      balance: Number(parsed.data.balance.toFixed(2)),
      createdBy: authUser.id,
    });

    return NextResponse.json(
      { ok: true, card: toMealCard(created.toObject()) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao criar cartao alimentacao" },
      { status: 500 }
    );
  }
}
