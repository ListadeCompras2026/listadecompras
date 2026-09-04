import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { CreditCardModel } from "@/lib/models/credit-card";
import { UserModel } from "@/lib/models/user";
import { serializeCard } from "@/lib/card-access";
import { sendPushToUser } from "@/lib/web-push";

const shareSchema = z.object({
  email: z.string().trim().email(),
});

type RouteContext = {
  params: Promise<{ cardId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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
    const parsed = shareSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "E-mail invalido" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const card = await CreditCardModel.findOne({
      _id: cardId,
      createdBy: authUser.id,
    });
    if (!card) {
      return NextResponse.json(
        { ok: false, error: "Cartao nao encontrado" },
        { status: 404 }
      );
    }

    const targetUser = await UserModel.findOne({
      email: parsed.data.email.toLowerCase(),
    }).lean();
    if (!targetUser) {
      return NextResponse.json(
        { ok: false, error: "Usuario nao encontrado" },
        { status: 404 }
      );
    }

    const targetUserId = String(targetUser._id);
    if (targetUserId === authUser.id) {
      return NextResponse.json(
        { ok: false, error: "Voce ja e o dono deste cartao" },
        { status: 400 }
      );
    }

    card.sharedWith = card.sharedWith ?? [];
    if (!card.sharedWith.includes(targetUserId)) {
      card.sharedWith.push(targetUserId);
      await card.save();

      await sendPushToUser(targetUserId, {
        title: "Cartao compartilhado",
        body: `${authUser.name} compartilhou o cartao "${card.name}" com voce.`,
        url: "/",
      });
    }

    return NextResponse.json({
      ok: true,
      card: await serializeCard(card.toObject(), authUser.id),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao compartilhar cartao" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const { cardId } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Informe o usuario" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const card = await CreditCardModel.findOne({
      _id: cardId,
      createdBy: authUser.id,
    });
    if (!card) {
      return NextResponse.json(
        { ok: false, error: "Cartao nao encontrado" },
        { status: 404 }
      );
    }

    card.sharedWith = (card.sharedWith ?? []).filter((id) => id !== userId);
    await card.save();

    return NextResponse.json({
      ok: true,
      card: await serializeCard(card.toObject(), authUser.id),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao remover acesso" },
      { status: 500 }
    );
  }
}
