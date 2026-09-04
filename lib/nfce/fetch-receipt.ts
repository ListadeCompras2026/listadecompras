import type { ParsedReceipt, ReceiptItem } from "@/lib/types";
import { parseBrNumber } from "@/lib/money";
import { parseQrPayload } from "@/lib/nfce/parse-qr";
import { paymentMethodFromNfce } from "@/lib/nfce/payment";

const FETCH_TIMEOUT_MS = 18000;

const STATE_CONSULT_URLS: Record<string, (key: string) => string> = {
  "12": (key) => `http://www.sefaznet.ac.gov.br/nfce/qrcode?p=${key}`,
  "13": (key) =>
    `https://sistemas.sefaz.am.gov.br/nfceweb/consultarNFCe.jsp?p=${key}`,
  "16": (key) => `https://www.sefaz.ap.gov.br/nfce/nfcep.php?p=${key}`,
  "29": (key) =>
    `https://nfe.sefaz.ba.gov.br/servicos/nfce/Modulos/Geral/NFCEC_consulta_chave_acesso.aspx?p=${key}`,
  "23": (key) => `https://nfce.sefaz.ce.gov.br/pages/ShowNFCe.html?p=${key}`,
  "53": (key) => `https://dec.fazenda.df.gov.br/ConsultarNFCe.aspx?p=${key}`,
  "32": (key) =>
    `https://app.sefaz.es.gov.br/ConsultaNFCe/qrcode.aspx?p=${key}`,
  "52": (key) =>
    `https://nfe.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe?p=${key}`,
  "21": (key) =>
    `https://nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp?p=${key}`,
  "31": (key) =>
    `https://nfce.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=${key}`,
  "50": (key) => `http://www.dfe.ms.gov.br/nfce/qrcode?p=${key}`,
  "51": (key) => `https://www.sefaz.mt.gov.br/nfce/consultanfce?p=${key}`,
  "15": (key) =>
    `https://appnfc.sefa.pa.gov.br/portal/view/consultas/nfce/nfceForm.seam?p=${key}`,
  "25": (key) => `https://www.sefaz.pb.gov.br/nfce?p=${key}`,
  "26": (key) => `http://nfce.sefaz.pe.gov.br/nfce/consulta?p=${key}`,
  "22": (key) => `https://www.sefaz.pi.gov.br/nfce/qrcode?p=${key}`,
  "41": (key) => `http://www.fazenda.pr.gov.br/nfce/qrcode?p=${key}`,
  "33": (key) =>
    `https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${key}`,
  "24": (key) => `https://nfce.set.rn.gov.br/consultarNFCe.aspx?p=${key}`,
  "11": (key) =>
    `http://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp?p=${key}`,
  "14": (key) => `https://www.sefaz.rr.gov.br/nfce/servlet/qrcode?p=${key}`,
  "43": (key) => `https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=${key}`,
  "42": (key) => `https://sat.sef.sc.gov.br/nfce/consulta?p=${key}`,
  "35": (key) =>
    `https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=${key}`,
  "28": (key) => `https://www.nfce.se.gov.br/portal/consultarNFCe.jsp?p=${key}`,
  "17": (key) => `https://www.sefaz.to.gov.br/nfce/consulta?p=${key}`,
};

const SVRS_STATES = new Set([
  "12",
  "27",
  "16",
  "53",
  "32",
  "25",
  "33",
  "24",
  "11",
  "14",
  "42",
  "28",
  "17",
]);

function encodeQrParam(param: string) {
  return encodeURIComponent(param).replace(/%7C/gi, "|");
}

function withParam(url: string, param: string) {
  const encoded = encodeURIComponent(param);
  const raw = encodeQrParam(param);
  if (url.includes("?p=")) {
    return [url, url.replace(/\?p=[^&]*/, `?p=${encoded}`)];
  }
  const joiner = url.includes("?") ? "&" : "?";
  return [`${url}${joiner}p=${raw}`, `${url}${joiner}p=${encoded}`];
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 10))
    )
    .trim();
}

function tagValue(xml: string, tag: string) {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i")
  );
  return match ? decodeXml(match[1]) : undefined;
}

