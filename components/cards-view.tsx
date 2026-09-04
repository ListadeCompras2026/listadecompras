"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Landmark, Plus, Share2, Trash2, UtensilsCrossed } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, parseMoney } from "@/lib/money";
import { creditCardSkins, mealCardSkins } from "@/lib/category-ui";
import { cn } from "@/lib/utils";
import type { CardInvoice, PaymentMethod } from "@/lib/types";
import { paymentMethodLabels } from "@/lib/types";
import { currentInvoicePeriod } from "@/lib/period";
import { InvoiceBreakdown } from "@/components/invoice-breakdown";
import type { QuickAction } from "./main-app";

interface CardsViewProps {
  quickAction?: QuickAction;
  onQuickActionConsumed?: () => void;
}

export function CardsView({
  quickAction,
  onQuickActionConsumed,
}: CardsViewProps) {
  const creditCards = useAppStore((state) => state.creditCards);
  const mealCards = useAppStore((state) => state.mealCards);
  const invoices = useAppStore((state) => state.invoices);
  const purchases = useAppStore((state) => state.purchases);
  const bankAccount = useAppStore((state) => state.bankAccount);
  const currentUser = useAppStore((state) => state.currentUser);
  const loadExpenses = useAppStore((state) => state.loadExpenses);
  const createCreditCard = useAppStore((state) => state.createCreditCard);
  const updateCreditCard = useAppStore((state) => state.updateCreditCard);
  const shareCreditCard = useAppStore((state) => state.shareCreditCard);
  const unshareCreditCard = useAppStore((state) => state.unshareCreditCard);
  const deleteCreditCard = useAppStore((state) => state.deleteCreditCard);
  const createMealCard = useAppStore((state) => state.createMealCard);
  const rechargeMealCard = useAppStore((state) => state.rechargeMealCard);
  const deleteMealCard = useAppStore((state) => state.deleteMealCard);
  const updateInvoiceAmount = useAppStore((state) => state.updateInvoiceAmount);
  const payInvoice = useAppStore((state) => state.payInvoice);
  const reopenInvoice = useAppStore((state) => state.reopenInvoice);
  const setBankBalance = useAppStore((state) => state.setBankBalance);
  const addBankIncome = useAppStore((state) => state.addBankIncome);

  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isMealOpen, setIsMealOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<CardInvoice | null>(
    null
  );
  const [payingInvoice, setPayingInvoice] = useState<CardInvoice | null>(null);
  const [sharingCardId, setSharingCardId] = useState<string | null>(null);
  const [limitCardId, setLimitCardId] = useState<string | null>(null);
  const [rechargingCardId, setRechargingCardId] = useState<string | null>(null);

  const [cardName, setCardName] = useState("");
  const [cardDigits, setCardDigits] = useState("");
  const [cardClosingDay, setCardClosingDay] = useState("10");
  const [cardDueDay, setCardDueDay] = useState("17");
  const [cardLimit, setCardLimit] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [invoicePayMethod, setInvoicePayMethod] =
    useState<PaymentMethod>("pix");
  const [bankAmount, setBankAmount] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [mealName, setMealName] = useState("");
  const [mealDigits, setMealDigits] = useState("");
  const [mealBalance, setMealBalance] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  useEffect(() => {
    void loadExpenses();
    void useAppStore.getState().loadPurchases();
  }, [loadExpenses]);

  useEffect(() => {
    if (quickAction === "card") {
      setIsCardOpen(true);
      onQuickActionConsumed?.();
    }
  }, [onQuickActionConsumed, quickAction]);

  const sharingCard = creditCards.find((card) => card.id === sharingCardId);
  const limitCard = creditCards.find((card) => card.id === limitCardId);
  const rechargingCard = mealCards.find((card) => card.id === rechargingCardId);

  const invoiceCharges = (invoice: CardInvoice | null) => {
    if (!invoice) return [];
    const card = creditCards.find((entry) => entry.id === invoice.cardId);
    return purchases.filter((purchase) => {
      if (purchase.cardId !== invoice.cardId) return false;
      if (purchase.paymentMethod !== "credit") return false;
      if (card) {
        const period = currentInvoicePeriod(
          card.closingDay,
          new Date(purchase.completedAt)
        );
        return period.year === invoice.year && period.month === invoice.month;
      }
      const date = new Date(purchase.completedAt);
      return (
        date.getFullYear() === invoice.year && date.getMonth() === invoice.month
      );
    });
  };

  const usedOnCard = (cardId: string) =>
    invoices
      .filter(
        (invoice) => invoice.cardId === cardId && invoice.status === "open"
      )
      .reduce((sum, invoice) => sum + invoice.amount, 0);

  const handleCreateCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cardName.trim()) {
      toast.error("Digite o nome do cartão");
      return;
    }
    const limit = cardLimit.trim() ? parseMoney(cardLimit) : undefined;
    if (limit !== undefined && (!Number.isFinite(limit) || limit < 0)) {
      toast.error("Informe um limite válido");
      return;
    }
    const created = await createCreditCard({
      name: cardName.trim(),
      lastDigits: cardDigits.trim() || undefined,
      closingDay: Number.parseInt(cardClosingDay, 10) || 1,
      dueDay: Number.parseInt(cardDueDay, 10) || 1,
      creditLimit: limit,
    });
    if (!created) {
      toast.error("Não foi possível cadastrar o cartão");
      return;
    }
    setCardName("");
    setCardDigits("");
    setCardLimit("");
    setIsCardOpen(false);
    toast.success("Cartão cadastrado");
  };

  const handleCreateMeal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mealName.trim()) {
      toast.error("Digite o nome do cartão");
      return;
    }
    const balance = mealBalance.trim() ? parseMoney(mealBalance) : 0;
    if (!Number.isFinite(balance) || balance < 0) {
      toast.error("Informe o valor da recarga");
      return;
    }
    const created = await createMealCard({
      name: mealName.trim(),
      lastDigits: mealDigits.trim() || undefined,
      balance,
    });
    if (!created) {
      toast.error("Não foi possível cadastrar o cartão");
      return;
    }
    setMealName("");
    setMealDigits("");
    setMealBalance("");
    setIsMealOpen(false);
    toast.success("Cartão alimentação cadastrado");
  };

  return (
    <section className="space-y-5 p-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Cartões</h1>
        <p className="text-sm text-muted-foreground">
          Crédito, alimentação e conta para receber
        </p>
      </div>

      <div className="soft-shadow rounded-2xl bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Conta de recebimento
            </p>
            <p className="text-xs text-muted-foreground">
              PIX e débito abatem deste saldo
            </p>
          </div>
          <p className="text-lg font-bold text-foreground">
            {bankAccount?.configured
              ? formatCurrency(bankAccount.balance)
              : "—"}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            onClick={() => {
              setIncomeAmount("");
              setIsIncomeOpen(true);
            }}
          >
            Recebimento
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBankAmount(
                bankAccount?.configured
                  ? String(bankAccount.balance).replace(".", ",")
                  : ""
              );
              setIsBankOpen(true);
            }}
          >
            Ajustar saldo
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Cartões de crédito
          </h2>
          <button
            type="button"
            onClick={() => setIsCardOpen(true)}
            className="text-xs font-medium text-primary"
          >
            Novo cartão
          </button>
        </div>

        {creditCards.length === 0 ? (
          <button
            type="button"
            onClick={() => setIsCardOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-card px-4 py-8 text-sm font-medium text-primary"
          >
            <Plus className="h-5 w-5" />
            Cadastrar cartão de crédito
          </button>
        ) : (
          <div className="space-y-3">
            {creditCards.map((card, index) => {
              const invoice = invoices.find(
                (entry) => entry.cardId === card.id
              );
              const used = usedOnCard(card.id);
              const available =
                typeof card.creditLimit === "number"
                  ? card.creditLimit - used
                  : undefined;
              return (
                <article
                  key={card.id}
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-4 text-white",
                    creditCardSkins[index % creditCardSkins.length]
                  )}
                >
                  <p className="text-xs text-white/70">
                    {card.lastDigits ? `•••• ${card.lastDigits}` : "Cartão"}
                    {card.isShared ? " • Compartilhado" : ""}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{card.name}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-white/70">Fatura</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(invoice?.amount ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/70">Disponível</p>
                      <p className="text-xl font-bold">
                        {available === undefined
                          ? "—"
                          : formatCurrency(available)}
                      </p>
                    </div>
                  </div>
                  {typeof card.creditLimit === "number" && (
                    <p className="mt-1 text-[11px] text-white/70">
                      Limite {formatCurrency(card.creditLimit)}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-white/80">
                    Vence dia {card.dueDay} •{" "}
                    {invoice?.status === "paid" ? "Paga" : "Aberta"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {invoice ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 bg-white/20 text-white hover:bg-white/30"
                          onClick={() => {
                            setEditingInvoice(invoice);
                            setInvoiceAmount(
                              String(invoice.amount).replace(".", ",")
                            );
                          }}
                        >
                          Fatura
                        </Button>
                        {invoice.status === "open" ? (
                          <Button
                            size="sm"
                            className="h-7 bg-white text-foreground hover:bg-white/90"
                            onClick={() => {
                              setPayingInvoice(invoice);
                              setInvoicePayMethod("pix");
                            }}
                          >
                            Pagar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 bg-white/20 text-white hover:bg-white/30"
                            onClick={() => void reopenInvoice(invoice.id)}
                          >
                            Reabrir
                          </Button>
                        )}
                      </>
                    ) : null}
                    {card.isOwner && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 bg-white/20 text-white hover:bg-white/30"
                          onClick={() => {
                            setLimitCardId(card.id);
                            setLimitAmount(
                              typeof card.creditLimit === "number"
                                ? String(card.creditLimit).replace(".", ",")
                                : ""
                            );
                          }}
                        >
                          Limite
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 bg-white/20 text-white hover:bg-white/30"
                          onClick={() => {
                            setSharingCardId(card.id);
                            setShareEmail("");
                          }}
                        >
                          <Share2 className="mr-1 h-3.5 w-3.5" />
                          Compartilhar
                        </Button>
                      </>
                    )}
                  </div>
                  {card.isOwner && (
                    <button
                      type="button"
                      onClick={() => void deleteCreditCard(card.id)}
                      className="absolute right-3 top-3 text-white/60 hover:text-white"
                      aria-label={`Excluir ${card.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Cartões alimentação
          </h2>
          <button
            type="button"
            onClick={() => setIsMealOpen(true)}
            className="text-xs font-medium text-primary"
          >
            Novo cartão
          </button>
        </div>

        {mealCards.length === 0 ? (
          <button
            type="button"
            onClick={() => setIsMealOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-400/50 bg-card px-4 py-8 text-sm font-medium text-emerald-700"
          >
            <UtensilsCrossed className="h-5 w-5" />
            Cadastrar VR, VA ou similar
          </button>
        ) : (
          <div className="space-y-3">
            {mealCards.map((card, index) => (
              <article
                key={card.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-4 text-white",
                  mealCardSkins[index % mealCardSkins.length]
                )}
              >
                <p className="text-xs text-white/70">
                  {card.lastDigits
                    ? `•••• ${card.lastDigits}`
                    : "Alimentação / refeição"}
                </p>
                <p className="mt-1 text-lg font-semibold">{card.name}</p>
                <p className="mt-4 text-[11px] text-white/70">Saldo</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(card.balance)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 bg-white text-foreground hover:bg-white/90"
                    onClick={() => {
                      setRechargingCardId(card.id);
                      setRechargeAmount("");
                    }}
                  >
                    Recarga
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteMealCard(card.id)}
                  className="absolute right-3 top-3 text-white/60 hover:text-white"
                  aria-label={`Excluir ${card.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog open={isCardOpen} onOpenChange={setIsCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cartão de crédito</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCard} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={cardName}
                onChange={(event) => setCardName(event.target.value)}
                placeholder="Nubank, Inter..."
              />
            </div>
            <div className="space-y-2">
              <Label>Final (opcional)</Label>
              <Input
                maxLength={4}
                inputMode="numeric"
                value={cardDigits}
                onChange={(event) =>
                  setCardDigits(event.target.value.replace(/\D/g, ""))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Limite</Label>
              <Input
                inputMode="decimal"
                value={cardLimit}
                onChange={(event) => setCardLimit(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha dia</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={cardClosingDay}
                  onChange={(event) => setCardClosingDay(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Vence dia</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={cardDueDay}
                  onChange={(event) => setCardDueDay(event.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Cadastrar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMealOpen} onOpenChange={setIsMealOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cartão alimentação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateMeal} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={mealName}
                onChange={(event) => setMealName(event.target.value)}
                placeholder="VR, Alelo, Sodexo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Final (opcional)</Label>
              <Input
                maxLength={4}
                inputMode="numeric"
                value={mealDigits}
                onChange={(event) =>
                  setMealDigits(event.target.value.replace(/\D/g, ""))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Valor da recarga</Label>
              <Input
                inputMode="decimal"
                value={mealBalance}
                onChange={(event) => setMealBalance(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <Button type="submit" className="w-full">
              Cadastrar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingInvoice}
        onOpenChange={(open) => !open && setEditingInvoice(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fatura {editingInvoice?.cardName}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!editingInvoice) return;
              const amount = parseMoney(invoiceAmount);
              if (!Number.isFinite(amount) || amount < 0) {
                toast.error("Informe um valor válido");
                return;
              }
              const success = await updateInvoiceAmount(
                editingInvoice.id,
                amount
              );
              toast[success ? "success" : "error"](
                success
                  ? "Fatura atualizada"
                  : "Não foi possível atualizar a fatura"
              );
              if (success) setEditingInvoice(null);
            }}
          >
            {editingInvoice && (
              <InvoiceBreakdown
                charges={invoiceCharges(editingInvoice)}
                currentUserName={currentUser?.name}
              />
            )}
            <div className="space-y-2">
              <Label>Valor atual da fatura</Label>
              <Input
                inputMode="decimal"
                value={invoiceAmount}
                onChange={(event) => setInvoiceAmount(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Salvar valor
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!sharingCard}
        onOpenChange={(open) => !open && setSharingCardId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar {sharingCard?.name}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!sharingCard || !shareEmail.trim()) {
                toast.error("Informe o e-mail da pessoa");
                return;
              }
              const success = await shareCreditCard(
                sharingCard.id,
                shareEmail.trim()
              );
              toast[success ? "success" : "error"](
                success
                  ? "Cartão compartilhado. A outra pessoa já vê a fatura e pode lançar."
                  : "Não foi possível compartilhar. Confira se a pessoa já tem cadastro."
              );
              if (success) setShareEmail("");
            }}
          >
            <div className="space-y-2">
              <Label>E-mail de quem vai usar o cartão</Label>
              <Input
                type="email"
                value={shareEmail}
                onChange={(event) => setShareEmail(event.target.value)}
                placeholder="pessoa@email.com"
              />
            </div>
            {sharingCard && sharingCard.members.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Quem tem acesso
                </p>
                {sharingCard.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>
                      {member.name}
                      {member.id === sharingCard.createdBy ? " (dono)" : ""}
                    </span>
                    {member.id !== sharingCard.createdBy && (
                      <button
                        type="button"
                        className="text-xs text-destructive"
                        onClick={async () => {
                          const success = await unshareCreditCard(
                            sharingCard.id,
                            member.id
                          );
                          toast[success ? "success" : "error"](
                            success
                              ? "Acesso removido"
                              : "Não foi possível remover"
                          );
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Button type="submit" className="w-full">
              Compartilhar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!payingInvoice}
        onOpenChange={(open) => !open && setPayingInvoice(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar fatura {payingInvoice?.cardName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {payingInvoice ? formatCurrency(payingInvoice.amount) : ""}
            </p>
            {payingInvoice && (
              <InvoiceBreakdown
                charges={invoiceCharges(payingInvoice)}
                currentUserName={currentUser?.name}
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              {(["pix", "debit", "cash"] as PaymentMethod[]).map((method) => (
                <Button
                  key={method}
                  type="button"
                  variant={invoicePayMethod === method ? "default" : "outline"}
                  onClick={() => setInvoicePayMethod(method)}
                >
                  {paymentMethodLabels[method]}
                </Button>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={async () => {
                if (!payingInvoice) return;
                const success = await payInvoice(
                  payingInvoice.id,
                  invoicePayMethod
                );
                toast[success ? "success" : "error"](
                  success ? "Fatura paga" : "Não foi possível pagar"
                );
                setPayingInvoice(null);
              }}
            >
              Confirmar pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!limitCard}
        onOpenChange={(open) => !open && setLimitCardId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limite de {limitCard?.name}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!limitCard) return;
              const amount = parseMoney(limitAmount);
              if (!Number.isFinite(amount) || amount < 0) {
                toast.error("Informe um limite válido");
                return;
              }
              const success = await updateCreditCard(limitCard.id, {
                creditLimit: amount,
              });
              toast[success ? "success" : "error"](
                success ? "Limite atualizado" : "Não foi possível salvar"
              );
              if (success) setLimitCardId(null);
            }}
          >
            <div className="space-y-2">
              <Label>Limite total</Label>
              <Input
                inputMode="decimal"
                value={limitAmount}
                onChange={(event) => setLimitAmount(event.target.value)}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground">
                O disponível é o limite menos a fatura aberta.
              </p>
            </div>
            <Button type="submit" className="w-full">
              Salvar limite
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rechargingCard}
        onOpenChange={(open) => !open && setRechargingCardId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recarga {rechargingCard?.name}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!rechargingCard) return;
              const amount = parseMoney(rechargeAmount);
              if (!Number.isFinite(amount) || amount <= 0) {
                toast.error("Informe o valor da recarga");
                return;
              }
              const success = await rechargeMealCard(rechargingCard.id, amount);
              toast[success ? "success" : "error"](
                success ? "Recarga lançada" : "Não foi possível recarregar"
              );
              if (success) setRechargingCardId(null);
            }}
          >
            <p className="text-sm text-muted-foreground">
              Saldo atual{" "}
              {rechargingCard ? formatCurrency(rechargingCard.balance) : ""}
            </p>
            <div className="space-y-2">
              <Label>Valor da recarga</Label>
              <Input
                inputMode="decimal"
                value={rechargeAmount}
                onChange={(event) => setRechargeAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <Button type="submit" className="w-full">
              Confirmar recarga
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isIncomeOpen} onOpenChange={setIsIncomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recebimento</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const amount = parseMoney(incomeAmount);
              if (!Number.isFinite(amount) || amount <= 0) {
                toast.error("Informe o valor recebido");
                return;
              }
              const success = await addBankIncome(amount);
              toast[success ? "success" : "error"](
                success
                  ? "Recebimento lançado na conta"
                  : "Não foi possível lançar"
              );
              if (success) setIsIncomeOpen(false);
            }}
          >
            <div className="space-y-2">
              <Label>Valor recebido</Label>
              <Input
                inputMode="decimal"
                value={incomeAmount}
                onChange={(event) => setIncomeAmount(event.target.value)}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground">
                Soma no saldo. PIX e débito continuam abatendo daqui.
              </p>
            </div>
            <Button type="submit" className="w-full">
              Lançar recebimento
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBankOpen} onOpenChange={setIsBankOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar saldo da conta</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const amount = parseMoney(bankAmount);
              if (!Number.isFinite(amount)) {
                toast.error("Informe um valor válido");
                return;
              }
              const success = await setBankBalance(amount);
              toast[success ? "success" : "error"](
                success
                  ? "Saldo atualizado. Confira com o banco quando quiser."
                  : "Não foi possível salvar o saldo"
              );
              if (success) setIsBankOpen(false);
            }}
          >
            <div className="space-y-2">
              <Label>Quanto tem na conta agora</Label>
              <Input
                inputMode="decimal"
                value={bankAmount}
                onChange={(event) => setBankAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <Button type="submit" className="w-full">
              Salvar saldo
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
