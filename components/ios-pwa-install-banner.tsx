'use client'

import { useEffect, useState } from 'react'
import { Share2, Smartphone, X } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'ios-pwa-install-banner-dismissed'

function isIosDevice() {
  if (typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent
  const iPhoneOrIpod = /iPhone|iPod/.test(userAgent)
  const iPadOs = /Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1

  return iPhoneOrIpod || iPadOs
}

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function IosPwaInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isIosDevice() || isStandaloneMode()) {
      return
    }

    if (window.localStorage.getItem(DISMISS_KEY) === '1') {
      return
    }

    setVisible(true)
  }, [])

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-x-4 top-4 z-60 mx-auto w-full max-w-md">
      <Alert className="border-primary/20 bg-background/95 shadow-xl backdrop-blur supports-backdrop-filter:bg-background/85">
        <Smartphone className="text-primary" />
        <AlertTitle>Instalar no iPhone</AlertTitle>
        <AlertDescription className="pr-10">
          Toque em Compartilhar no Safari e escolha Adicionar à Tela de Início para usar o app como PWA.
        </AlertDescription>
        <div className="col-start-2 mt-2 flex items-center gap-2">
          <Share2 className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-xs">Funciona melhor aberto no Safari</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          aria-label="Dispensar aviso de instalação"
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  )
}