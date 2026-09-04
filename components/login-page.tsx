"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = await login(email, password);
    if (success) {
      toast.success("Bem-vindo de volta!");
    } else {
      toast.error("E-mail ou senha incorretos");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="bg-hero px-6 pb-16 pt-[max(3rem,env(safe-area-inset-top))] text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <Wallet className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-bold">Despesas</h1>
        <p className="mt-1 text-sm text-white/80">
          Controle o mês como no app de finanças: contas, cartões e compras.
        </p>
      </div>

      <div className="-mt-8 flex-1 rounded-t-3xl bg-background px-5 pt-6">
        <h2 className="text-lg font-semibold text-foreground">Entrar</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Use suas credenciais para continuar
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl pl-10 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Aguarde..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
