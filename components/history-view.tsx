'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Receipt, CreditCard, Banknote, Smartphone, 
  Calendar, Store, ShoppingBag, UtensilsCrossed 
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PaymentMethod, Purchase } from '@/lib/types'
import { paymentMethodLabels } from '@/lib/types'

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  credit: <CreditCard className="w-4 h-4" />,
  debit: <CreditCard className="w-4 h-4" />,
  pix: <Smartphone className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  meal: <UtensilsCrossed className="w-4 h-4" />,
}

interface HistoryViewProps {
  focusListId?: string | null
  onFocusConsumed?: () => void
}

export function HistoryView({ focusListId, onFocusConsumed }: HistoryViewProps) {
  const purchases = useAppStore((state) => state.purchases)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  
  // Sort by date descending
  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const focusedPurchase = useMemo(() => {
    if (!focusListId) return null
    return sortedPurchases.find((purchase) => purchase.listId === focusListId) ?? null
  }, [focusListId, sortedPurchases])

  useEffect(() => {
    if (!focusListId) return
    if (focusedPurchase) {
      setSelectedPurchase(focusedPurchase)
    }
    onFocusConsumed?.()
  }, [focusListId, focusedPurchase, onFocusConsumed])

  if (sortedPurchases.length === 0) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-1">Nenhuma compra realizada</h2>
          <p className="text-sm text-muted-foreground">
            Suas compras finalizadas aparecerão aqui
          </p>
        </div>
      </div>
    )
  }

  // Group by month
  const groupedByMonth = sortedPurchases.reduce((acc, purchase) => {
    const monthKey = format(new Date(purchase.completedAt), 'MMMM yyyy', { locale: ptBR })
    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey].push(purchase)
    return acc
  }, {} as Record<string, typeof sortedPurchases>)

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Histórico de Compras</h1>
      
      {Object.entries(groupedByMonth).map(([month, monthPurchases]) => {
        const monthTotal = monthPurchases.reduce((sum, p) => sum + p.totalAmount, 0)
        
        return (
          <section key={month} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground capitalize">{month}</h2>
              <span className="text-sm font-semibold text-foreground">{formatCurrency(monthTotal)}</span>
            </div>
            
            <div className="space-y-2">
              {monthPurchases.map((purchase) => (
                <Card key={purchase.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedPurchase(purchase)}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{purchase.listName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(purchase.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(purchase.totalAmount)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {paymentIcons[purchase.paymentMethod]}
                        <span>{paymentMethodLabels[purchase.paymentMethod]}</span>
                      </div>
                      {purchase.store && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Store className="w-4 h-4" />
                          <span>{purchase.store}</span>
                        </div>
                      )}
                    </div>
                    
                    {purchase.items.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">
                          {purchase.items.length} {purchase.items.length === 1 ? 'item' : 'itens'}:
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {purchase.items.map(i => i.name).join(', ')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )
      })}

      <Dialog open={!!selectedPurchase} onOpenChange={(open) => !open && setSelectedPurchase(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPurchase?.listName}</DialogTitle>
            <DialogDescription>
              Resumo da compra finalizada com itens e totais.
            </DialogDescription>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Valor total</p>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(selectedPurchase.totalAmount)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Itens comprados</p>
                  <p className="text-sm font-semibold text-foreground">{selectedPurchase.items.length}</p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(selectedPurchase.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {paymentIcons[selectedPurchase.paymentMethod]}
                  <span>{paymentMethodLabels[selectedPurchase.paymentMethod]}</span>
                </div>
                {selectedPurchase.store && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Store className="w-4 h-4" />
                    <span>{selectedPurchase.store}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Itens comprados</h3>
                <div className="max-h-64 overflow-auto space-y-2 pr-1">
                  {selectedPurchase.items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
