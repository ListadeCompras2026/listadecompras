"use client";

import { Home, ListTodo, ArrowLeftRight, LayoutGrid, Plus } from "lucide-react";
import type { TabType } from "./main-app";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onFabClick: () => void;
}

const leftTabs = [
  { id: "expenses" as TabType, label: "Início", icon: Home },
  { id: "lists" as TabType, label: "Listas", icon: ListTodo },
];

const rightTabs = [
  { id: "history" as TabType, label: "Transações", icon: ArrowLeftRight },
  { id: "settings" as TabType, label: "Mais", icon: LayoutGrid },
];

export function BottomNav({
  activeTab,
  onTabChange,
  onFabClick,
}: BottomNavProps) {
  const renderTab = (tab: (typeof leftTabs)[number]) => {
    const Icon = tab.icon;
    const isActive =
      activeTab === tab.id ||
      (tab.id === "settings" && activeTab === "reports");

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => onTabChange(tab.id)}
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 transition-colors touch-manipulation",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
        <span className={cn("text-[11px]", isActive && "font-semibold")}>
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="relative flex h-(--bottom-nav-height) items-start justify-around px-1 pt-2 pb-[env(safe-area-inset-bottom)]">
        {leftTabs.map(renderTab)}

        <div className="flex w-16 shrink-0 justify-center">
          <button
            type="button"
            onClick={onFabClick}
            aria-label="Adicionar"
            className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </div>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
