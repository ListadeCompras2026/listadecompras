'use client'

import { useEffect, useMemo, useState } from 'react'
import { BellRing } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'push-prompt-dismissed'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export function PushNotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const supported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      Boolean(publicKey)

    setIsSupported(supported)
    if (!supported) {
      return
    }

    setPermission(Notification.permission)

    const dismissed = window.localStorage.getItem(DISMISS_KEY) === '1'
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    setIsVisible(!dismissed && isStandalone && Notification.permission !== 'granted')
  }, [publicKey])

  const showPrompt = useMemo(
    () => isSupported && isVisible && permission !== 'granted',
    [isSupported, isVisible, permission]
  )

  const dismissPrompt = () => {
    window.localStorage.setItem(DISMISS_KEY, '1')
    setIsVisible(false)
  }

  const subscribe = async () => {
    if (!publicKey) {
      toast.error('Chave de notificacao nao configurada')
      return
    }

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result !== 'granted') {
      toast.error('Permissao de notificacao negada')
      return
    }

    const registration = await navigator.serviceWorker.ready
    const existingSubscription = await registration.pushManager.getSubscription()
    const subscription =
      existingSubscription ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }))

    const response = await fetch('/api/notifications/subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    })

    if (!response.ok) {
      toast.error('Nao foi possivel ativar notificacoes')
      return
    }

    toast.success('Notificacoes ativadas neste dispositivo')
    dismissPrompt()
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="px-4 pt-3">
      <Alert className="border-primary/20 bg-background/95">
        <BellRing className="text-primary" />
        <AlertTitle>Ativar notificacoes</AlertTitle>
        <AlertDescription>
          Receba aviso quando uma nova lista for compartilhada com voce.
        </AlertDescription>
        <div className="col-start-2 mt-3 flex gap-2">
          <Button type="button" size="sm" onClick={subscribe}>
            Ativar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={dismissPrompt}>
            Agora nao
          </Button>
        </div>
      </Alert>
    </div>
  )
}
