"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Receipt,
  UtensilsCrossed,
} from "lucide-react";
import { format, subMonths, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PaymentMethod } from "@/lib/types";
import { paymentMethodLabels } from "@/lib/types";
import { formatCurrency } from "@/lib/money";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  credit: <CreditCard className="w-5 h-5" />,
  debit: <CreditCard className="w-5 h-5" />,
  pix: <Smartphone className="w-5 h-5" />,
  cash: <Banknote className="w-5 h-5" />,
  meal: <UtensilsCrossed className="w-5 h-5" />,
};

const paymentColors: Record<PaymentMethod, string> = {
  credit: "oklch(0.55 0.15 160)",
  debit: "oklch(0.65 0.12 200)",
  pix: "oklch(0.6 0.18 140)",
  cash: "oklch(0.75 0.1 80)",
  meal: "oklch(0.62 0.14 30)",
};

interface ReportsViewProps {
  onBack?: () => void;
}

export function ReportsView({ onBack }: ReportsViewProps) {
  const [selectedDate, setSelectedDate] = useState(startOfMonth(new Date()));
  const getMonthlyReport = useAppStore((state) => state.getMonthlyReport);
  const purchases = useAppStore((state) => state.purchases);
  const loadExpenses = useAppStore((state) => state.loadExpenses);

  const report = useMemo(() => {
    return getMonthlyReport(
      selectedDate.getFullYear(),
      selectedDate.getMonth()
    );
  }, [getMonthlyReport, selectedDate]);

  useEffect(() => {
    void loadExpenses(selectedDate.getFullYear(), selectedDate.getMonth());
  }, [loadExpenses, selectedDate]);

  const handlePreviousMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedDate, 1);
    if (nextMonth <= new Date()) {
      setSelectedDate(nextMonth);
    }
  };

  // Data for payment method pie chart
  const paymentMethodData = Object.entries(report.byPaymentMethod).map(
    ([method, amount]) => ({
      name: paymentMethodLabels[method as PaymentMethod],
      value: amount,
      method: method as PaymentMethod,
    })
  );

  // Last 6 months data for bar chart
  const last6MonthsData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(selectedDate, i);
      const monthReport = getMonthlyReport(date.getFullYear(), date.getMonth());
      data.push({
        month: format(date, "MMM", { locale: ptBR }),
        total: monthReport.total,
      });
    }
    return data;
  }, [selectedDate, getMonthlyReport]);

  const isCurrentMonth =
    selectedDate.getMonth() === new Date().getMonth() &&
    selectedDate.getFullYear() === new Date().getFullYear();

  return (
    <div className="space-y-5 p-4 pb-24">
      <div className="flex items-center gap-2 pt-1">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Visão do mês</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-card px-2 py-1 soft-shadow">
        <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-semibold capitalize text-foreground">
          {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          disabled={isCurrentMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="rounded-2xl bg-hero p-6 text-white">
        <div className="mb-2 flex items-center gap-3">
          <TrendingUp className="h-6 w-6" />
          <span className="text-sm font-medium opacity-90">Total do mês</span>
        </div>
        <p className="text-3xl font-bold">{formatCurrency(report.total)}</p>
        <p className="mt-1 text-sm opacity-75">
          Contas {formatCurrency(report.billsTotal)} • Faturas{" "}
          {formatCurrency(report.invoicesTotal)} • Gastos{" "}
          {formatCurrency(report.shoppingTotal)}
        </p>
      </div>

      {purchases.length === 0 && report.total === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Sem dados para exibir</p>
            <p className="text-sm text-muted-foreground/70">
              Registre contas, faturas e compras para ver relatórios
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Last 6 Months Chart */}
          <Card className="rounded-2xl border-0 shadow-sm">
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
                      tick={{ fill: "oklch(0.45 0.01 250)", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "oklch(0.45 0.01 250)", fontSize: 12 }}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {last6MonthsData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={
                            index === last6MonthsData.length - 1
                              ? "oklch(0.68 0.16 155)"
                              : "oklch(0.90 0.04 155)"
                          }
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
            <Card className="rounded-2xl border-0 shadow-sm">
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
                            style={{
                              backgroundColor: paymentColors[item.method],
                            }}
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
            {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map(
              (method) => {
                const amount = report.byPaymentMethod[method] || 0;
                const percentage =
                  report.total > 0 ? (amount / report.total) * 100 : 0;

                return (
                  <Card key={method} className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        {paymentIcons[method]}
                        <span className="text-xs">
                          {paymentMethodLabels[method]}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(0)}% do total
                      </p>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </div>
        </>
      )}
    </div>
  );
}
