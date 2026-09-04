"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/money";
import type { PaymentMethod } from "@/lib/types";

interface PaymentCardSelectProps {
  paymentMethod: PaymentMethod;
  cardId: string;
  onCardIdChange: (value: string) => void;
  mealCardId: string;
  onMealCardIdChange: (value: string) => void;
}

export function PaymentCardSelect({
  paymentMethod,
  cardId,
  onCardIdChange,
  mealCardId,
  onMealCardIdChange,
}: PaymentCardSelectProps) {
  const creditCards = useAppStore((state) => state.creditCards);
  const mealCards = useAppStore((state) => state.mealCards);

  if (paymentMethod === "credit" && creditCards.length > 0) {
    return (
      <div className="space-y-2">
        <Label>Cartão de crédito</Label>
        <Select
          value={cardId || creditCards[0]?.id}
          onValueChange={onCardIdChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {creditCards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.isOwner
                  ? card.isShared
                    ? `${card.name} (compartilhado)`
                    : card.name
                  : `${card.name} (compartilhado)`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (paymentMethod === "meal" && mealCards.length > 0) {
    return (
      <div className="space-y-2">
        <Label>Cartão alimentação</Label>
        <Select
          value={mealCardId || mealCards[0]?.id}
          onValueChange={onMealCardIdChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mealCards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.name} • {formatCurrency(card.balance)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return null;
}
