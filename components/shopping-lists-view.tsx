'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, ShoppingBag, ChevronRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ShoppingListDetail } from './shopping-list-detail'
import type { ShoppingList } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ShoppingListsView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null)
  
  const { createList, deleteList, getMyLists, shoppingLists } = useAppStore()
  
  const activeLists = getMyLists()

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) {
      toast.error('Digite um nome para a lista')
      return
    }
    
    const createdList = await createList(newListName.trim())
    if (!createdList) {
      toast.error('Não foi possível criar a lista')
      return
    }

    setNewListName('')
    setIsCreateOpen(false)
    toast.success('Lista criada com sucesso!')
    setSelectedList(createdList)
  }

  const handleDeleteList = async (listId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const success = await deleteList(listId)
    if (success) {
      toast.success('Lista excluída')
      return
    }

    toast.error('Não foi possível excluir a lista')
  }

  const handleSelectList = (list: ShoppingList) => {
    // Get the fresh list from store
    const freshList = shoppingLists.find(l => l.id === list.id)
    if (freshList) {
      setSelectedList(freshList)
    }
  }

  if (selectedList) {
    const freshList = shoppingLists.find(l => l.id === selectedList.id)
    if (freshList) {
      return (
        <ShoppingListDetail 
          list={freshList} 
          onBack={() => setSelectedList(null)} 
        />
      )
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Create List Button */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button className="w-full h-12 text-base gap-2">
            <Plus className="w-5 h-5" />
            Nova Lista
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar nova lista</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateList} className="space-y-4 mt-4">
            <Input
              placeholder="Nome da lista (ex: Compras da semana)"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Criar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* My Lists */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Listas Ativas</h2>
        {activeLists.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma lista criada</p>
              <p className="text-xs text-muted-foreground/70">Crie sua primeira lista de compras</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeLists.map((list) => (
              <Card 
                key={list.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleSelectList(list)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{list.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {list.items.length} {list.items.length === 1 ? 'item' : 'itens'} • 
                        {' '}{format(new Date(list.updatedAt), "dd 'de' MMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        void handleDeleteList(list.id, e)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
