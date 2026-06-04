'use client'

import { ListTodo, History, BarChart3, Settings } from 'lucide-react'
import type { TabType } from './main-app'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  { id: 'lists' as TabType, label: 'Listas', icon: ListTodo },
  { id: 'history' as TabType, label: 'Histórico', icon: History },
  { id: 'reports' as TabType, label: 'Relatórios', icon: BarChart3 },
  { id: 'settings' as TabType, label: 'Config.', icon: Settings },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-(--bottom-nav-height) items-start justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 transition-colors touch-manipulation',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-xs', isActive && 'font-medium')}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
