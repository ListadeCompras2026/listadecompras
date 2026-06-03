'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, ShoppingList, Purchase, ShoppingItem, PaymentMethod } from './types'

interface AppState {
  // Auth
  currentUser: User | null
  users: User[]
  isAuthenticated: boolean
  isAuthLoading: boolean
  
  // Shopping Lists
  shoppingLists: ShoppingList[]
  isListsLoading: boolean
  
  // Purchase History
  purchases: Purchase[]
  isPurchasesLoading: boolean
  
  // Actions - Auth
  initializeAuth: () => Promise<void>
  loadShoppingLists: () => Promise<void>
  loadPurchases: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (name: string, email: string, password: string) => Promise<boolean>
  
  // Actions - Shopping Lists
  createList: (name: string) => Promise<ShoppingList | null>
  deleteList: (listId: string) => Promise<boolean>
  addItemToList: (listId: string, item: Omit<ShoppingItem, 'id' | 'addedBy' | 'addedAt' | 'checked'>) => Promise<boolean>
  removeItemFromList: (listId: string, itemId: string) => Promise<boolean>
  toggleItemChecked: (listId: string, itemId: string) => Promise<boolean>
  updateItemQuantity: (listId: string, itemId: string, quantity: number) => Promise<boolean>
  shareList: (listId: string, userEmail: string) => Promise<boolean>
  
  // Actions - Purchases
  completePurchase: (listId: string, totalAmount: number, paymentMethod: PaymentMethod, store?: string) => Promise<boolean>
  
  // Getters
  getListById: (listId: string) => ShoppingList | undefined
  getMyLists: () => ShoppingList[]
  getSharedLists: () => ShoppingList[]
  getMonthlyReport: (year: number, month: number) => { total: number; byPaymentMethod: Record<PaymentMethod, number>; purchases: Purchase[] }
}

