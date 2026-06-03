'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, Plus, ShoppingCart, Trash2, 
  CreditCard, Banknote, Smartphone, Wallet, UtensilsCrossed
} from 'lucide-react'
import { toast } from 'sonner'
import type { ShoppingList, PaymentMethod } from '@/lib/types'
import { categoryLabels, paymentMethodLabels } from '@/lib/types'

interface ShoppingListDetailProps {
  list: ShoppingList
  onBack: () => void
}

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  credit: <CreditCard className="w-4 h-4" />,
  debit: <CreditCard className="w-4 h-4" />,
  pix: <Smartphone className="w-4 h-4" />,
  cash: <Banknote className="w-4 h-4" />,
  meal: <UtensilsCrossed className="w-4 h-4" />,
}

export function ShoppingListDetail({ list, onBack }: ShoppingListDetailProps) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  
  // Add item form
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState('1')
  const [itemUnit, setItemUnit] = useState('un')
  const [itemCategory, setItemCategory] = useState('others')
  
  // Checkout form
  const [totalAmount, setTotalAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [storeName, setStoreName] = useState('')

  const { 
    addItemToList, 
    removeItemFromList, 
    toggleItemChecked, 
    completePurchase 
  } = useAppStore()

  const checkedCount = list.items.filter(i => i.checked).length
  const progress = list.items.length > 0 ? (checkedCount / list.items.length) * 100 : 0

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim()) {
      toast.error('Digite o nome do item')
      return
    }
    
    const success = await addItemToList(list.id, {
      name: itemName.trim(),
      quantity: parseInt(itemQuantity) || 1,
      unit: itemUnit,
      category: itemCategory,
    })

    if (!success) {
      toast.error('Não foi possível adicionar o item')
      return
    }
    
    setItemName('')
    setItemQuantity('1')
    setIsAddItemOpen(false)
    toast.success('Item adicionado!')
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(totalAmount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido')
      return
    }
    
    const success = await completePurchase(list.id, amount, paymentMethod, storeName || undefined)
    if (!success) {
      toast.error('Não foi possível finalizar a compra')
      return
    }

    toast.success('Compra finalizada!')
    onBack()
  }

  // Group items by category
  const groupedItems = list.items.reduce((acc, item) => {
    const category = item.category || 'others'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, typeof list.items>)

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{list.name}</h1>
            <p className="text-xs text-muted-foreground">
              {checkedCount} de {list.items.length} itens
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 p-4 pb-[calc(var(--bottom-nav-height)+6rem)] space-y-4">
        {list.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Lista vazia</p>
            <p className="text-sm text-muted-foreground/70">Adicione itens para começar</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {categoryLabels[category] || category}
              </h3>
              {items.map((item) => (
                <Card key={item.id} className={item.checked ? 'opacity-60' : ''}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={async () => {
                        const success = await toggleItemChecked(list.id, item.id)
                        if (!success) {
                          toast.error('Não foi possível atualizar o item')
                        }
                      }}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={async () => {
                        const success = await removeItemFromList(list.id, item.id)
                        if (success) {
                          toast.success('Item removido')
                          return
                        }

                        toast.error('Não foi possível remover o item')
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-(--bottom-nav-height) left-0 right-0 z-40 border-t border-border bg-background p-3">
        <div className="flex gap-2">
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome do item</Label>
                  <Input
                    placeholder="Ex: Arroz, Feijão, Leite..."
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select value={itemUnit} onValueChange={setItemUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">Unidade</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="g">Gramas</SelectItem>
                        <SelectItem value="L">Litro</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="pct">Pacote</SelectItem>
                        <SelectItem value="cx">Caixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={itemCategory} onValueChange={setItemCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Adicionar</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 gap-2" disabled={checkedCount === 0}>
                <Wallet className="w-4 h-4" />
                Finalizar Compra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Finalizar compra</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCheckout} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Valor total</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
                      <Button
                        key={method}
                        type="button"
                        variant={paymentMethod === method ? 'default' : 'outline'}
                        className="justify-start gap-2"
                        onClick={() => setPaymentMethod(method)}
                      >
                        {paymentIcons[method]}
                        {paymentMethodLabels[method]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estabelecimento (opcional)</Label>
                  <Input
                    placeholder="Ex: Supermercado XYZ"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">Confirmar Compra</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
