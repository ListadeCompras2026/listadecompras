"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  ShoppingList,
  Purchase,
  ShoppingItem,
  PaymentMethod,
  Bill,
  BillCategory,
  CreditCard,
  CardInvoice,
  ParsedReceipt,
  ReceiptMatch,
  TransactionCategory,
  BankAccount,
  MealCard,
} from "./types";
import { matchReceiptToList } from "@/lib/nfce/match-items";
import { getPeriod } from "@/lib/period";

interface CompletePurchaseInput {
  listId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  store?: string;
  cardId?: string;
  mealCardId?: string;
  receiptKey?: string;
  receiptUrl?: string;
  completeList?: boolean;
  items?: Array<{
    listItemId?: string;
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    unitPrice?: number;
    totalPrice?: number;
  }>;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  shoppingLists: ShoppingList[];
  isListsLoading: boolean;

  purchases: Purchase[];
  isPurchasesLoading: boolean;

  bills: Bill[];
  creditCards: CreditCard[];
  mealCards: MealCard[];
  invoices: CardInvoice[];
  bankAccount: BankAccount | null;
  selectedYear: number;
  selectedMonth: number;
  isExpensesLoading: boolean;

  initializeAuth: () => Promise<void>;
  loadShoppingLists: () => Promise<void>;
  loadPurchases: () => Promise<void>;
  loadExpenses: (year?: number, month?: number) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;

  createList: (name: string) => Promise<ShoppingList | null>;
  deleteList: (listId: string) => Promise<boolean>;
  addItemToList: (
    listId: string,
    item: Omit<ShoppingItem, "id" | "addedBy" | "addedAt" | "checked">
  ) => Promise<boolean>;
  removeItemFromList: (listId: string, itemId: string) => Promise<boolean>;
  toggleItemChecked: (listId: string, itemId: string) => Promise<boolean>;
  updateItemQuantity: (
    listId: string,
    itemId: string,
    quantity: number
  ) => Promise<boolean>;
  shareList: (listId: string, userEmail: string) => Promise<boolean>;

  parseReceipt: (qrContent: string) => Promise<ParsedReceipt | null>;
  previewReceiptMatches: (
    listId: string,
    receipt: ParsedReceipt
  ) => ReceiptMatch[];
  completePurchase: (input: CompletePurchaseInput) => Promise<boolean>;
  createExpense: (input: {
    name: string;
    amount: number;
    paymentMethod: PaymentMethod;
    category: TransactionCategory;
    store?: string;
    cardId?: string;
    mealCardId?: string;
    completedAt?: string;
    receiptKey?: string;
    receiptUrl?: string;
    items?: Array<{
      name: string;
      quantity: number;
      unit: string;
      category?: string;
      unitPrice?: number;
      totalPrice?: number;
    }>;
  }) => Promise<boolean>;

  createBill: (input: {
    name: string;
    amount: number;
    dueDay: number;
    category: BillCategory;
    recurrence?: "monthly" | "once";
    notes?: string;
  }) => Promise<Bill | null>;
  updateBill: (
    billId: string,
    data: Partial<
      Pick<Bill, "name" | "amount" | "dueDay" | "category" | "notes">
    >
  ) => Promise<boolean>;
  payBill: (
    billId: string,
    paymentMethod: PaymentMethod,
    cardId?: string,
    mealCardId?: string
  ) => Promise<boolean>;
  reopenBill: (billId: string) => Promise<boolean>;
  deleteBill: (billId: string) => Promise<boolean>;

