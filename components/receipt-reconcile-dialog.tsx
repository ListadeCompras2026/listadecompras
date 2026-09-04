"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  CreditCard,
  Banknote,
  Smartphone,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { formatCurrency, parseMoney } from "@/lib/money";
import type {
  ParsedReceipt,
  PaymentMethod,
  ReceiptMatch,
  ShoppingList,
} from "@/lib/types";
import { paymentMethodLabels } from "@/lib/types";

interface ReceiptReconcileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: ShoppingList;
  receipt: ParsedReceipt | null;
  onCompleted: () => void;
}

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  credit: <CreditCard className="w-4 h-4" />,
  debit: <CreditCard className="w-4 h-4" />,
  pix: <Smartphone className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  meal: <UtensilsCrossed className="w-4 h-4" />,
};

export function ReceiptReconcileDialog({
  open,
  onOpenChange,
  list,
  receipt,
  onCompleted,
}: ReceiptReconcileDialogProps) {
  const previewReceiptMatches = useAppStore(
    (state) => state.previewReceiptMatches
  );
  const completePurchase = useAppStore((state) => state.completePurchase);
  const creditCards = useAppStore((state) => state.creditCards);
  const loadExpenses = useAppStore((state) => state.loadExpenses);

  const initialMatches = useMemo(
    () => (receipt ? previewReceiptMatches(list.id, receipt) : []),
    [list.id, previewReceiptMatches, receipt]
  );

  const [matches, setMatches] = useState<ReceiptMatch[]>([]);
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [storeName, setStoreName] = useState("");
  const [cardId, setCardId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!receipt || !open) return;
    setMatches(initialMatches);
    setTotalAmount(String(receipt.totalAmount).replace(".", ","));
    setPaymentMethod(receipt.paymentMethod || "pix");
    setStoreName(receipt.store || "");
    setCardId(creditCards[0]?.id || "");
  }, [creditCards, initialMatches, open, receipt]);

  if (!receipt) return null;

  const matchedCount = matches.filter((match) => match.listItemId).length;

  const handleToggleMatch = (receiptIndex: number, listItemId: string) => {
    setMatches((current) =>
      current.map((match) => {
        if (match.receiptIndex !== receiptIndex) {
          if (match.listItemId === listItemId) {
            return { ...match, listItemId: undefined, listItemName: undefined };
          }
          return match;
        }
        const listItem = list.items.find((item) => item.id === listItemId);
        return {
          ...match,
          listItemId,
          listItemName: listItem?.name,
          confidence: 1,
        };
      })
    );
  };

  const handleClearMatch = (receiptIndex: number) => {
    setMatches((current) =>
      current.map((match) =>
        match.receiptIndex === receiptIndex
          ? {
              ...match,
              listItemId: undefined,
              listItemName: undefined,
              confidence: 0,
            }
          : match
      )
    );
  };

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseMoney(totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe o valor total do cupom");
      return;
    }
    if (paymentMethod === "credit" && !cardId) {
      toast.error("Cadastre ou selecione um cartao para lancar a fatura");
      return;
    }

    setIsSaving(true);
    const success = await completePurchase({
      listId: list.id,
      totalAmount: amount,
      paymentMethod,
      store: storeName || undefined,
      cardId: paymentMethod === "credit" ? cardId : undefined,
      receiptKey: receipt.accessKey,
      receiptUrl: receipt.sourceUrl,
      items: matches.map((match) => ({
        listItemId: match.listItemId,
        name: match.receiptItem.name,
        quantity: match.receiptItem.quantity,
        unit: match.receiptItem.unit,
        unitPrice: match.receiptItem.unitPrice,
        totalPrice: match.receiptItem.totalPrice,
      })),
    });
    setIsSaving(false);

    if (!success) {
      toast.error("Nao foi possivel conciliar o cupom");
      return;
    }

    if (paymentMethod === "credit") {
      await loadExpenses();
    }

    toast.success(`${matchedCount} item(ns) baixado(s) na lista`);
    onOpenChange(false);
    onCompleted();
  };

  const unmatchedListItems = list.items.filter(
    (item) =>
      !item.checked && !matches.some((match) => match.listItemId === item.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conciliar cupom</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleConfirm} className="space-y-4">
          <Card>
            <CardContent className="space-y-1 p-4 text-sm">
              <p className="font-medium text-foreground">
                {storeName || "Estabelecimento"}
              </p>
              <p className="text-muted-foreground">
                {receipt.items.length} itens no cupom • {matchedCount}{" "}
                conciliados com a lista
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {matches.map((match) => (
              <div
                key={match.receiptIndex}
                className="rounded-lg border border-border p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {match.receiptItem.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {match.receiptItem.quantity} {match.receiptItem.unit} •{" "}
                      {formatCurrency(match.receiptItem.totalPrice)}
                    </p>
                  </div>
                  {match.listItemId ? (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary">
                      Na lista
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                      Extra
                    </span>
                  )}
                </div>
                <Select
                  value={match.listItemId || "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      handleClearMatch(match.receiptIndex);
                      return;
                    }
                    handleToggleMatch(match.receiptIndex, value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vincular a um item da lista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nao estava na lista</SelectItem>
                    {list.items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {unmatchedListItems.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Ainda ficam na lista:{" "}
              {unmatchedListItems.map((item) => item.name).join(", ")}
            </p>
          )}

          <div className="space-y-2">
            <Label>Valor total</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                inputMode="decimal"
                value={totalAmount}
                onChange={(event) => setTotalAmount(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map(
                (method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={paymentMethod === method ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setPaymentMethod(method)}
                  >
                    {paymentIcons[method]}
                    {paymentMethodLabels[method]}
                  </Button>
                )
              )}
            </div>
          </div>

          {paymentMethod === "credit" && (
            <div className="space-y-2">
              <Label>Lancar na fatura</Label>
              {creditCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Cadastre um cartao na aba Despesas para atualizar a fatura
                  automaticamente.
                </p>
              ) : (
                <Select value={cardId} onValueChange={setCardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cartao" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}{" "}
                        {card.lastDigits ? `•••• ${card.lastDigits}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Estabelecimento</Label>
            <Input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Dar baixa e registrar compra"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
