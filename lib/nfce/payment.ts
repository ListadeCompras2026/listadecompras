import type { PaymentMethod } from "@/lib/types";

const TAG_TO_METHOD: Record<string, PaymentMethod> = {
  "01": "cash",
  "02": "cash",
  "03": "credit",
  "04": "debit",
  "05": "credit",
  "10": "meal",
  "11": "meal",
  "12": "meal",
  "13": "cash",
  "15": "cash",
  "16": "pix",
  "17": "pix",
  "18": "pix",
  "19": "pix",
  "20": "pix",
  "90": "pix",
  "99": "pix",
};

export function paymentMethodFromNfce(
  code?: string,
  label?: string
): PaymentMethod | undefined {
  if (code) {
    const padded = code.replace(/\D/g, "").padStart(2, "0");
    if (TAG_TO_METHOD[padded]) {
      return TAG_TO_METHOD[padded];
    }
  }

  const text = (label || "").toLowerCase();
  if (!text) return undefined;
  if (text.includes("pix")) return "pix";
  if (text.includes("crédito") || text.includes("credito")) return "credit";
  if (text.includes("débito") || text.includes("debito")) return "debit";
  if (text.includes("dinheiro")) return "cash";
  if (
    text.includes("alimentação") ||
    text.includes("alimentacao") ||
    text.includes("refeição") ||
    text.includes("refeicao") ||
    text.includes("vale")
  ) {
    return "meal";
  }

  return undefined;
}