  createCreditCard: (input: {
    name: string;
    lastDigits?: string;
    closingDay: number;
    dueDay: number;
    creditLimit?: number;
  }) => Promise<CreditCard | null>;
  updateCreditCard: (
    cardId: string,
    data: Partial<
      Pick<
        CreditCard,
        "name" | "lastDigits" | "closingDay" | "dueDay" | "creditLimit"
      >
    >
  ) => Promise<boolean>;
  shareCreditCard: (cardId: string, email: string) => Promise<boolean>;
  unshareCreditCard: (cardId: string, userId: string) => Promise<boolean>;
  deleteCreditCard: (cardId: string) => Promise<boolean>;
  createMealCard: (input: {
    name: string;
    lastDigits?: string;
    balance?: number;
  }) => Promise<MealCard | null>;
  rechargeMealCard: (cardId: string, amount: number) => Promise<boolean>;
  deleteMealCard: (cardId: string) => Promise<boolean>;
  updateInvoiceAmount: (invoiceId: string, amount: number) => Promise<boolean>;
  payInvoice: (
    invoiceId: string,
    paymentMethod?: PaymentMethod
  ) => Promise<boolean>;
  reopenInvoice: (invoiceId: string) => Promise<boolean>;
  setBankBalance: (balance: number) => Promise<boolean>;
  addBankIncome: (amount: number) => Promise<boolean>;

  getListById: (listId: string) => ShoppingList | undefined;
  getMyLists: () => ShoppingList[];
  getSharedLists: () => ShoppingList[];
  getMonthlyReport: (
    year: number,
    month: number
  ) => {
    total: number;
    byPaymentMethod: Record<PaymentMethod, number>;
    purchases: Purchase[];
    billsTotal: number;
    invoicesTotal: number;
    shoppingTotal: number;
  };
}

const demoUsers: User[] = [
  { id: "1", name: "Você", email: "voce@email.com" },
  { id: "2", name: "Esposa", email: "esposa@email.com" },
];

