const ACCESS_KEY_REGEX = /\d{44}/;

export function extractAccessKey(raw: string) {
  const compact = raw.replace(/\s/g, "");
  const match = compact.match(ACCESS_KEY_REGEX);
  return match?.[0];
}

export function extractNfceUrl(raw: string) {
  const trimmed = raw.trim();

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

  const embedded = trimmed.match(/https?:\/\/[^\s|]+/i);
  return embedded?.[0];
}

export function parseQrPayload(raw: string) {
  const sourceUrl = extractNfceUrl(raw);
  const accessKey = extractAccessKey(raw);

  return {
    sourceUrl,
    accessKey,
  };
}
