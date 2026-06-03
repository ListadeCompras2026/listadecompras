'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { LoginPage } from '@/components/login-page'
import { MainApp } from '@/components/main-app'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const initializeAuth = useAppStore((state) => state.initializeAuth)
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const isAuthLoading = useAppStore((state) => state.isAuthLoading)

  useEffect(() => {
    const init = async () => {
      await initializeAuth()
      setMounted(true)
    }

    void init()
  }, [initializeAuth])

  if (!mounted || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medium">Carregando...</div>
      </div>
    )
  }

  return isAuthenticated ? <MainApp /> : <LoginPage />
}