const current = getPeriod();

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: demoUsers,
      isAuthenticated: false,
      isAuthLoading: false,
      shoppingLists: [],
      isListsLoading: false,
      purchases: [],
      isPurchasesLoading: false,
      bills: [],
      creditCards: [],
      mealCards: [],
      invoices: [],
      bankAccount: null,
      selectedYear: current.year,
      selectedMonth: current.month,
      isExpensesLoading: false,

      loadShoppingLists: async () => {
        set({ isListsLoading: true });
        try {
          const response = await fetch("/api/shopping-lists", {
            method: "GET",
            cache: "no-store",
          });
          const data = await parseJson(response);
          set({
            shoppingLists:
              data?.ok && Array.isArray(data.lists) ? data.lists : [],
            isListsLoading: false,
          });
        } catch {
          set({ shoppingLists: [], isListsLoading: false });
        }
      },

      loadPurchases: async () => {
        set({ isPurchasesLoading: true });
        try {
          const response = await fetch("/api/purchases", {
            method: "GET",
            cache: "no-store",
          });
          const data = await parseJson(response);
          set({
            purchases:
              data?.ok && Array.isArray(data.purchases) ? data.purchases : [],
            isPurchasesLoading: false,
          });
        } catch {
          set({ purchases: [], isPurchasesLoading: false });
        }
      },

      loadExpenses: async (year, month) => {
        const period = {
          year: year ?? get().selectedYear,
          month: month ?? get().selectedMonth,
        };
        set({
          isExpensesLoading: true,
          selectedYear: period.year,
          selectedMonth: period.month,
        });
        try {
          const query = `year=${period.year}&month=${period.month}`;
          const [billsRes, cardsRes, invoicesRes, bankRes, mealRes] =
            await Promise.all([
              fetch(`/api/bills?${query}`, { cache: "no-store" }),
              fetch("/api/credit-cards", { cache: "no-store" }),
              fetch(`/api/invoices?${query}`, { cache: "no-store" }),
              fetch("/api/bank-account", { cache: "no-store" }),
              fetch("/api/meal-cards", { cache: "no-store" }),
            ]);
          const [billsData, cardsData, invoicesData, bankData, mealData] =
            await Promise.all([
              parseJson(billsRes),
              parseJson(cardsRes),
              parseJson(invoicesRes),
              parseJson(bankRes),
              parseJson(mealRes),
            ]);
          set({
            bills:
              billsData?.ok && Array.isArray(billsData.bills)
                ? billsData.bills
                : [],
            creditCards:
              cardsData?.ok && Array.isArray(cardsData.cards)
                ? cardsData.cards
                : [],
            mealCards:
              mealData?.ok && Array.isArray(mealData.cards)
                ? mealData.cards
                : [],
            invoices:
              invoicesData?.ok && Array.isArray(invoicesData.invoices)
                ? invoicesData.invoices
                : [],
            bankAccount:
              bankData?.ok && bankData.account ? bankData.account : null,
            isExpensesLoading: false,
          });
        } catch {
          set({
            bills: [],
            creditCards: [],
            mealCards: [],
            invoices: [],
            bankAccount: null,
            isExpensesLoading: false,
          });
        }
      },

      initializeAuth: async () => {
        set({ isAuthLoading: true });
        try {
          const response = await fetch("/api/auth/me", {
            method: "GET",
            cache: "no-store",
          });
          if (!response.ok) {
            set({
              currentUser: null,
              isAuthenticated: false,
              isAuthLoading: false,
            });
            return;
          }

          const data = await parseJson(response);
          if (data?.ok && data?.user) {
            await Promise.all([
              get().loadShoppingLists(),
              get().loadPurchases(),
              get().loadExpenses(),
            ]);
            set({
              currentUser: data.user,
              isAuthenticated: true,
              isAuthLoading: false,
              users: get().users.some((user) => user.email === data.user.email)
                ? get().users
                : [...get().users, data.user],
            });
            return;
          }

          set({
            currentUser: null,
            isAuthenticated: false,
            isAuthLoading: false,
          });
        } catch {
          set({
            currentUser: null,
            isAuthenticated: false,
            isAuthLoading: false,
          });
        }
      },

      login: async (email, password) => {
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.user) {
            await Promise.all([
              get().loadShoppingLists(),
              get().loadPurchases(),
              get().loadExpenses(),
            ]);
            set({
              currentUser: data.user,
              isAuthenticated: true,
              users: get().users.some((user) => user.email === data.user.email)
                ? get().users
                : [...get().users, data.user],
            });
            return true;
          }
          set({ currentUser: null, isAuthenticated: false });
          return false;
        } catch {
          set({ currentUser: null, isAuthenticated: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          set({
            currentUser: null,
            isAuthenticated: false,
            shoppingLists: [],
            purchases: [],
            bills: [],
            creditCards: [],
            mealCards: [],
            invoices: [],
            bankAccount: null,
          });
        }
      },

      register: async (name, email, password) => {
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          if (!response.ok) return false;
          return get().login(email, password);
        } catch {
          return false;
        }
      },

      createList: async (name) => {
        try {
          const response = await fetch("/api/shopping-lists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: [data.list, ...state.shoppingLists],
            }));
            return data.list as ShoppingList;
          }
          return null;
        } catch {
          return null;
        }
      },

      deleteList: async (listId) => {
        try {
          const response = await fetch(`/api/shopping-lists/${listId}`, {
            method: "DELETE",
          });
          if (!response.ok) return false;
          set((state) => ({
            shoppingLists: state.shoppingLists.filter(
              (list) => list.id !== listId
            ),
          }));
          return true;
        } catch {
          return false;
        }
      },

      addItemToList: async (listId, item) => {
        try {
          const response = await fetch(`/api/shopping-lists/${listId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: state.shoppingLists.map((list) =>
                list.id === listId ? data.list : list
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      removeItemFromList: async (listId, itemId) => {
        try {
          const response = await fetch(
            `/api/shopping-lists/${listId}/items/${itemId}`,
            { method: "DELETE" }
          );
          const data = await parseJson(response);
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: state.shoppingLists.map((list) =>
                list.id === listId ? data.list : list
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      toggleItemChecked: async (listId, itemId) => {
        const list = get().shoppingLists.find((entry) => entry.id === listId);
        const item = list?.items.find((entry) => entry.id === itemId);
        if (!item) return false;

        try {
          const response = await fetch(
            `/api/shopping-lists/${listId}/items/${itemId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ checked: !item.checked }),
            }
          );
          const data = await parseJson(response);
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: state.shoppingLists.map((entry) =>
                entry.id === listId ? data.list : entry
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      updateItemQuantity: async (listId, itemId, quantity) => {
        try {
          const response = await fetch(
            `/api/shopping-lists/${listId}/items/${itemId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quantity }),
            }
          );
          const data = await parseJson(response);
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: state.shoppingLists.map((list) =>
                list.id === listId ? data.list : list
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      shareList: async (listId, userEmail) => {
        try {
          const response = await fetch(`/api/shopping-lists/${listId}/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: state.shoppingLists.map((list) =>
                list.id === listId ? data.list : list
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      parseReceipt: async (qrContent) => {
        const response = await fetch("/api/receipts/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrContent }),
        });
        const data = await parseJson(response);
        if (data?.ok && data?.receipt) {
          return data.receipt as ParsedReceipt;
        }
        throw new Error(data?.error || "Nao foi possivel ler o cupom");
      },

      previewReceiptMatches: (listId, receipt) => {
        const list = get().shoppingLists.find((entry) => entry.id === listId);
        if (!list) return [];
        return matchReceiptToList(list.items, receipt.items);
      },

      completePurchase: async (input) => {
        try {
          const response = await fetch("/api/purchases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.purchase) {
            set((state) => ({
              purchases: [data.purchase, ...state.purchases],
              shoppingLists: state.shoppingLists.map((list) =>
                list.id === input.listId
                  ? (data.list ?? { ...list, status: "completed" as const })
                  : list
              ),
              invoices: data.invoice
                ? state.invoices.some(
                    (invoice) => invoice.id === data.invoice.id
                  )
                  ? state.invoices.map((invoice) =>
                      invoice.id === data.invoice.id ? data.invoice : invoice
                    )
                  : [data.invoice, ...state.invoices]
                : state.invoices,
              bankAccount: data.bankAccount ?? state.bankAccount,
              mealCards: data.mealCard
                ? state.mealCards.some((card) => card.id === data.mealCard.id)
                  ? state.mealCards.map((card) =>
                      card.id === data.mealCard.id ? data.mealCard : card
                    )
                  : [...state.mealCards, data.mealCard]
                : state.mealCards,
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      createExpense: async (input) => {
        try {
          const response = await fetch("/api/purchases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: input.name,
              totalAmount: input.amount,
              paymentMethod: input.paymentMethod,
              category: input.category,
              store: input.store,
              cardId: input.cardId,
              mealCardId: input.mealCardId,
              completedAt: input.completedAt,
              receiptKey: input.receiptKey,
              receiptUrl: input.receiptUrl,
              items: input.items,
              source: "standalone",
            }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.purchase) {
            set((state) => ({
              purchases: [data.purchase, ...state.purchases],
              invoices: data.invoice
                ? state.invoices.some(
                    (invoice) => invoice.id === data.invoice.id
                  )
                  ? state.invoices.map((invoice) =>
                      invoice.id === data.invoice.id ? data.invoice : invoice
                    )
                  : [data.invoice, ...state.invoices]
                : state.invoices,
              bankAccount: data.bankAccount ?? state.bankAccount,
              mealCards: data.mealCard
                ? state.mealCards.some((card) => card.id === data.mealCard.id)
                  ? state.mealCards.map((card) =>
                      card.id === data.mealCard.id ? data.mealCard : card
                    )
                  : [...state.mealCards, data.mealCard]
                : state.mealCards,
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      createBill: async (input) => {
        try {
          const response = await fetch("/api/bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...input,
              year: get().selectedYear,
              month: get().selectedMonth,
            }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.bill) {
            set((state) => ({
              bills: [...state.bills, data.bill].sort(
                (a, b) => a.dueDay - b.dueDay
              ),
            }));
            return data.bill as Bill;
          }
          return null;
        } catch {
          return null;
        }
      },

      updateBill: async (billId, payload) => {
        try {
          const response = await fetch(`/api/bills/${billId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.bill) {
            set((state) => ({
              bills: state.bills.map((bill) =>
                bill.id === billId ? data.bill : bill
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      payBill: async (billId, paymentMethod, cardId, mealCardId) => {
        try {
          const response = await fetch(`/api/bills/${billId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "paid",
              paymentMethod,
              cardId,
              mealCardId,
            }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.bill) {
            set((state) => ({
              bills: state.bills.map((bill) =>
                bill.id === billId ? data.bill : bill
              ),
              bankAccount: data.bankAccount ?? state.bankAccount,
              mealCards: data.mealCard
                ? state.mealCards.map((card) =>
                    card.id === data.mealCard.id ? data.mealCard : card
                  )
                : state.mealCards,
            }));
            if (paymentMethod === "credit") {
              await get().loadExpenses();
            }
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      reopenBill: async (billId) => {
        try {
          const response = await fetch(`/api/bills/${billId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "pending" }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.bill) {
            set((state) => ({
              bills: state.bills.map((bill) =>
                bill.id === billId ? data.bill : bill
              ),
              bankAccount: data.bankAccount ?? state.bankAccount,
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      deleteBill: async (billId) => {
        try {
          const response = await fetch(`/api/bills/${billId}`, {
            method: "DELETE",
          });
          if (!response.ok) return false;
          set((state) => ({
            bills: state.bills.filter((bill) => bill.id !== billId),
          }));
          return true;
        } catch {
          return false;
        }
      },

      createCreditCard: async (input) => {
        try {
          const response = await fetch("/api/credit-cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.card) {
            set((state) => ({
              creditCards: [...state.creditCards, data.card],
              invoices: data.invoice
                ? [...state.invoices, data.invoice]
                : state.invoices,
            }));
            return data.card as CreditCard;
          }
          return null;
        } catch {
          return null;
        }
      },

      updateCreditCard: async (cardId, payload) => {
        try {
          const response = await fetch(`/api/credit-cards/${cardId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.card) {
            set((state) => ({
              creditCards: state.creditCards.map((card) =>
                card.id === cardId ? data.card : card
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      createMealCard: async (input) => {
        try {
          const response = await fetch("/api/meal-cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.card) {
            set((state) => ({
              mealCards: [...state.mealCards, data.card],
            }));
            return data.card as MealCard;
          }
          return null;
        } catch {
          return null;
        }
      },

      rechargeMealCard: async (cardId, amount) => {
        try {
          const response = await fetch(`/api/meal-cards/${cardId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recharge: amount }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.card) {
            set((state) => ({
              mealCards: state.mealCards.map((card) =>
                card.id === cardId ? data.card : card
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      deleteMealCard: async (cardId) => {
        try {
          const response = await fetch(`/api/meal-cards/${cardId}`, {
            method: "DELETE",
          });
          if (!response.ok) return false;
          set((state) => ({
            mealCards: state.mealCards.filter((card) => card.id !== cardId),
          }));
          return true;
        } catch {
          return false;
        }
      },

      shareCreditCard: async (cardId, email) => {
        try {
          const response = await fetch(`/api/credit-cards/${cardId}/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.card) {
            set((state) => ({
              creditCards: state.creditCards.map((card) =>
                card.id === cardId ? data.card : card
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      unshareCreditCard: async (cardId, userId) => {
        try {
          const response = await fetch(
            `/api/credit-cards/${cardId}/share?userId=${encodeURIComponent(userId)}`,
            { method: "DELETE" }
          );
          const data = await parseJson(response);
          if (data?.ok && data?.card) {
            set((state) => ({
              creditCards: state.creditCards.map((card) =>
                card.id === cardId ? data.card : card
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      deleteCreditCard: async (cardId) => {
        try {
          const response = await fetch(`/api/credit-cards/${cardId}`, {
            method: "DELETE",
          });
          if (!response.ok) return false;
          set((state) => ({
            creditCards: state.creditCards.filter((card) => card.id !== cardId),
            invoices: state.invoices.filter(
              (invoice) => invoice.cardId !== cardId
            ),
          }));
          return true;
        } catch {
          return false;
        }
      },

      updateInvoiceAmount: async (invoiceId, amount) => {
        try {
          const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.invoice) {
            set((state) => ({
              invoices: state.invoices.map((invoice) =>
                invoice.id === invoiceId ? data.invoice : invoice
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      payInvoice: async (invoiceId, paymentMethod) => {
        try {
          const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "paid",
              paymentMethod,
            }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.invoice) {
            set((state) => ({
              invoices: state.invoices.map((invoice) =>
                invoice.id === invoiceId ? data.invoice : invoice
              ),
              bankAccount: data.bankAccount ?? state.bankAccount,
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      reopenInvoice: async (invoiceId) => {
        try {
          const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "open" }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.invoice) {
            set((state) => ({
              invoices: state.invoices.map((invoice) =>
                invoice.id === invoiceId ? data.invoice : invoice
              ),
              bankAccount: data.bankAccount ?? state.bankAccount,
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      setBankBalance: async (balance) => {
        try {
          const response = await fetch("/api/bank-account", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ balance }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.account) {
            set({ bankAccount: data.account });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      addBankIncome: async (amount) => {
        try {
          const response = await fetch("/api/bank-account", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ income: amount }),
          });
          const data = await parseJson(response);
          if (data?.ok && data?.account) {
            set({ bankAccount: data.account });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      getListById: (listId) =>
        get().shoppingLists.find((list) => list.id === listId),

      getMyLists: () =>
        get().shoppingLists.filter((list) => list.status === "active"),

      getSharedLists: () => [],

      getMonthlyReport: (year, month) => {
        const { purchases, bills, invoices } = get();
        const monthPurchases = purchases.filter((purchase) => {
          const date = new Date(purchase.completedAt);
          return date.getFullYear() === year && date.getMonth() === month;
        });
        const shoppingTotal = monthPurchases.reduce(
          (sum, purchase) => sum + purchase.totalAmount,
          0
        );
        const billsTotal = bills
          .filter(
            (bill) =>
              bill.year === year &&
              bill.month === month &&
              bill.paymentMethod !== "credit"
          )
          .reduce((sum, bill) => sum + bill.amount, 0);
        const invoicesTotal = invoices
          .filter((invoice) => invoice.year === year && invoice.month === month)
          .reduce((sum, invoice) => sum + invoice.amount, 0);
        const creditPurchaseTotal = monthPurchases
          .filter((purchase) => purchase.paymentMethod === "credit")
          .reduce((sum, purchase) => sum + purchase.totalAmount, 0);

        const byPaymentMethod = monthPurchases.reduce(
          (acc, purchase) => {
            acc[purchase.paymentMethod] =
              (acc[purchase.paymentMethod] || 0) + purchase.totalAmount;
            return acc;
          },
          {} as Record<PaymentMethod, number>
        );

        return {
          total:
            shoppingTotal + billsTotal + invoicesTotal - creditPurchaseTotal,
          byPaymentMethod,
          purchases: monthPurchases,
          billsTotal,
          invoicesTotal,
          shoppingTotal,
        };
      },
    }),
    {
      name: "shopping-list-storage",
      partialize: () => ({}),
    }
  )
);
