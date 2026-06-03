'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, TrendingUp, CreditCard, Banknote, 
  Smartphone, ChevronLeft, ChevronRight, Receipt, UtensilsCrossed 
} from 'lucide-react'
import { format, subMonths, addMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PaymentMethod } from '@/lib/types'
import { paymentMethodLabels } from '@/lib/types'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  credit: <CreditCard className="w-5 h-5" />,
  debit: <CreditCard className="w-5 h-5" />,
  pix: <Smartphone className="w-5 h-5" />,
  cash: <Banknote className="w-5 h-5" />,
  meal: <UtensilsCrossed className="w-5 h-5" />,
}

const paymentColors: Record<PaymentMethod, string> = {
  credit: 'oklch(0.55 0.15 160)',
  debit: 'oklch(0.65 0.12 200)',
  pix: 'oklch(0.6 0.18 140)',
  cash: 'oklch(0.75 0.1 80)',
  meal: 'oklch(0.62 0.14 30)',
}

export function ReportsView() {
  const [selectedDate, setSelectedDate] = useState(startOfMonth(new Date()))
  const getMonthlyReport = useAppStore((state) => state.getMonthlyReport)
  const purchases = useAppStore((state) => state.purchases)

  const report = useMemo(() => {
    return getMonthlyReport(selectedDate.getFullYear(), selectedDate.getMonth())
  }, [getMonthlyReport, selectedDate])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handlePreviousMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1))
  }

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedDate, 1)
    if (nextMonth <= new Date()) {
      setSelectedDate(nextMonth)
    }
  }

  // Data for payment method pie chart
  const paymentMethodData = Object.entries(report.byPaymentMethod).map(([method, amount]) => ({
    name: paymentMethodLabels[method as PaymentMethod],
    value: amount,
    method: method as PaymentMethod,
  }))

  // Last 6 months data for bar chart
  const last6MonthsData = useMemo(() => {
    const data = []
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(selectedDate, i)
      const monthReport = getMonthlyReport(date.getFullYear(), date.getMonth())
      data.push({
        month: format(date, 'MMM', { locale: ptBR }),
        total: monthReport.total,
      })
    }
    return data
  }, [selectedDate, getMonthlyReport])

  const isCurrentMonth = selectedDate.getMonth() === new Date().getMonth() && 
                        selectedDate.getFullYear() === new Date().getFullYear()

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground capitalize">
          {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNextMonth}
          disabled={isCurrentMonth}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Total Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6" />
            <span className="text-sm font-medium opacity-90">Total do mês</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(report.total)}</p>
          <p className="text-sm opacity-75 mt-1">
            {report.purchases.length} {report.purchases.length === 1 ? 'compra' : 'compras'} realizadas
          </p>
        </CardContent>
      </Card>

      {purchases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Sem dados para exibir</p>
            <p className="text-sm text-muted-foreground/70">Finalize compras para ver relatórios</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Last 6 Months Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Últimos 6 meses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last6MonthsData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.45 0.01 250)', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'oklch(0.45 0.01 250)', fontSize: 12 }}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {last6MonthsData.map((_, index) => (
                        <Cell 
                          key={index} 
                          fill={index === last6MonthsData.length - 1 ? 'oklch(0.55 0.15 160)' : 'oklch(0.92 0.03 160)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Breakdown */}
          {paymentMethodData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Por forma de pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="mx-auto h-32 w-32 sm:mx-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {paymentMethodData.map((entry) => (
                            <Cell 
                              key={entry.method} 
                              fill={paymentColors[entry.method]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    {paymentMethodData.map((item) => (
                      <div
                        key={item.method}
                        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: paymentColors[item.method] }}
                          />
                          <span className="min-w-0 text-sm text-foreground wrap-break-word">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground sm:text-right">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method Cards */}
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => {
              const amount = report.byPaymentMethod[method] || 0
              const percentage = report.total > 0 ? (amount / report.total) * 100 : 0
              
              return (
                <Card key={method}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      {paymentIcons[method]}
                      <span className="text-xs">{paymentMethodLabels[method]}</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(amount)}</p>
                    <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}% do total</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
