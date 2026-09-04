import { formatCurrency } from "@/lib/money";
import type { Purchase } from "@/lib/types";

export function InvoiceBreakdown({
  charges,
  currentUserName,
}: {
  charges: Purchase[];
  currentUserName?: string;
}) {
  if (charges.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Ainda não há lançamentos nesta fatura.
      </p>
    );
  }

  const byPerson = charges.reduce<Record<string, number>>((acc, purchase) => {
    const name = purchase.completedByName || currentUserName || "Lançamento";
    acc[name] = (acc[name] || 0) + purchase.totalAmount;
    return acc;
  }, {});

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Por quem lançou
      </p>
      {Object.entries(byPerson).map(([name, total]) => (
        <div key={name} className="flex items-center justify-between text-sm">
          <span>{name}</span>
          <span className="font-medium">{formatCurrency(total)}</span>
        </div>
      ))}
      <div className="max-h-40 space-y-1 overflow-auto border-t border-border pt-2">
        {charges.map((purchase) => (
          <div
            key={purchase.id}
            className="flex items-center justify-between text-xs text-muted-foreground"
          >
            <span className="truncate pr-2">
              {purchase.completedByName || currentUserName} •{" "}
              {purchase.store || purchase.listName}
            </span>
            <span>{formatCurrency(purchase.totalAmount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