const demoUsers: User[] = [
  { id: '1', name: 'Você', email: 'voce@email.com' },
  { id: '2', name: 'Esposa', email: 'esposa@email.com' },
]

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

      loadShoppingLists: async () => {
        set({ isListsLoading: true })
        try {
          const response = await fetch('/api/shopping-lists', {
            method: 'GET',
            cache: 'no-store',
          })

          if (!response.ok) {
            set({ shoppingLists: [], isListsLoading: false })
            return
          }

          const data = await response.json()
          if (data?.ok && Array.isArray(data.lists)) {
            set({ shoppingLists: data.lists, isListsLoading: false })
            return
          }

          set({ shoppingLists: [], isListsLoading: false })
        } catch {
          set({ shoppingLists: [], isListsLoading: false })
        }
      },

      loadPurchases: async () => {
        set({ isPurchasesLoading: true })
        try {
          const response = await fetch('/api/purchases', {
            method: 'GET',
            cache: 'no-store',
          })

          if (!response.ok) {
            set({ purchases: [], isPurchasesLoading: false })
            return
          }

          const data = await response.json()
          if (data?.ok && Array.isArray(data.purchases)) {
            set({ purchases: data.purchases, isPurchasesLoading: false })
            return
          }

          set({ purchases: [], isPurchasesLoading: false })
        } catch {
          set({ purchases: [], isPurchasesLoading: false })
        }
      },

      initializeAuth: async () => {
        set({ isAuthLoading: true })
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            cache: 'no-store',
          })

          if (!response.ok) {
            set({ currentUser: null, isAuthenticated: false, isAuthLoading: false })
            return
          }

          const data = await response.json()
          if (data?.ok && data?.user) {
            await Promise.all([get().loadShoppingLists(), get().loadPurchases()])
            set({
              currentUser: data.user,
              isAuthenticated: true,
              isAuthLoading: false,
              users: get().users.some((u) => u.email === data.user.email)
                ? get().users
                : [...get().users, data.user],
            })
            return
          }

          set({ currentUser: null, isAuthenticated: false, isAuthLoading: false })
        } catch {
          set({ currentUser: null, isAuthenticated: false, isAuthLoading: false })
        }
      },

      login: async (email: string, password: string) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            set({ currentUser: null, isAuthenticated: false })
            return false
          }

          const data = await response.json()
          if (data?.ok && data?.user) {
            await Promise.all([get().loadShoppingLists(), get().loadPurchases()])
            set({
              currentUser: data.user,
              isAuthenticated: true,
              users: get().users.some((u) => u.email === data.user.email)
                ? get().users
                : [...get().users, data.user],
            })
            return true
          }

          set({ currentUser: null, isAuthenticated: false })
          return false
        } catch {
          set({ currentUser: null, isAuthenticated: false })
          return false
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
          })
        } finally {
          set({ currentUser: null, isAuthenticated: false, shoppingLists: [], purchases: [] })
        }
      },

      register: async (name: string, email: string, password: string) => {
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
          })

          if (!response.ok) {
            return false
          }

          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          if (!loginResponse.ok) {
            return false
          }

          const loginData = await loginResponse.json()
          if (loginData?.ok && loginData?.user) {
            await Promise.all([get().loadShoppingLists(), get().loadPurchases()])
            set({
              currentUser: loginData.user,
              isAuthenticated: true,
              users: get().users.some((u) => u.email === loginData.user.email)
                ? get().users
                : [...get().users, loginData.user],
            })
            return true
          }

          return false
        } catch {
          return false
        }
      },

      createList: async (name: string) => {
        try {
          const response = await fetch('/api/shopping-lists', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
          })

          if (!response.ok) {
            return null
          }

          const data = await response.json()
          if (data?.ok && data?.list) {
            set((state) => ({ shoppingLists: [data.list, ...state.shoppingLists] }))
            return data.list as ShoppingList
          }

          return null
        } catch {
          return null
        }
      },

      deleteList: async (listId: string) => {
        try {
          const response = await fetch(`/api/shopping-lists/${listId}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            return false
          }

          set((state) => ({ shoppingLists: state.shoppingLists.filter((l) => l.id !== listId) }))
          return true
        } catch {
          return false
        }
      },

      addItemToList: async (listId: string, item) => {
        try {
          const response = await fetch(`/api/shopping-lists/${listId}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
          })

          if (!response.ok) {
            return false
          }

          const data = await response.json()
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: state.shoppingLists.map((list) =>
                list.id === listId ? data.list : list
              ),
            }))
            return true
          }

          return false
        } catch {
          return false
        }
      },

      removeItemFromList: async (listId: string, itemId: string) => {
        try {
          const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            return false
          }

          const data = await response.json()
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: state.shoppingLists.map((list) =>
                list.id === listId ? data.list : list
              ),
            }))
            return true
          }

          return false
        } catch {
          return false
        }
      },

      toggleItemChecked: async (listId: string, itemId: string) => {
        const list = get().shoppingLists.find((entry) => entry.id === listId)
        const item = list?.items.find((entry) => entry.id === itemId)

        if (!item) {
          return false
        }

        try {
          const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ checked: !item.checked }),
          })

          if (!response.ok) {
            return false
          }

          const data = await response.json()
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: state.shoppingLists.map((entry) =>
                entry.id === listId ? data.list : entry
              ),
            }))
            return true
          }

          return false
        } catch {
          return false
        }
      },

      updateItemQuantity: async (listId: string, itemId: string, quantity: number) => {
        try {
          const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity }),
          })

          if (!response.ok) {
            return false
          }

          const data = await response.json()
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: state.shoppingLists.map((list) =>
                list.id === listId ? data.list : list
              ),
            }))
            return true
          }

          return false
        } catch {
          return false
        }
      },

      shareList: async (listId: string, userEmail: string) => {
        try {
          const response = await fetch(`/api/shopping-lists/${listId}/share`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: userEmail }),
          })

          if (!response.ok) {
            return false
          }

          const data = await response.json()
          if (data?.ok && data?.list) {
            set((state) => ({
              shoppingLists: state.shoppingLists.map((list) =>
                list.id === listId ? data.list : list
              ),
            }))
            return true
          }

          return false
        } catch {
          return false
        }
      },

      completePurchase: async (listId: string, totalAmount: number, paymentMethod: PaymentMethod, store?: string) => {
        try {
          const response = await fetch('/api/purchases', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              listId,
              totalAmount,
              paymentMethod,
              store,
            }),
          })

          if (!response.ok) {
            return false
          }

          const data = await response.json()
          if (data?.ok && data?.purchase) {
            set((state) => ({
              purchases: [data.purchase, ...state.purchases],
              shoppingLists: state.shoppingLists.map((list) =>
                list.id === listId ? (data.list ?? { ...list, status: 'completed' as const }) : list
              ),
            }))
            return true
          }

          return false
        } catch {
          return false
        }
      },

      getListById: (listId: string) => {
        return get().shoppingLists.find(l => l.id === listId)
      },

      getMyLists: () => {
        const { shoppingLists } = get()
        return shoppingLists.filter((l) => l.status === 'active')
      },

      getSharedLists: () => {
        return []
      },

      getMonthlyReport: (year: number, month: number) => {
        const { purchases } = get()
        const monthPurchases = purchases.filter(p => {
          const date = new Date(p.completedAt)
          return date.getFullYear() === year && date.getMonth() === month
        })
        
        const total = monthPurchases.reduce((sum, p) => sum + p.totalAmount, 0)
        const byPaymentMethod = monthPurchases.reduce((acc, p) => {
          acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.totalAmount
          return acc
        }, {} as Record<PaymentMethod, number>)
        
        return { total, byPaymentMethod, purchases: monthPurchases }
      },
    }),
    {
      name: 'shopping-list-storage',
      partialize: () => ({}),
    }
  )
)
