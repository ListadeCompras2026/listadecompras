import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import {
  getBankAccount,
  setBankBalance,
  addBankIncome,
} from "@/lib/bank-account-service";

const patchSchema = z
  .object({
    balance: z.number().finite().optional(),
    income: z.number().positive().optional(),
  })
  .refine((data) => data.balance !== undefined || data.income !== undefined, {
    message: "Informe saldo ou recebimento",
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
    const account = await getBankAccount(authUser.id);
    return NextResponse.json({ ok: true, account });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao buscar saldo" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Informe um saldo valido" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const account =
      parsed.data.income !== undefined
        ? await addBankIncome(authUser.id, parsed.data.income)
        : await setBankBalance(authUser.id, parsed.data.balance ?? 0);
    return NextResponse.json({ ok: true, account });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao atualizar saldo" },
      { status: 500 }
    );
  }
}
