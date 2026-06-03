'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { ShoppingListsView } from './shopping-lists-view'
import { HistoryView } from './history-view'
import { ReportsView } from './reports-view'
import { BottomNav } from './bottom-nav'
import { Header } from './header'
import { PushNotificationPrompt } from './push-notification-prompt'

export type TabType = 'lists' | 'history' | 'reports'

export function MainApp() {
  const [activeTab, setActiveTab] = useState<TabType>('lists')
  const currentUser = useAppStore((state) => state.currentUser)

  if (!currentUser) return null

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <Header userName={currentUser.name} />
      <PushNotificationPrompt />
      
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'var(--bottom-nav-height)' }}>
        {activeTab === 'lists' && <ShoppingListsView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'reports' && <ReportsView />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
