import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { MealCardModel } from "@/lib/models/meal-card";
import { toMealCard } from "@/lib/meal-card-serializer";
import { rechargeMealCard } from "@/lib/meal-card-service";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  lastDigits: z
    .string()
    .trim()
    .regex(/^\d{4}$/)
    .optional()
    .or(z.literal("")),
  recharge: z.number().positive().optional(),
});

type RouteContext = {
  params: Promise<{ cardId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const { cardId } = await context.params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Dados de atualizacao invalidos" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (typeof parsed.data.recharge === "number") {
      const recharged = await rechargeMealCard(
        authUser.id,
        cardId,
        parsed.data.recharge
      );
      if (!recharged) {
        return NextResponse.json(
          { ok: false, error: "Cartao nao encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, card: recharged });
    }

    const card = await MealCardModel.findOne({
      _id: cardId,
      createdBy: authUser.id,
    });
    if (!card) {
      return NextResponse.json(
        { ok: false, error: "Cartao nao encontrado" },
        { status: 404 }
      );
    }

    if (parsed.data.name) card.name = parsed.data.name;
    if (parsed.data.lastDigits !== undefined) {
      card.lastDigits = parsed.data.lastDigits || undefined;
    }
    await card.save();

    return NextResponse.json({
      ok: true,
      card: toMealCard(card.toObject()),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao atualizar cartao alimentacao" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const { cardId } = await context.params;
    await connectToDatabase();
    const deleted = await MealCardModel.findOneAndDelete({
      _id: cardId,
      createdBy: authUser.id,
    });
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: "Cartao nao encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao excluir cartao alimentacao" },
      { status: 500 }
    );
  }
}
