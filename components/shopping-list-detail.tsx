"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  ShoppingCart,
  Trash2,
  QrCode,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import type { ParsedReceipt, PaymentMethod, ShoppingList } from "@/lib/types";
import { categoryLabels, paymentMethodLabels } from "@/lib/types";
import { formatCurrency } from "@/lib/money";
import { QrScannerDialog } from "@/components/qr-scanner-dialog";
import { ReceiptReconcileDialog } from "@/components/receipt-reconcile-dialog";
import { ReceiptTotalDialog } from "@/components/receipt-total-dialog";
import { PaymentCardSelect } from "@/components/payment-card-select";
import { ReceiptNeedsTotalError } from "@/lib/nfce/errors";

interface ShoppingListDetailProps {
  list: ShoppingList;
  onBack: () => void;
}

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  credit: <CreditCard className="w-4 h-4" />,
  debit: <CreditCard className="w-4 h-4" />,
  pix: <Smartphone className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  meal: <UtensilsCrossed className="w-4 h-4" />,
};

export function ShoppingListDetail({ list, onBack }: ShoppingListDetailProps) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [isReadingReceipt, setIsReadingReceipt] = useState(false);
  const [totalPrompt, setTotalPrompt] = useState<{
    accessKey?: string;
    sourceUrl?: string;
  } | null>(null);

  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemUnit, setItemUnit] = useState("un");
  const [itemCategory, setItemCategory] = useState("others");

  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [storeName, setStoreName] = useState("");
  const [cardId, setCardId] = useState("");
  const [mealCardId, setMealCardId] = useState("");

  const addItemToList = useAppStore((state) => state.addItemToList);
  const removeItemFromList = useAppStore((state) => state.removeItemFromList);
  const toggleItemChecked = useAppStore((state) => state.toggleItemChecked);
  const completePurchase = useAppStore((state) => state.completePurchase);
  const parseReceipt = useAppStore((state) => state.parseReceipt);
  const creditCards = useAppStore((state) => state.creditCards);
  const mealCards = useAppStore((state) => state.mealCards);
  const loadExpenses = useAppStore((state) => state.loadExpenses);

  const checkedCount = list.items.filter((item) => item.checked).length;
  const progress =
    list.items.length > 0 ? (checkedCount / list.items.length) * 100 : 0;

  const handleAddItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!itemName.trim()) {
      toast.error("Digite o nome do item");
      return;
    }

    const success = await addItemToList(list.id, {
      name: itemName.trim(),
      quantity: parseInt(itemQuantity, 10) || 1,
      unit: itemUnit,
      category: itemCategory,
    });

    if (!success) {
      toast.error("Nao foi possivel adicionar o item");
      return;
    }

    setItemName("");
    setItemQuantity("1");
    setIsAddItemOpen(false);
    toast.success("Item adicionado!");
  };

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseFloat(totalAmount.replace(",", "."));
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Digite um valor valido");
      return;
    }
    if (paymentMethod === "credit" && !cardId && creditCards.length > 0) {
      toast.error("Selecione o cartao");
      return;
    }
    if (paymentMethod === "meal" && mealCards.length > 0 && !mealCardId) {
      toast.error("Selecione o cartão alimentação");
      return;
    }

    const success = await completePurchase({
      listId: list.id,
      totalAmount: amount,
      paymentMethod,
      store: storeName || undefined,
      cardId:
        paymentMethod === "credit" ? cardId || creditCards[0]?.id : undefined,
      mealCardId:
        paymentMethod === "meal" ? mealCardId || mealCards[0]?.id : undefined,
      items: list.items
        .filter((item) => item.checked)
        .map((item) => ({
          listItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
        })),
    });
    if (!success) {
      toast.error("Nao foi possivel finalizar a compra");
      return;
    }

    if (paymentMethod === "credit") {
      await loadExpenses();
    }

    toast.success("Compra finalizada!");
    onBack();
  };

  const handleScan = async (qrContent: string) => {
    setIsScannerOpen(false);
    setIsReadingReceipt(true);
    try {
      const parsed = await parseReceipt(qrContent);
      setReceipt(parsed);
      setIsReconcileOpen(true);
    } catch (error) {
      if (error instanceof ReceiptNeedsTotalError) {
        setTotalPrompt({
          accessKey: error.accessKey,
          sourceUrl: error.sourceUrl,
        });
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel ler o cupom"
      );
    } finally {
      setIsReadingReceipt(false);
    }
  };

  const groupedItems = list.items.reduce(
    (acc, item) => {
      const category = item.category || "others";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, typeof list.items>
  );

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-30 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold text-foreground">
              {list.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {checkedCount} de {list.items.length} itens
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 p-4 pb-[calc(var(--bottom-nav-height)+8rem)] space-y-4">
        {isReadingReceipt && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Lendo itens do cupom...
            </CardContent>
          </Card>
        )}
        {list.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Lista vazia</p>
            <p className="text-sm text-muted-foreground/70">
              Adicione itens para comecar
            </p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {categoryLabels[category] || category}
              </h3>
              {items.map((item) => (
                <Card
                  key={item.id}
                  className={`rounded-2xl border-0 shadow-none ${item.checked ? "opacity-60" : ""}`}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={async () => {
                        const success = await toggleItemChecked(
                          list.id,
                          item.id
                        );
                        if (!success)
                          toast.error("Nao foi possivel atualizar o item");
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit}
                        {typeof item.totalPrice === "number"
                          ? ` • ${formatCurrency(item.totalPrice)}`
                          : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={async () => {
                        const success = await removeItemFromList(
                          list.id,
                          item.id
                        );
                        toast[success ? "success" : "error"](
                          success
                            ? "Item removido"
                            : "Nao foi possivel remover o item"
                        );
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-(--bottom-nav-height) left-0 right-0 z-40 border-t border-border bg-background p-3">
        <div className="flex gap-2">
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2">
                <Plus className="w-4 h-4" />
                Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome do item</Label>
                  <Input
                    placeholder="Ex: Arroz, Feijao, Leite..."
                    value={itemName}
                    onChange={(event) => setItemName(event.target.value)}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(event) => setItemQuantity(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select value={itemUnit} onValueChange={setItemUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">Unidade</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="g">Gramas</SelectItem>
                        <SelectItem value="L">Litro</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="pct">Pacote</SelectItem>
                        <SelectItem value="cx">Caixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={itemCategory} onValueChange={setItemCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Adicionar
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            className="flex-1 gap-2"
            onClick={() => setIsScannerOpen(true)}
            disabled={list.items.length === 0}
          >
            <QrCode className="w-4 h-4" />
            Ler cupom
          </Button>

          <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                className="gap-2"
                disabled={checkedCount === 0}
              >
                <Wallet className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Finalizar sem cupom</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCheckout} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Valor total</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={totalAmount}
                      onChange={(event) => setTotalAmount(event.target.value)}
                      className="pl-10"
                      autoFocus
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
                          variant={
                            paymentMethod === method ? "default" : "outline"
                          }
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
                <PaymentCardSelect
                  paymentMethod={paymentMethod}
                  cardId={cardId}
                  onCardIdChange={setCardId}
                  mealCardId={mealCardId}
                  onMealCardIdChange={setMealCardId}
                />
                <div className="space-y-2">
                  <Label>Estabelecimento (opcional)</Label>
                  <Input
                    placeholder="Ex: Supermercado XYZ"
                    value={storeName}
                    onChange={(event) => setStoreName(event.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Confirmar compra
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <QrScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleScan}
      />
      <ReceiptTotalDialog
        open={!!totalPrompt}
        accessKey={totalPrompt?.accessKey}
        sourceUrl={totalPrompt?.sourceUrl}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setTotalPrompt(null);
        }}
        onConfirm={(parsed) => {
          setTotalPrompt(null);
          setReceipt(parsed);
          setIsReconcileOpen(true);
        }}
      />
      <ReceiptReconcileDialog
        open={isReconcileOpen}
        onOpenChange={setIsReconcileOpen}
        list={list}
        receipt={receipt}
        onCompleted={() => {
          const fresh = useAppStore.getState().getListById(list.id);
          if (
            !fresh ||
            fresh.status === "completed" ||
            fresh.items.every((item) => item.checked)
          ) {
            onBack();
          }
        }}
      />
    </div>
  );
}
