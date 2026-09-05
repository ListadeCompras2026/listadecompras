import type { ParsedReceipt } from "@/lib/types";

const ACCESS_KEY_REGEX = /\d{44}/;
const QR_PARAM_REGEX = /(?:^|[?&])p=([^&\s]+)/i;
const URL_REGEX = /https?:\/\/[^\s<>"']+/i;

export function extractAccessKey(raw: string) {
  const compact = raw.replace(/\s/g, "");
  return compact.match(ACCESS_KEY_REGEX)?.[0];
}

function decodeQrComponent(value: string) {
  const normalized = value.replace(/\+/g, "%20");
  try {
    return decodeURIComponent(normalized);
  } catch {
    return value;
  }
}

export function extractQrParam(raw: string) {
  const compact = raw.trim().replace(/\s+/g, "");
  const fromQuery = compact.match(QR_PARAM_REGEX);
  if (fromQuery?.[1]) {
    return decodeQrComponent(fromQuery[1]);
  }

  if (/^\d{44}\|/.test(compact)) {
    return compact;
  }

  return extractAccessKey(compact);
}

export function extractNfceUrl(raw: string) {
  const trimmed = raw.trim().replace(/\s+/g, "");
  const embedded = trimmed.match(URL_REGEX);
  if (embedded?.[0]) {
    return embedded[0].replace(/[),.;]+$/, "");
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // QR codes sometimes omit the protocol.
  }

  if (trimmed.startsWith("www.")) {
    return `https://${trimmed}`;
  }

  return undefined;
}

function looksLikeAmount(value?: string) {
  if (!value) return false;
  return /^\d{1,8}(?:[.,]\d{1,2})?$/.test(value);
}

function parseAmount(value?: string) {
  if (!looksLikeAmount(value)) return undefined;
  const amount = Number.parseFloat(value!.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return undefined;
  }
  return Number(amount.toFixed(2));
}

function contingencyTotal(qrParam?: string) {
  if (!qrParam) return undefined;
  const parts = qrParam.split("|");
  // Online v2: chave|versao|ambiente|csc|hash (sem total)
  // Contingencia v2: chave|versao|ambiente|dia|valor|digest|csc|hash
  // Contingencia antiga: chave|versao|ambiente|dest|dhEmi|vNF|digest|csc|hash
  if (parts.length >= 8 && /^\d{1,2}$/.test(parts[3] || "")) {
    return parseAmount(parts[4]);
  }
  if (parts.length >= 8) {
    return parseAmount(parts[5]) || parseAmount(parts[4]);
  }
  if (parts.length >= 7) {
    return parseAmount(parts[4]);
  }
  return undefined;
}

export function receiptFromTotal(
  total: number,
  accessKey?: string,
  sourceUrl?: string
): ParsedReceipt {
  const amount = Number(total.toFixed(2));
  return {
    totalAmount: amount,
    items: [
      {
        name: "Compra no cupom",
        quantity: 1,
        unit: "un",
        unitPrice: amount,
        totalPrice: amount,
      },
    ],
    accessKey,
    sourceUrl,
  };
}

export function parseQrPayload(raw: string) {
  const sourceUrl = extractNfceUrl(raw);
  const qrParam = extractQrParam(raw) || extractQrParam(sourceUrl || "");
  const accessKey = extractAccessKey(qrParam || raw);

  return {
    sourceUrl,
    accessKey,
    qrParam,
    contingencyTotal: contingencyTotal(qrParam),
  };
}
