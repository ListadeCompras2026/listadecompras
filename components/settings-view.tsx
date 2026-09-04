"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface SettingsViewProps {
  userName: string;
  onOpenReports: () => void;
}

export function SettingsView({ userName, onOpenReports }: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const logout = useAppStore((state) => state.logout);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = theme === "dark" ? "dark" : "light";

  return (
    <section className="space-y-5 p-4">
      <div className="pt-2">
        <h1 className="text-xl font-semibold text-foreground">Mais</h1>
        <p className="text-sm text-muted-foreground">Conta e preferências</p>
      </div>

      <div className="soft-shadow flex items-center gap-3 rounded-2xl bg-card p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Olá</p>
          <p className="font-semibold text-foreground">{userName}</p>
        </div>
      </div>

      <div className="soft-shadow overflow-hidden rounded-2xl bg-card">
        <button
          type="button"
          onClick={onOpenReports}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Relatórios</p>
            <p className="text-xs text-muted-foreground">
              Gráficos e totais do mês
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        <p className="px-1 text-sm font-medium text-foreground">Tema</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mounted && activeTheme === "light" ? "default" : "outline"}
            className={cn(
              "h-11 justify-start gap-2 rounded-xl",
              !mounted && "opacity-80"
            )}
            onClick={() => setTheme("light")}
          >
            <Sun className="h-4 w-4" />
            Claro
          </Button>
          <Button
            type="button"
            variant={mounted && activeTheme === "dark" ? "default" : "outline"}
            className={cn(
              "h-11 justify-start gap-2 rounded-xl",
              !mounted && "opacity-80"
            )}
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-4 w-4" />
            Escuro
          </Button>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-start gap-2 rounded-xl text-destructive hover:text-destructive"
        onClick={() => void logout()}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </section>
  );
}
