import type { ShoppingListDocument } from '@/lib/models/shopping-list'
import type { ShoppingList } from '@/lib/types'

export function toShoppingList(doc: ShoppingListDocument): ShoppingList {
  return {
    id: String(doc._id),
    name: doc.name,
    items: doc.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      checked: item.checked,
      category: item.category,
      addedBy: item.addedBy,
      addedAt: new Date(item.addedAt),
    })),
    createdBy: doc.createdBy,
    sharedWith: doc.sharedWith,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
    status: doc.status,
  }
}
