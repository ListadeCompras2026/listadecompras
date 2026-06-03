'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { LogOut, ShoppingCart } from 'lucide-react'

interface HeaderProps {
  userName: string
}

export function Header({ userName }: HeaderProps) {
  const logout = useAppStore((state) => state.logout)

  const handleLogout = () => {
    void logout()
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-tight">Lista de Compras</p>
            <p className="text-xs text-muted-foreground">Olá, {userName}</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-5 h-5" />
          <span className="sr-only">Sair</span>
        </Button>
      </div>
    </header>
  )
}
