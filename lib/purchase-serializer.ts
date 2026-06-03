import type { PurchaseDocument } from '@/lib/models/purchase'
import type { Purchase } from '@/lib/types'

export function toPurchase(doc: PurchaseDocument): Purchase {
  return {
    id: String(doc._id),
    listId: doc.listId,
    listName: doc.listName,
    totalAmount: doc.totalAmount,
    paymentMethod: doc.paymentMethod,
    store: doc.store,
    completedAt: new Date(doc.completedAt),
    completedBy: doc.completedBy,
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
  }
}
