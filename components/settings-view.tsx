'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Moon, Sun, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsViewProps {
  userName: string
}

export function SettingsView({ userName }: SettingsViewProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeTheme = theme === 'dark' ? 'dark' : 'light'

  return (
    <section className="p-4 sm:p-6 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurações</CardTitle>
          <CardDescription>Preferências da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usuário</p>
              <p className="font-medium text-foreground">{userName}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Tema</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mounted && activeTheme === 'light' ? 'default' : 'outline'}
                className={cn('justify-start gap-2', !mounted && 'opacity-80')}
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                type="button"
                variant={mounted && activeTheme === 'dark' ? 'default' : 'outline'}
                className={cn('justify-start gap-2', !mounted && 'opacity-80')}
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}