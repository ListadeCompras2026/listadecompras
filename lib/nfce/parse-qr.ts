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
  const trimmed = raw.trim();
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

function contingencyTotal(qrParam?: string) {
  if (!qrParam) return undefined;
  const parts = qrParam.split("|");
  // Online: chave|versao|ambiente|csc|hash
  // Contingencia: chave|versao|ambiente|dest|dhEmi|vNF|digest|csc|hash
  if (parts.length < 8) return undefined;
  const amount = Number.parseFloat(parts[5]?.replace(",", ".") || "");
  const value = Number.isFinite(amount) && amount > 0 ? amount : Number.NaN;
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) {
    return undefined;
  }
  return Number(value.toFixed(2));
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
