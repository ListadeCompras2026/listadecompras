"use client";

import { useState } from "react";
import { CreditCard, ListTodo, QrCode, Receipt, Wallet } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ShoppingListsView } from "./shopping-lists-view";
import { HistoryView } from "./history-view";
import { ReportsView } from "./reports-view";
import { ExpensesView } from "./expenses-view";
import { CardsView } from "./cards-view";
import { BottomNav } from "./bottom-nav";
import { PushNotificationPrompt } from "./push-notification-prompt";
import { SettingsView } from "./settings-view";
import { ExpenseDialog } from "./expense-dialog";
import { QuickReceiptDialog } from "./quick-receipt-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export type TabType =
  "lists" | "expenses" | "cards" | "history" | "reports" | "settings";
export type QuickAction = "bill" | "card" | "list" | "receipt" | null;

export function MainApp() {
  const [activeTab, setActiveTab] = useState<TabType>("expenses");
  const [quickAction, setQuickAction] = useState<QuickAction>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const currentUser = useAppStore((state) => state.currentUser);

  if (!currentUser) return null;

  const handleQuickAction = (
    action: Exclude<QuickAction, null> | "expense" | "receipt"
  ) => {
    setFabOpen(false);
    if (action === "expense") {
      setExpenseOpen(true);
      return;
    }
    if (action === "receipt") {
      setReceiptOpen(true);
      return;
    }
    if (action === "list") {
      setActiveTab("lists");
    } else if (action === "card") {
      setActiveTab("cards");
    } else {
      setActiveTab("expenses");
    }
    setQuickAction(action);
  };

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <PushNotificationPrompt />

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "var(--bottom-nav-height)" }}
      >
        {activeTab === "lists" && (
          <ShoppingListsView
            quickAction={quickAction}
            onQuickActionConsumed={() => setQuickAction(null)}
          />
        )}
        {activeTab === "expenses" && (
          <ExpensesView
            userName={currentUser.name}
            onOpenSettings={() => setActiveTab("settings")}
            onOpenCards={() => setActiveTab("cards")}
            onOpenHistory={() => setActiveTab("history")}
            quickAction={quickAction}
            onQuickActionConsumed={() => setQuickAction(null)}
          />
        )}
        {activeTab === "cards" && (
          <CardsView
            quickAction={quickAction}
            onQuickActionConsumed={() => setQuickAction(null)}
          />
        )}
        {activeTab === "history" && <HistoryView />}
        {activeTab === "reports" && (
          <ReportsView onBack={() => setActiveTab("settings")} />
        )}
        {activeTab === "settings" && (
          <SettingsView
            userName={currentUser.name}
            onOpenReports={() => setActiveTab("reports")}
            onOpenHistory={() => setActiveTab("history")}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFabClick={() => setFabOpen(true)}
      />

      <Drawer open={fabOpen} onOpenChange={setFabOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>O que você quer adicionar?</DrawerTitle>
          </DrawerHeader>
          <div className="grid grid-cols-2 gap-3 px-4 pb-8">
            <button
              type="button"
              onClick={() => handleQuickAction("receipt")}
              className="flex flex-col items-center gap-2 rounded-2xl bg-muted/70 px-3 py-4 text-sm font-medium text-foreground"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <QrCode className="h-5 w-5" />
              </span>
              Cupom QR
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("expense")}
              className="flex flex-col items-center gap-2 rounded-2xl bg-muted/70 px-3 py-4 text-sm font-medium text-foreground"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Receipt className="h-5 w-5" />
              </span>
              Despesa
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("bill")}
              className="flex flex-col items-center gap-2 rounded-2xl bg-muted/70 px-3 py-4 text-sm font-medium text-foreground"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Wallet className="h-5 w-5" />
              </span>
              Conta
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("card")}
              className="flex flex-col items-center gap-2 rounded-2xl bg-muted/70 px-3 py-4 text-sm font-medium text-foreground"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <CreditCard className="h-5 w-5" />
              </span>
              Cartão
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("list")}
              className="flex flex-col items-center gap-2 rounded-2xl bg-muted/70 px-3 py-4 text-sm font-medium text-foreground"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <ListTodo className="h-5 w-5" />
              </span>
              Lista
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <ExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onCreated={() => setActiveTab("history")}
      />
      <QuickReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        onCreated={() => setActiveTab("history")}
      />
    </div>
  );
}