function allTagBlocks(xml: string, tag: string) {
  const matches = xml.matchAll(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi")
  );
  return [...matches].map((match) => match[1]);
}

function toReceiptItem(
  name: string,
  quantity: number,
  unit: string,
  unitPrice: number,
  totalPrice: number
): ReceiptItem | null {
  const cleanName = name.replace(/\s+/g, " ").trim();
  if (!cleanName) return null;

  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const total = Number.isFinite(totalPrice) ? totalPrice : 0;
  const unitValue =
    Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : total / qty;

  return {
    name: cleanName.slice(0, 180),
    quantity: qty,
    unit: unit || "un",
    unitPrice: Number(unitValue.toFixed(2)),
    totalPrice: Number(
      (Number.isFinite(total) && total > 0 ? total : unitValue * qty).toFixed(2)
    ),
  };
}

function parseMoneyLoose(value?: string) {
  if (!value) return Number.NaN;
  const trimmed = value.trim();
  if (trimmed.includes(",")) return parseBrNumber(trimmed);
  const asNumber = Number.parseFloat(trimmed.replace(/[^\d.-]/g, ""));
  return Number.isFinite(asNumber) ? asNumber : Number.NaN;
}

function extractEmbeddedXml(content: string) {
  const unescaped = content.includes("&lt;nfeProc")
    ? decodeXml(content)
    : content;
  const match =
    unescaped.match(/<\?xml[\s\S]*?<\/nfeProc>/i) ||
    unescaped.match(/<nfeProc[\s\S]*?<\/nfeProc>/i) ||
    unescaped.match(/<NFe[\s\S]*?<\/NFe>/i) ||
    unescaped.match(/<infNFe[\s\S]*?<\/infNFe>/i);
  return match?.[0];
}

function parseXmlReceipt(xml: string): ParsedReceipt | null {
  const dets = allTagBlocks(xml, "det");
  if (dets.length === 0) return null;

  const items: ReceiptItem[] = [];
  for (const det of dets) {
    const item = toReceiptItem(
      tagValue(det, "xProd") || "",
      Number.parseFloat(tagValue(det, "qCom") || "1"),
      (tagValue(det, "uCom") || "un").toLowerCase(),
      Number.parseFloat(tagValue(det, "vUnCom") || "0"),
      Number.parseFloat(tagValue(det, "vProd") || "0")
    );
    if (item) items.push(item);
  }

  if (items.length === 0) return null;

  const totalFromXml = Number.parseFloat(
    tagValue(xml, "vNF") || tagValue(xml, "vPag") || "0"
  );
  const totalAmount =
    Number.isFinite(totalFromXml) && totalFromXml > 0
      ? totalFromXml
      : items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    store: tagValue(xml, "xFant") || tagValue(xml, "xNome"),
    issuedAt: tagValue(xml, "dhEmi") || tagValue(xml, "dEmi"),
    totalAmount: Number(totalAmount.toFixed(2)),
    paymentMethod: paymentMethodFromNfce(tagValue(xml, "tPag")),
    items,
    accessKey:
      tagValue(xml, "chNFe")?.replace(/\D/g, "") || xml.match(/\d{44}/)?.[0],
  };
}

