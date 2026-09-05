"use client";

import { useState } from "react";
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
import { parseMoney } from "@/lib/money";
import { receiptFromTotal } from "@/lib/nfce/parse-qr";
import type { ParsedReceipt } from "@/lib/types";

interface ReceiptTotalDialogProps {
  open: boolean;
  accessKey?: string;
  sourceUrl?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (receipt: ParsedReceipt) => void;
}

export function ReceiptTotalDialog({
  open,
  accessKey,
  sourceUrl,
  onOpenChange,
  onConfirm,
}: ReceiptTotalDialogProps) {
  const [total, setTotal] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseMoney(total);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Informe o total do cupom");
      return;
    }
    onConfirm(receiptFromTotal(amount, accessKey, sourceUrl));
    setTotal("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Total do cupom</DialogTitle>
          <DialogDescription>
            "A SEFAZ nao liberou os itens deste cupom automaticamente. Informe o
            valor total impresso para lancar a compra."
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="receipt-total">Total</Label>
            <Input
              id="receipt-total"
              inputMode="decimal"
              placeholder="0,00"
              value={total}
              onChange={(event) => {
                setTotal(event.target.value);
                setError("");
              }}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <Button type="submit" className="w-full">
            Usar este total
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
