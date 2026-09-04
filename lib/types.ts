export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  category: string;
  addedBy: string;
  addedAt: Date;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdBy: string;
  sharedWith: string[];
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "completed";
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export type PurchaseSource = "list" | "standalone";

export type TransactionCategory =
  BillCategory | "food" | "leisure" | "shopping";

export const transactionCategoryLabels: Record<TransactionCategory, string> = {
  food: "Alimentação",
  leisure: "Lazer",
  shopping: "Compras",
  housing: "Moradia",
  utilities: "Contas da casa",
  transport: "Transporte",
  health: "Saúde",
  education: "Educação",
  subscriptions: "Assinaturas",
  insurance: "Seguros",
  taxes: "Impostos",
  others: "Outros",
};

export const transactionCategoryOrder: TransactionCategory[] = [
  "food",
  "shopping",
  "transport",
  "leisure",
  "health",
  "housing",
  "utilities",
  "education",
  "subscriptions",
  "insurance",
  "taxes",
  "others",
];

export interface Purchase {
  id: string;
  listId: string;
  listName: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  store?: string;
  completedAt: Date;
  completedBy: string;
  completedByName?: string;
  items: ShoppingItem[];
  receiptKey?: string;
  receiptUrl?: string;
  cardId?: string;
  source: PurchaseSource;
  category?: TransactionCategory;
}

export type PaymentMethod = "credit" | "debit" | "pix" | "cash" | "meal";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  pix: "PIX",
  cash: "Dinheiro",
  meal: "Alimentação/Refeição",
};

export const categoryLabels: Record<string, string> = {
  fruits: "Frutas e Verduras",
  dairy: "Laticínios",
  meat: "Carnes",
  bakery: "Padaria",
  frozen: "Congelados",
  beverages: "Bebidas",
  cleaning: "Limpeza",
  hygiene: "Higiene",
  others: "Outros",
};

export type BillCategory =
  | "housing"
  | "utilities"
  | "transport"
  | "health"
  | "education"
  | "subscriptions"
  | "insurance"
  | "taxes"
  | "others";

export const billCategoryLabels: Record<BillCategory, string> = {
  housing: "Moradia",
  utilities: "Contas da casa",
  transport: "Transporte",
  health: "Saúde",
  education: "Educação",
  subscriptions: "Assinaturas",
  insurance: "Seguros",
  taxes: "Impostos",
  others: "Outros",
};

export type BillStatus = "pending" | "paid";

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: BillCategory;
  status: BillStatus;
  recurrence: "monthly" | "once";
  year: number;
  month: number;
  paidAt?: Date;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditCardMember {
  id: string;
  name: string;
}

export interface CreditCard {
  id: string;
  name: string;
  lastDigits?: string;
  closingDay: number;
  dueDay: number;
  createdBy: string;
  sharedWith: string[];
  members: CreditCardMember[];
  isOwner: boolean;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = "open" | "paid";

export interface CardInvoice {
  id: string;
  cardId: string;
  cardName: string;
  year: number;
  month: number;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankAccount {
  id: string;
  balance: number;
  configured: boolean;
  updatedAt: Date;
}

export interface ParsedReceipt {
  store?: string;
  issuedAt?: string;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  items: ReceiptItem[];
  accessKey?: string;
  sourceUrl?: string;
}

export interface ReceiptMatch {
  receiptIndex: number;
  receiptItem: ReceiptItem;
  listItemId?: string;
  listItemName?: string;
  confidence: number;
}

export const APP_NAME = "Despesas";
export const APP_TAGLINE = "Listas, cupom e contas do mês";
