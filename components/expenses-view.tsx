"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, parseMoney } from "@/lib/money";
import { billCategoryMeta, creditCardSkins } from "@/lib/category-ui";
import { cn } from "@/lib/utils";
import type {
  Bill,
  BillCategory,
  CardInvoice,
  PaymentMethod,
} from "@/lib/types";
import { billCategoryLabels, paymentMethodLabels } from "@/lib/types";
import type { QuickAction } from "./main-app";

interface ExpensesViewProps {
  userName: string;
  onOpenSettings: () => void;
  quickAction?: QuickAction;
  onQuickActionConsumed?: () => void;
}

export function ExpensesView({
  userName,
  onOpenSettings,
  quickAction,
  onQuickActionConsumed,
}: ExpensesViewProps) {
  const bills = useAppStore((state) => state.bills);
  const creditCards = useAppStore((state) => state.creditCards);
  const invoices = useAppStore((state) => state.invoices);
  const selectedYear = useAppStore((state) => state.selectedYear);
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  const isExpensesLoading = useAppStore((state) => state.isExpensesLoading);
  const loadExpenses = useAppStore((state) => state.loadExpenses);
  const createBill = useAppStore((state) => state.createBill);
  const updateBill = useAppStore((state) => state.updateBill);
  const payBill = useAppStore((state) => state.payBill);
  const reopenBill = useAppStore((state) => state.reopenBill);
  const deleteBill = useAppStore((state) => state.deleteBill);
  const createCreditCard = useAppStore((state) => state.createCreditCard);
  const deleteCreditCard = useAppStore((state) => state.deleteCreditCard);
  const updateInvoiceAmount = useAppStore((state) => state.updateInvoiceAmount);
  const payInvoice = useAppStore((state) => state.payInvoice);
  const reopenInvoice = useAppStore((state) => state.reopenInvoice);
  const getMonthlyReport = useAppStore((state) => state.getMonthlyReport);

  const selectedDate = startOfMonth(new Date(selectedYear, selectedMonth, 1));
  const report = useMemo(
    () => getMonthlyReport(selectedYear, selectedMonth),
    [getMonthlyReport, selectedMonth, selectedYear]
  );

  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<CardInvoice | null>(
    null
  );

  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDay, setBillDueDay] = useState("10");
  const [billCategory, setBillCategory] = useState<BillCategory>("utilities");
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [billPayMethod, setBillPayMethod] = useState<PaymentMethod>("pix");
  const [billCardId, setBillCardId] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardDigits, setCardDigits] = useState("");
  const [cardClosingDay, setCardClosingDay] = useState("10");
  const [cardDueDay, setCardDueDay] = useState("17");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  useEffect(() => {
    void loadExpenses(selectedYear, selectedMonth);
  }, [loadExpenses, selectedMonth, selectedYear]);

  useEffect(() => {
    if (quickAction === "bill") {
      setEditingBill(null);
      setBillName("");
      setBillAmount("");
      setBillDueDay("10");
      setBillCategory("utilities");
      setIsBillOpen(true);
      onQuickActionConsumed?.();
    }
    if (quickAction === "card") {
      setIsCardOpen(true);
      onQuickActionConsumed?.();
    }
  }, [onQuickActionConsumed, quickAction]);

  const pendingBills = bills.filter((bill) => bill.status === "pending");
  const pendingBillsTotal = pendingBills.reduce(
    (sum, bill) => sum + bill.amount,
    0
  );
  const openInvoicesTotal = invoices
    .filter((invoice) => invoice.status === "open")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const firstName = userName.split(" ")[0];

  const resetBillForm = () => {
    setBillName("");
    setBillAmount("");
    setBillDueDay("10");
    setBillCategory("utilities");
    setEditingBill(null);
  };

  const handleSaveBill = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseMoney(billAmount);
    if (!billName.trim() || !Number.isFinite(amount) || amount < 0) {
      toast.error("Preencha nome e valor da conta");
      return;
    }

    if (editingBill) {
      const success = await updateBill(editingBill.id, {
        name: billName.trim(),
        amount,
        dueDay: Number.parseInt(billDueDay, 10) || 1,
        category: billCategory,
      });
      toast[success ? "success" : "error"](
        success ? "Conta atualizada" : "Nao foi possivel atualizar"
      );
    } else {
      const created = await createBill({
        name: billName.trim(),
        amount,
        dueDay: Number.parseInt(billDueDay, 10) || 1,
        category: billCategory,
      });
      toast[created ? "success" : "error"](
        created ? "Conta adicionada" : "Nao foi possivel criar a conta"
      );
    }

    resetBillForm();
    setIsBillOpen(false);
  };

  const handleCreateCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cardName.trim()) {
      toast.error("Digite o nome do cartao");
      return;
    }
    const created = await createCreditCard({
      name: cardName.trim(),
      lastDigits: cardDigits.trim() || undefined,
      closingDay: Number.parseInt(cardClosingDay, 10) || 1,
      dueDay: Number.parseInt(cardDueDay, 10) || 1,
    });
    if (!created) {
      toast.error("Nao foi possivel cadastrar o cartao");
      return;
    }
    setCardName("");
    setCardDigits("");
    setIsCardOpen(false);
    toast.success("Cartao cadastrado. Agora edite a fatura atual.");
  };

  const handleSaveInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingInvoice) return;
    const amount = parseMoney(invoiceAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Informe um valor valido");
      return;
    }
    const success = await updateInvoiceAmount(editingInvoice.id, amount);
    toast[success ? "success" : "error"](
      success ? "Fatura atualizada" : "Nao foi possivel atualizar a fatura"
    );
    setEditingInvoice(null);
  };

  const openEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setBillName(bill.name);
    setBillAmount(String(bill.amount).replace(".", ","));
    setBillDueDay(String(bill.dueDay));
    setBillCategory(bill.category);
    setIsBillOpen(true);
  };

  const openEditInvoice = (invoice: CardInvoice) => {
    setEditingInvoice(invoice);
    setInvoiceAmount(String(invoice.amount).replace(".", ","));
  };

  const goToMonth = (date: Date) => {
    void loadExpenses(date.getFullYear(), date.getMonth());
  };

  return (
    <div className="pb-8">
      <section className="bg-hero px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/80">Olá,</p>
            <p className="text-xl font-semibold leading-tight">{firstName}</p>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="Mais opções"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={() => goToMonth(subMonths(selectedDate, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="min-w-40 text-center text-base font-medium capitalize">
            {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={() => goToMonth(addMonths(selectedDate, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/80">Despesas do mês</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {formatCurrency(report.total)}
          </p>
        </div>
      </section>

      <div className="-mt-10 space-y-5 px-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="soft-shadow rounded-2xl bg-card p-4">
            <p className="text-xs text-muted-foreground">A pagar</p>
            <p className="mt-1 text-lg font-bold text-expense">
              {formatCurrency(pendingBillsTotal)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {pendingBills.length}{" "}
              {pendingBills.length === 1 ? "conta" : "contas"}
            </p>
          </div>
          <div className="soft-shadow rounded-2xl bg-card p-4">
            <p className="text-xs text-muted-foreground">Faturas abertas</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatCurrency(openInvoicesTotal)}
            </p>
            <p className="text-[11px] text-muted-foreground">Cartões do mês</p>
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

          <div className="hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {creditCards.map((card, index) => {
              const invoice = invoices.find(
                (entry) => entry.cardId === card.id
              );
              return (
                <article
                  key={card.id}
                  className={cn(
                    "relative min-w-[230px] shrink-0 overflow-hidden rounded-2xl p-4 text-white",
                    creditCardSkins[index % creditCardSkins.length]
                  )}
                >
                  <p className="text-xs text-white/70">
                    {card.lastDigits ? `•••• ${card.lastDigits}` : "Cartão"}
                  </p>
                  <p className="mt-1 text-base font-semibold">{card.name}</p>
                  <p className="mt-4 text-2xl font-bold">
                    {formatCurrency(invoice?.amount ?? 0)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-white/80">
                    <span>Vence dia {card.dueDay}</span>
                    <span>
                      {invoice?.status === "paid" ? "Paga" : "Aberta"}
                    </span>
                  </div>
                  {invoice ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 bg-white/20 text-white hover:bg-white/30"
                        onClick={() => openEditInvoice(invoice)}
                      >
                        Editar
                      </Button>
                      {invoice.status === "open" ? (
                        <Button
                          size="sm"
                          className="h-7 bg-white text-foreground hover:bg-white/90"
                          onClick={() => void payInvoice(invoice.id)}
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
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-white/70">
                      Sem fatura neste mês
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void deleteCreditCard(card.id)}
                    className="absolute right-3 top-3 text-white/60 hover:text-white"
                    aria-label={`Excluir ${card.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </article>
              );
            })}

            <button
              type="button"
              onClick={() => setIsCardOpen(true)}
              className="flex min-w-[140px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-card px-4 py-6 text-sm font-medium text-primary"
            >
              <Plus className="h-5 w-5" />
              Cartão
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Pendências
            </h2>
            <button
              type="button"
              onClick={() => {
                resetBillForm();
                setIsBillOpen(true);
              }}
              className="text-xs font-medium text-primary"
            >
              Nova conta
            </button>
          </div>

          {isExpensesLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando contas...
            </p>
          ) : bills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma conta neste mês. Adicione aluguel, luz, internet e o
              restante.
            </div>
          ) : (
            <div className="soft-shadow overflow-hidden rounded-2xl bg-card">
              {bills.map((bill, index) => {
                const meta = billCategoryMeta[bill.category];
                const Icon = meta.icon;
                return (
                  <div
                    key={bill.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      index > 0 && "border-t border-border/70",
                      bill.status === "paid" && "opacity-60"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (bill.status === "paid") {
                          void reopenBill(bill.id);
                          return;
                        }
                        setPayingBill(bill);
                        setBillPayMethod("pix");
                        setBillCardId(creditCards[0]?.id || "");
                      }}
                      className="text-primary"
                      aria-label={
                        bill.status === "paid"
                          ? "Reabrir conta"
                          : "Marcar como paga"
                      }
                    >
                      {bill.status === "paid" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        meta.className
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate font-medium text-foreground",
                          bill.status === "paid" && "line-through"
                        )}
                      >
                        {bill.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {billCategoryLabels[bill.category]} • vence dia{" "}
                        {bill.dueDay}
                      </p>
                    </div>
                    <p className="font-semibold text-expense">
                      {formatCurrency(bill.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => openEditBill(bill)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="soft-shadow flex items-center gap-3 rounded-2xl bg-card p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Movimentações</p>
            <p className="text-xs text-muted-foreground">
              {report.purchases.length}{" "}
              {report.purchases.length === 1 ? "lançamento" : "lançamentos"} no
              mês
            </p>
          </div>
          <p className="text-lg font-bold text-expense">
            {formatCurrency(report.shoppingTotal)}
          </p>
        </section>
      </div>

      <Dialog
        open={isBillOpen}
        onOpenChange={(open) => {
          setIsBillOpen(open);
          if (!open) resetBillForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBill ? "Editar conta" : "Nova conta"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveBill} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={billName}
                onChange={(event) => setBillName(event.target.value)}
                placeholder="Aluguel, luz, internet..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  inputMode="decimal"
                  value={billAmount}
                  onChange={(event) => setBillAmount(event.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Vence dia</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={billDueDay}
                  onChange={(event) => setBillDueDay(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={billCategory}
                onValueChange={(value) =>
                  setBillCategory(value as BillCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(billCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {editingBill && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={async () => {
                    const success = await deleteBill(editingBill.id);
                    toast[success ? "success" : "error"](
                      success ? "Conta excluída" : "Não foi possível excluir"
                    );
                    if (success) {
                      resetBillForm();
                      setIsBillOpen(false);
                    }
                  }}
                >
                  Excluir
                </Button>
              )}
              <Button type="submit" className="flex-1">
                {editingBill ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCardOpen} onOpenChange={setIsCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cartão</DialogTitle>
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

      <Dialog
        open={!!payingBill}
        onOpenChange={(open) => !open && setPayingBill(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar {payingBill?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {payingBill ? formatCurrency(payingBill.amount) : ""}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map(
                (method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={billPayMethod === method ? "default" : "outline"}
                    onClick={() => setBillPayMethod(method)}
                  >
                    {paymentMethodLabels[method]}
                  </Button>
                )
              )}
            </div>
            {billPayMethod === "credit" && creditCards.length > 0 && (
              <Select value={billCardId} onValueChange={setBillCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Cartao" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              className="w-full"
              onClick={async () => {
                if (!payingBill) return;
                const success = await payBill(
                  payingBill.id,
                  billPayMethod,
                  billPayMethod === "credit" ? billCardId : undefined
                );
                toast[success ? "success" : "error"](
                  success ? "Conta paga" : "Nao foi possivel pagar"
                );
                setPayingBill(null);
              }}
            >
              Confirmar pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingInvoice}
        onOpenChange={(open) => !open && setEditingInvoice(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Atualizar fatura {editingInvoice?.cardName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveInvoice} className="space-y-4">
            <div className="space-y-2">
              <Label>Valor atual da fatura</Label>
              <Input
                inputMode="decimal"
                value={invoiceAmount}
                onChange={(event) => setInvoiceAmount(event.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Va editando conforme o banco atualiza. Compras no credito tambem
                somam neste valor.
              </p>
            </div>
            <Button type="submit" className="w-full">
              Salvar valor
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