function parseSaoPauloStyleHtml(html: string): ParsedReceipt | null {
  const itemBlocks = [
    ...html.matchAll(/<span class="txtTit[^"]*">([\s\S]*?)<\/span>/gi),
  ];
  if (itemBlocks.length === 0) return null;

  const items: ReceiptItem[] = [];
  for (const match of itemBlocks) {
    const start = match.index ?? 0;
    const chunk = html.slice(start, start + 1200);
    const name = decodeXml(match[1]).replace(/<[^>]+>/g, "");
    const qtyMatch =
      chunk.match(/Qtde[:\s.]*<\/strong>\s*([\d.,]+)/i) ||
      chunk.match(/Qtde[:\s.]*([\d.,]+)/i);
    const unitMatch =
      chunk.match(/UN[:\s.]*<\/strong>\s*([A-Z]{1,6})/i) ||
      chunk.match(/UN[:\s.]*([A-Z]{1,6})/i);
    const unitPriceMatch =
      chunk.match(/Vl\.\s*Unit[:\s.]*<\/strong>\s*([\d.,]+)/i) ||
      chunk.match(/Vl\.\s*Unit[:\s.]*([\d.,]+)/i);
    const totalMatch =
      chunk.match(/class="valor"[^>]*>\s*([\d.,]+)/i) ||
      chunk.match(/Rvl[^>]*>\s*([\d.,]+)/i);

    const item = toReceiptItem(
      name,
      parseMoneyLoose(qtyMatch?.[1] || "1"),
      (unitMatch?.[1] || "un").toLowerCase(),
      parseMoneyLoose(unitPriceMatch?.[1] || "0"),
      parseMoneyLoose(totalMatch?.[1] || "0")
    );
    if (item) items.push(item);
  }

  if (items.length === 0) return null;

  const totalMatch =
    html.match(/Valor\s+a\s+pagar[\s\S]{0,80}?([\d.]+,[\d]{2})/i) ||
    html.match(/Valor total[\s\S]{0,80}?([\d.]+,[\d]{2})/i);
  const storeMatch =
    html.match(/<div id="u20"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
  const paymentMatch = html.match(
    /Forma de pagamento[\s\S]{0,200}?([A-Za-zçãéíóú\s]+)/i
  );

  const totalAmount = totalMatch
    ? parseBrNumber(totalMatch[1])
    : items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    store: storeMatch
      ? decodeXml(storeMatch[1])
          .replace(/<[^>]+>/g, "")
          .trim()
      : undefined,
    totalAmount: Number(
      (Number.isFinite(totalAmount) ? totalAmount : 0).toFixed(2)
    ),
    paymentMethod: paymentMethodFromNfce(undefined, paymentMatch?.[1]),
    items,
  };
}

function parseTableHtml(html: string): ParsedReceipt | null {
  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  const rows = [...html.matchAll(rowRegex)].map((match) => match[0]);
  const items: ReceiptItem[] = [];

  for (const row of rows) {
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (cell) =>
        decodeXml(cell[1].replace(/<[^>]+>/g, " "))
          .replace(/\s+/g, " ")
          .trim()
    );
    if (cells.length < 3) continue;

    const joined = cells.join(" ");
    if (
      /total|pagamento|tributo|chave|protocolo|consumidor|descri/i.test(
        joined
      ) &&
      !/\d+,\d{2}/.test(joined)
    ) {
      continue;
    }

    const moneyValues = cells
      .map((cell) =>
        parseMoneyLoose(cell.match(/[\d.]+,\d{2}|\d+,\d{2}|\d+\.\d{2}/)?.[0])
      )
      .filter((value) => Number.isFinite(value) && value >= 0) as number[];
    if (moneyValues.length === 0) continue;

    const nameCell =
      cells.find(
        (cell) =>
          cell.length >= 3 &&
          !/^[\d.,]+$/.test(cell) &&
          !/^(un|und|kg|g|ml|l|cx)$/i.test(cell)
      ) || "";
    if (nameCell.length < 3) continue;

    const qtyCell = cells.find((cell) =>
      /^\d+(?:[.,]\d+)?(?:\s*(un|und|kg|g|ml|l|cx))?$/i.test(cell)
    );

    const item = toReceiptItem(
      nameCell,
      qtyCell ? parseMoneyLoose(qtyCell) : 1,
      "un",
      moneyValues.length > 1
        ? moneyValues[moneyValues.length - 2]
        : moneyValues[0],
      moneyValues[moneyValues.length - 1]
    );
    if (item && item.totalPrice > 0 && item.name.length >= 3) {
      items.push(item);
    }
  }

  if (items.length === 0) return null;

  const totalMatch =
    html.match(/Valor\s+a\s+pagar[\s\S]{0,120}?([\d.]+,[\d]{2})/i) ||
    html.match(/Valor\s+total[\s\S]{0,80}?([\d.]+,[\d]{2})/i);
  const storeMatch =
    html.match(/<div id="u20"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/Raz[aã]o Social[\s\S]{0,80}?>([\s\S]*?)</i);

  const totalAmount = totalMatch
    ? parseBrNumber(totalMatch[1])
    : items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    store: storeMatch
      ? decodeXml(storeMatch[1])
          .replace(/<[^>]+>/g, "")
          .trim()
      : undefined,
    totalAmount: Number(
      (Number.isFinite(totalAmount) ? totalAmount : 0).toFixed(2)
    ),
    items,
  };
}

