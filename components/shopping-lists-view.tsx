"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ShoppingBag, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ShoppingListDetail } from "./shopping-list-detail";
import type { ShoppingList } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { QuickAction } from "./main-app";

interface ShoppingListsViewProps {
  quickAction?: QuickAction;
  onQuickActionConsumed?: () => void;
}

export function ShoppingListsView({
  quickAction,
  onQuickActionConsumed,
}: ShoppingListsViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);

  const { createList, deleteList, getMyLists, shoppingLists } = useAppStore();

  const activeLists = getMyLists();

  useEffect(() => {
    if (quickAction === "list") {
      setIsCreateOpen(true);
      onQuickActionConsumed?.();
    }
  }, [onQuickActionConsumed, quickAction]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) {
      toast.error("Digite um nome para a lista");
      return;
    }

    const createdList = await createList(newListName.trim());
    if (!createdList) {
      toast.error("Não foi possível criar a lista");
      return;
    }

    setNewListName("");
    setIsCreateOpen(false);
    toast.success("Lista criada com sucesso!");
    setSelectedList(createdList);
  };

  const handleDeleteList = async (listId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteList(listId);
    if (success) {
      toast.success("Lista excluída");
      return;
    }

    toast.error("Não foi possível excluir a lista");
  };

  const handleSelectList = (list: ShoppingList) => {
    // Get the fresh list from store
    const freshList = shoppingLists.find((l) => l.id === list.id);
    if (freshList) {
      setSelectedList(freshList);
    }
  };

  if (selectedList) {
    const freshList = shoppingLists.find((l) => l.id === selectedList.id);
    if (freshList) {
      return (
        <ShoppingListDetail
          list={freshList}
          onBack={() => setSelectedList(null)}
        />
      );
    }
  }

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Listas</h1>
          <p className="text-sm text-muted-foreground">Compras da casa</p>
        </div>
        <Button
          size="sm"
          className="gap-1 rounded-full"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nova
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Criar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {activeLists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center">
          <ShoppingBag className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhuma lista criada</p>
          <p className="text-xs text-muted-foreground/70">
            Crie sua primeira lista
          </p>
        </div>
      ) : (
        <div className="soft-shadow overflow-hidden rounded-2xl bg-card">
          {activeLists.map((list, index) => (
            <div
              key={list.id}
              role="button"
              tabIndex={0}
              className={`flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-left ${index > 0 ? "border-t border-border/70" : ""}`}
              onClick={() => handleSelectList(list)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ")
                  handleSelectList(list);
              }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {list.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {list.items.length}{" "}
                    {list.items.length === 1 ? "item" : "itens"} •{" "}
                    {format(new Date(list.updatedAt), "dd 'de' MMM", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    void handleDeleteList(list.id, e);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
