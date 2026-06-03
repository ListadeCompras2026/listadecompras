export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface ShoppingItem {
  id: string
  name: string
  quantity: number
  unit: string
  checked: boolean
  category: string
  addedBy: string
  addedAt: Date
}

export interface ShoppingList {
  id: string
  name: string
  items: ShoppingItem[]
  createdBy: string
  sharedWith: string[]
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'completed'
}

export interface Purchase {
  id: string
  listId: string
  listName: string
  totalAmount: number
  paymentMethod: 'credit' | 'debit' | 'pix' | 'cash' | 'meal'
  store?: string
  completedAt: Date
  completedBy: string
  items: ShoppingItem[]
}

export type PaymentMethod = 'credit' | 'debit' | 'pix' | 'cash' | 'meal'

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  credit: 'Cartão de Crédito',
  debit: 'Cartão de Débito',
  pix: 'PIX',
  cash: 'Dinheiro',
  meal: 'Alimentação/Refeição',
}

export const categoryLabels: Record<string, string> = {
  fruits: 'Frutas e Verduras',
  dairy: 'Laticínios',
  meat: 'Carnes',
  bakery: 'Padaria',
  frozen: 'Congelados',
  beverages: 'Bebidas',
  cleaning: 'Limpeza',
  hygiene: 'Higiene',
  others: 'Outros',
}
