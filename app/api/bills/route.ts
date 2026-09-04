import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/session-user";
import { BillModel } from "@/lib/models/bill";
import { toBill } from "@/lib/bill-serializer";
import { getPeriod } from "@/lib/period";

const createBillSchema = z.object({
  name: z.string().trim().min(2).max(120),
  amount: z.number().min(0),
  dueDay: z.number().int().min(1).max(31),
  category: z
    .enum([
      "housing",
      "utilities",
      "transport",
      "health",
      "education",
      "subscriptions",
      "insurance",
      "taxes",
      "others",
    ])
    .default("others"),
  recurrence: z.enum(["monthly", "once"]).default("monthly"),
  year: z.number().int().optional(),
  month: z.number().int().min(0).max(11).optional(),
  notes: z.string().trim().max(240).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const current = getPeriod();
    const year = Number(searchParams.get("year") ?? current.year);
    const month = Number(searchParams.get("month") ?? current.month);

    await connectToDatabase();

    const existing = await BillModel.find({
      createdBy: authUser.id,
      year,
      month,
    }).lean();

    if (existing.length === 0) {
      const previous = await BillModel.find({
        createdBy: authUser.id,
        recurrence: "monthly",
        $or: [
          {
            year: month === 0 ? year - 1 : year,
            month: month === 0 ? 11 : month - 1,
          },
        ],
      }).lean();

      if (previous.length > 0) {
        await BillModel.insertMany(
          previous.map((bill) => ({
            name: bill.name,
            amount: bill.amount,
            dueDay: bill.dueDay,
            category: bill.category,
            status: "pending",
            recurrence: "monthly",
            year,
            month,
            notes: bill.notes,
            createdBy: authUser.id,
          }))
        );
      }
    }

    const bills = await BillModel.find({
      createdBy: authUser.id,
      year,
      month,
    })
      .sort({ dueDay: 1, name: 1 })
      .lean();

    return NextResponse.json({
      ok: true,
      bills: bills.map((bill) => toBill(bill)),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao listar contas" },
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
    const parsed = createBillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Dados da conta invalidos" },
        { status: 400 }
      );
    }

    const current = getPeriod();
    await connectToDatabase();

    const created = await BillModel.create({
      ...parsed.data,
      year: parsed.data.year ?? current.year,
      month: parsed.data.month ?? current.month,
      status: "pending",
      createdBy: authUser.id,
    });

    return NextResponse.json(
      { ok: true, bill: toBill(created.toObject()) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro ao criar conta" },
      { status: 500 }
    );
  }
}
