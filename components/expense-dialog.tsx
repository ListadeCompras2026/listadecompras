"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseMoney } from "@/lib/money";
import type { PaymentMethod, TransactionCategory } from "@/lib/types";
import {
  paymentMethodLabels,
  transactionCategoryLabels,
  transactionCategoryOrder,
} from "@/lib/types";
import { PaymentCardSelect } from "@/components/payment-card-select";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  onCreated,
}: ExpenseDialogProps) {
  const createExpense = useAppStore((state) => state.createExpense);
  const creditCards = useAppStore((state) => state.creditCards);
  const mealCards = useAppStore((state) => state.mealCards);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("food");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [cardId, setCardId] = useState("");
  const [mealCardId, setMealCardId] = useState("");
  const [store, setStore] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setAmount("");
    setCategory("food");
    setPaymentMethod("pix");
    setCardId(creditCards[0]?.id || "");
    setMealCardId(mealCards[0]?.id || "");
    setStore("");
    setDate(format(new Date(), "yyyy-MM-dd"));
  }, [creditCards, mealCards, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = parseMoney(amount);
    if (!name.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Preencha descrição e um valor válido");
      return;
    }
    if (paymentMethod === "credit" && creditCards.length > 0 && !cardId) {
      toast.error("Selecione o cartão");
      return;
    }
    if (paymentMethod === "meal" && mealCards.length > 0 && !mealCardId) {
      toast.error("Selecione o cartão alimentação");
      return;
    }

    setIsSaving(true);
    const success = await createExpense({
      name: name.trim(),
      amount: parsedAmount,
      paymentMethod,
      category,
      store: store.trim() || undefined,
      cardId:
        paymentMethod === "credit" ? cardId || creditCards[0]?.id : undefined,
      mealCardId:
        paymentMethod === "meal" ? mealCardId || mealCards[0]?.id : undefined,
      completedAt: date,
    });
    setIsSaving(false);

    if (!success) {
      toast.error("Não foi possível salvar a despesa");
      return;
    }

    toast.success("Despesa lançada");
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova despesa</DialogTitle>
          <DialogDescription>
            Lança uma movimentação avulsa, sem lista de compras.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-name">Descrição</Label>
            <Input
              id="expense-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Uber, farmácia, almoço..."
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Valor</Label>
              <Input
                id="expense-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Data</Label>
              <Input
                id="expense-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory(value as TransactionCategory)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transactionCategoryOrder.map((key) => (
                  <SelectItem key={key} value={key}>
                    {transactionCategoryLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map(
                (method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={paymentMethod === method ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setPaymentMethod(method)}
                  >
                    {paymentMethodLabels[method]}
                  </Button>
                )
              )}
            </div>
          </div>
          <PaymentCardSelect
            paymentMethod={paymentMethod}
            cardId={cardId}
            onCardIdChange={setCardId}
            mealCardId={mealCardId}
            onMealCardIdChange={setMealCardId}
          />
          <div className="space-y-2">
            <Label htmlFor="expense-store">Onde foi (opcional)</Label>
            <Input
              id="expense-store"
              value={store}
              onChange={(event) => setStore(event.target.value)}
              placeholder="Padaria, posto, app..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Lançar despesa"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
