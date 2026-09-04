"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QrScannerDialog } from "@/components/qr-scanner-dialog";
import { Button } from "@/components/ui/button";
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
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/money";
import type { ParsedReceipt, PaymentMethod } from "@/lib/types";
import { paymentMethodLabels } from "@/lib/types";

interface QuickReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

function cardLabel(name: string, isShared: boolean, isOwner: boolean) {
  if (!isOwner) return `${name} (compartilhado)`;
  if (isShared) return `${name} (compartilhado)`;
  return name;
}

export function QuickReceiptDialog({
  open,
  onOpenChange,
  onCreated,
}: QuickReceiptDialogProps) {
  const parseReceipt = useAppStore((state) => state.parseReceipt);
  const createExpense = useAppStore((state) => state.createExpense);
  const creditCards = useAppStore((state) => state.creditCards);
  const currentUser = useAppStore((state) => state.currentUser);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [cardId, setCardId] = useState("");
  const keepOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setScannerOpen(false);
      setReceipt(null);
      setIsReading(false);
      setIsSaving(false);
      keepOpenRef.current = false;
      return;
    }
    keepOpenRef.current = false;
    setReceipt(null);
    setScannerOpen(true);
    setCardId(creditCards[0]?.id || "");
  }, [creditCards, open]);

  const handleScan = async (value: string) => {
    keepOpenRef.current = true;
    setScannerOpen(false);
    setIsReading(true);
    try {
      const parsed = await parseReceipt(value);
      if (!parsed) {
        toast.error("Não foi possível ler o cupom");
        onOpenChange(false);
        return;
      }
      setReceipt(parsed);
      setPaymentMethod(parsed.paymentMethod || "pix");
      if (parsed.paymentMethod === "credit") {
        setCardId(creditCards[0]?.id || "");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível ler o cupom"
      );
      onOpenChange(false);
    } finally {
      setIsReading(false);
    }
  };

  const handleSave = async () => {
    if (!receipt) return;
    if (paymentMethod === "credit" && creditCards.length > 0 && !cardId) {
      toast.error("Selecione o cartão");
      return;
    }

    const selectedCard = creditCards.find((card) => card.id === cardId);
    setIsSaving(true);
    const success = await createExpense({
      name: receipt.store || "Compra no cupom",
      amount: receipt.totalAmount,
      paymentMethod,
      category: "shopping",
      store: receipt.store,
      cardId:
        paymentMethod === "credit" ? cardId || creditCards[0]?.id : undefined,
      receiptKey: receipt.accessKey,
      receiptUrl: receipt.sourceUrl,
      items: receipt.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    });
    setIsSaving(false);

    if (!success) {
      toast.error("Não foi possível lançar a compra");
      return;
    }

    const who =
      paymentMethod === "credit" && selectedCard?.isShared
        ? ` no cartão compartilhado, no nome de ${currentUser?.name ?? "você"}`
        : "";
    toast.success(`Compra lançada${who}`);
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <>
      <QrScannerDialog
        open={open && scannerOpen}
        onOpenChange={(nextOpen) => {
          setScannerOpen(nextOpen);
          if (!nextOpen && !keepOpenRef.current) {
            onOpenChange(false);
          }
        }}
        onScan={(value) => {
          void handleScan(value);
        }}
      />

      <Dialog
        open={open && (isReading || !!receipt)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onOpenChange(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar pelo cupom</DialogTitle>
            <DialogDescription>
              Confirme o pagamento. Se for cartão compartilhado, o lançamento
              fica no seu nome.
            </DialogDescription>
          </DialogHeader>

          {isReading && (
            <p className="text-sm text-muted-foreground">Lendo o cupom...</p>
          )}

          {receipt && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">
                  {receipt.store || "Estabelecimento"}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatCurrency(receipt.totalAmount)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {receipt.items.length}{" "}
                  {receipt.items.length === 1 ? "item" : "itens"} no cupom
                </p>
              </div>

              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map(
                    (method) => (
                      <Button
                        key={method}
                        type="button"
                        variant={
                          paymentMethod === method ? "default" : "outline"
                        }
                        className="justify-start"
                        onClick={() => setPaymentMethod(method)}
                      >
                        {paymentMethodLabels[method]}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {paymentMethod === "credit" && creditCards.length > 0 && (
                <div className="space-y-2">
                  <Label>Cartão</Label>
                  <Select
                    value={cardId || creditCards[0]?.id}
                    onValueChange={setCardId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {creditCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {cardLabel(card.name, card.isShared, card.isOwner)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {paymentMethod === "credit" &&
                creditCards.find(
                  (card) => card.id === (cardId || creditCards[0]?.id)
                )?.isShared && (
                  <p className="text-xs text-muted-foreground">
                    Lançamento no nome de {currentUser?.name ?? "você"}, para
                    identificar na hora de pagar.
                  </p>
                )}

              <Button
                className="w-full"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? "Lançando..." : "Confirmar lançamento"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