function parseGenericHtml(html: string): ParsedReceipt | null {
  const rowRegex = /<(?:tr|li)[^>]*>[\s\S]*?<\/(?:tr|li)>/gi;
  const rows = [...html.matchAll(rowRegex)].map((match) => match[0]);
  const items: ReceiptItem[] = [];

  for (const row of rows) {
    const text = decodeXml(
      row.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ")
    )
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < 6 || text.length > 220) continue;
    if (!/\d+,\d{2}/.test(text)) continue;
    if (
      /total|pagamento|tributo|chave|protocolo|consumidor/i.test(text) &&
      !/qtd|unid|prod/i.test(text)
    ) {
      continue;
    }

    const moneyValues = [
      ...text.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/g),
    ].map((match) => parseBrNumber(match[1]));
    if (moneyValues.length === 0) continue;

    const qtyMatch = text.match(
      /(\d+(?:[.,]\d+)?)\s*(un|und|kg|g|ml|l|cx|pct)?/i
    );
    const name = text
      .replace(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/g, " ")
      .replace(/\b(qtd|qtde|quant|un|und|kg|g|ml|l)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const item = toReceiptItem(
      name,
      qtyMatch ? parseBrNumber(qtyMatch[1]) : 1,
      qtyMatch?.[2]?.toLowerCase() || "un",
      moneyValues.length > 1
        ? moneyValues[moneyValues.length - 2]
        : moneyValues[0],
      moneyValues[moneyValues.length - 1]
    );
    if (item && item.totalPrice > 0 && item.name.length >= 3) {
      items.push(item);
    }
  }

  if (items.length === 0) return null;

  const totalMatch =
    html.match(/Valor\s+a\s+pagar[\s\S]{0,120}?([\d.]+,[\d]{2})/i) ||
    html.match(/Total[\s\S]{0,80}?([\d.]+,[\d]{2})/i);
  const totalAmount = totalMatch
    ? parseBrNumber(totalMatch[1])
    : items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    totalAmount: Number(
      (Number.isFinite(totalAmount) ? totalAmount : 0).toFixed(2)
    ),
    items,
  };
}

