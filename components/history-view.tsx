"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar,
  Store,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PaymentMethod, Purchase, TransactionCategory } from "@/lib/types";
import { paymentMethodLabels, transactionCategoryLabels } from "@/lib/types";
import { formatCurrency } from "@/lib/money";
import { transactionCategoryMeta } from "@/lib/category-ui";
import { cn } from "@/lib/utils";

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  credit: <CreditCard className="w-4 h-4" />,
  debit: <CreditCard className="w-4 h-4" />,
  pix: <Smartphone className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  meal: <UtensilsCrossed className="w-4 h-4" />,
};

interface HistoryViewProps {
  focusListId?: string | null;
  onFocusConsumed?: () => void;
}

export function HistoryView({
  focusListId,
  onFocusConsumed,
}: HistoryViewProps) {
  const purchases = useAppStore((state) => state.purchases);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );

  // Sort by date descending
  const sortedPurchases = [...purchases].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const focusedPurchase = useMemo(() => {
    if (!focusListId) return null;
    return (
      sortedPurchases.find((purchase) => purchase.listId === focusListId) ??
      null
    );
  }, [focusListId, sortedPurchases]);

  useEffect(() => {
    if (!focusListId) return;
    if (focusedPurchase) {
      setSelectedPurchase(focusedPurchase);
    }
    onFocusConsumed?.();
  }, [focusListId, focusedPurchase, onFocusConsumed]);

  if (sortedPurchases.length === 0) {
    return (
      <div className="p-4">
        <h1 className="pt-2 text-xl font-semibold text-foreground">
          Transações
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">Despesas e compras</p>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h2 className="mb-1 text-lg font-medium text-foreground">
            Nenhuma movimentação
          </h2>
          <p className="text-sm text-muted-foreground">
            Toque no + para lançar uma despesa ou finalize uma lista
          </p>
        </div>
      </div>
    );
  }

  // Group by month
  const groupedByMonth = sortedPurchases.reduce(
    (acc, purchase) => {
      const monthKey = format(new Date(purchase.completedAt), "MMMM yyyy", {
        locale: ptBR,
      });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(purchase);
      return acc;
    },
    {} as Record<string, typeof sortedPurchases>
  );

  return (
    <div className="space-y-5 p-4">
      <div className="pt-2">
        <h1 className="text-xl font-semibold text-foreground">Transações</h1>
        <p className="text-sm text-muted-foreground">Despesas e compras</p>
      </div>

      {Object.entries(groupedByMonth).map(([month, monthPurchases]) => {
        const monthTotal = monthPurchases.reduce(
          (sum, p) => sum + p.totalAmount,
          0
        );

        return (
          <section key={month} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-medium capitalize text-muted-foreground">
                {month}
              </h2>
              <span className="text-sm font-semibold text-expense">
                {formatCurrency(monthTotal)}
              </span>
            </div>

            <div className="soft-shadow overflow-hidden rounded-2xl bg-card">
              {monthPurchases.map((purchase, index) => {
                const isStandalone = purchase.source === "standalone";
                const category = (purchase.category ||
                  "others") as TransactionCategory;
                const meta =
                  transactionCategoryMeta[category] ??
                  transactionCategoryMeta.others;
                const Icon = isStandalone ? meta.icon : ShoppingBag;
                return (
                  <button
                    key={purchase.id}
                    type="button"
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${index > 0 ? "border-t border-border/70" : ""}`}
                    onClick={() => setSelectedPurchase(purchase)}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        isStandalone
                          ? meta.className
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {purchase.listName}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(purchase.completedAt), "dd/MM", {
                          locale: ptBR,
                        })}
                        {purchase.store ? ` • ${purchase.store}` : ""}
                        {" • "}
                        {isStandalone
                          ? transactionCategoryLabels[category]
                          : paymentMethodLabels[purchase.paymentMethod]}
                        {purchase.completedByName
                          ? ` • ${purchase.completedByName}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-expense">
                      {formatCurrency(purchase.totalAmount)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <Dialog
        open={!!selectedPurchase}
        onOpenChange={(open) => !open && setSelectedPurchase(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPurchase?.listName}</DialogTitle>
            <DialogDescription>
              {selectedPurchase?.source === "standalone"
                ? "Despesa lançada avulsa."
                : "Resumo da compra finalizada com itens e totais."}
            </DialogDescription>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Valor total</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(selectedPurchase.totalAmount)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    {selectedPurchase.source === "standalone"
                      ? "Categoria"
                      : "Itens comprados"}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedPurchase.source === "standalone"
                      ? transactionCategoryLabels[
                          (selectedPurchase.category ||
                            "others") as TransactionCategory
                        ]
                      : selectedPurchase.items.length}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(
                      new Date(selectedPurchase.completedAt),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {paymentIcons[selectedPurchase.paymentMethod]}
                  <span>
                    {paymentMethodLabels[selectedPurchase.paymentMethod]}
                  </span>
                </div>
                {selectedPurchase.store && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Store className="w-4 h-4" />
                    <span>{selectedPurchase.store}</span>
                  </div>
                )}
                {selectedPurchase.completedByName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Lançado por {selectedPurchase.completedByName}</span>
                  </div>
                )}
              </div>

              {selectedPurchase.items.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">
                    Itens comprados
                  </h3>
                  <div className="max-h-64 overflow-auto space-y-2 pr-1">
                    {selectedPurchase.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} {item.unit}
                          {typeof item.totalPrice === "number"
                            ? ` • ${formatCurrency(item.totalPrice)}`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
