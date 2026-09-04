import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/session-user";
import { parseNfceFromQr } from "@/lib/nfce/fetch-receipt";

const parseReceiptSchema = z.object({
  qrContent: z.string().trim().min(8).max(2000),
});

export const dynamic = "force-dynamic";

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
    const parsed = parseReceiptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "QR Code invalido" },
        { status: 400 }
      );
    }

    const receipt = await parseNfceFromQr(parsed.data.qrContent);
    return NextResponse.json({ ok: true, receipt });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao ler o cupom";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}