function parseTotalOnlyHtml(
  html: string,
  fallbackTotal?: number
): ParsedReceipt | null {
  const totalMatch =
    html.match(/Valor\s+a\s+pagar[\s\S]{0,120}?([\d.]+,[\d]{2})/i) ||
    html.match(/Valor\s+total[\s\S]{0,80}?([\d.]+,[\d]{2})/i) ||
    html.match(/vNF[^>]*>\s*([\d.]+,[\d]{2}|\d+\.\d{2})/i);
  const totalAmount = totalMatch
    ? parseMoneyLoose(totalMatch[1])
    : fallbackTotal;
  if (!totalAmount || !Number.isFinite(totalAmount) || totalAmount <= 0) {
    return null;
  }

  const storeMatch =
    html.match(/<div id="u20"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
  const paymentMatch = html.match(
    /Forma de pagamento[\s\S]{0,200}?([A-Za-zçãéíóú\s]+)/i
  );

  return {
    store: storeMatch
      ? decodeXml(storeMatch[1])
          .replace(/<[^>]+>/g, "")
          .trim()
      : undefined,
    totalAmount: Number(totalAmount.toFixed(2)),
    paymentMethod: paymentMethodFromNfce(undefined, paymentMatch?.[1]),
    items: [
      {
        name: "Compra no cupom",
        quantity: 1,
        unit: "un",
        unitPrice: Number(totalAmount.toFixed(2)),
        totalPrice: Number(totalAmount.toFixed(2)),
      },
    ],
  };
}

async function fetchText(url: string, cookies: Map<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const cookieHeader = [...cookies.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        Referer: `${new URL(url).origin}/`,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [];
    for (const cookie of setCookies) {
      const pair = cookie.split(";")[0];
      const eq = pair.indexOf("=");
      if (eq > 0) {
        cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "";
    const charsetMatch = contentType.match(/charset=([^\s;]+)/i);
    const charset = charsetMatch?.[1] || "utf-8";
    let text = "";
    try {
      text = new TextDecoder(charset).decode(buffer);
    } catch {
      text = new TextDecoder("utf-8").decode(buffer);
    }

    if (!text.trim()) return null;
    return text;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseDocument(content: string): ParsedReceipt | null {
  const embeddedXml = extractEmbeddedXml(content);
  const xml = parseXmlReceipt(embeddedXml || content);
  if (xml) return xml;

  const sp = parseSaoPauloStyleHtml(content);
  if (sp) return sp;

  const table = parseTableHtml(content);
  if (table) return table;

  return parseGenericHtml(content);
}

function candidateUrls(
  sourceUrl?: string,
  accessKey?: string,
  qrParam?: string
) {
  const urls: string[] = [];
  const param = qrParam || accessKey;

  if (sourceUrl) {
    urls.push(sourceUrl);
    if (param && !/[?&]p=/i.test(sourceUrl)) {
      urls.push(...withParam(sourceUrl, param));
    }
  }

  if (param && accessKey && accessKey.length === 44) {
    const uf = accessKey.slice(0, 2);
    const builder = STATE_CONSULT_URLS[uf];
    if (builder) {
      urls.push(builder(param));
      if (param !== accessKey) urls.push(builder(accessKey));
    }
    if (SVRS_STATES.has(uf)) {
      urls.push(
        `https://dfe-portal.svrs.rs.gov.br/Nfce/ConsultaQRCode?p=${encodeQrParam(param)}`
      );
    }
    urls.push(
      `https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=${encodeQrParam(param)}`,
      `https://www.nfce.fazenda.sp.gov.br/qrcode?p=${encodeQrParam(param)}`
    );
  }

  return [...new Set(urls.filter(Boolean))];
}

function fallbackReceipt(
  total?: number,
  accessKey?: string,
  sourceUrl?: string
): ParsedReceipt | null {
  if (!total || total <= 0) return null;
  return {
    totalAmount: Number(total.toFixed(2)),
    items: [
      {
        name: "Compra no cupom",
        quantity: 1,
        unit: "un",
        unitPrice: Number(total.toFixed(2)),
        totalPrice: Number(total.toFixed(2)),
      },
    ],
    accessKey,
    sourceUrl,
  };
}

export async function parseNfceFromQr(rawQr: string): Promise<ParsedReceipt> {
  const { sourceUrl, accessKey, qrParam, contingencyTotal } =
    parseQrPayload(rawQr);
  if (!sourceUrl && !accessKey) {
    throw new Error("QR Code do cupom nao reconhecido");
  }

  const urls = candidateUrls(sourceUrl, accessKey, qrParam);
  const cookies = new Map<string, string>();
  let parsed: ParsedReceipt | null = null;
  let lastHtml: string | null = null;

  for (const url of urls) {
    const content = await fetchText(url, cookies);
    if (!content) continue;
    lastHtml = content;
    parsed = parseDocument(content);
    if (parsed) {
      parsed.sourceUrl = url;
      parsed.accessKey = parsed.accessKey || accessKey;
      break;
    }
  }

  if (!parsed && lastHtml) {
    parsed = parseTotalOnlyHtml(lastHtml, contingencyTotal);
    if (parsed) {
      parsed.accessKey = parsed.accessKey || accessKey;
      parsed.sourceUrl = parsed.sourceUrl || sourceUrl;
    }
  }

  if (!parsed) {
    parsed = fallbackReceipt(contingencyTotal, accessKey, sourceUrl);
  }

  if (!parsed || parsed.items.length === 0) {
    throw new Error(
      "Nao foi possivel ler os itens do cupom. Tente novamente ou use o checkout manual."
    );
  }

  if (!parsed.totalAmount) {
    parsed.totalAmount = Number(
      parsed.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
    );
  }

  return parsed;
}
