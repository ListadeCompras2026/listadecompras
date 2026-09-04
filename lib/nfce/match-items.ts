import type { ReceiptItem, ReceiptMatch, ShoppingItem } from "@/lib/types";

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(
      /\b(un|und|kg|g|ml|l|lt|pct|cx|pacote|caixa|unidade|tp|tipo)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string) {
  return normalizeName(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function similarity(a: string, b: string) {
  const left = tokens(a);
  const right = tokens(b);
  if (left.length === 0 || right.length === 0) return 0;

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let intersection = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) intersection += 1;
  }

  const union = new Set([...left, ...right]).size;
  const jaccard = intersection / union;

  const normalizedA = normalizeName(a);
  const normalizedB = normalizeName(b);
  if (normalizedA === normalizedB) return 1;
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return Math.max(jaccard, 0.82);
  }

  return jaccard;
}

export function matchReceiptToList(
  listItems: ShoppingItem[],
  receiptItems: ReceiptItem[]
): ReceiptMatch[] {
  const available = listItems
    .filter((item) => !item.checked)
    .map((item) => ({ ...item }));

  return receiptItems.map((receiptItem, receiptIndex) => {
    let bestIndex = -1;
    let bestScore = 0;

    available.forEach((listItem, index) => {
      const score = similarity(listItem.name, receiptItem.name);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    if (bestIndex >= 0 && bestScore >= 0.34) {
      const matched = available[bestIndex];
      available.splice(bestIndex, 1);
      return {
        receiptIndex,
        receiptItem,
        listItemId: matched.id,
        listItemName: matched.name,
        confidence: bestScore,
      };
    }

    return {
      receiptIndex,
      receiptItem,
      confidence: bestScore,
    };
  });
}
