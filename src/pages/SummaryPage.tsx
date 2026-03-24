import { MarketEvent, Expense } from "@/lib/store";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Props {
  events: MarketEvent[];
  expenses: Expense[];
}

const SummaryPage = ({ events, expenses }: Props) => {
  const totalIncome = events.reduce((s, e) => s + (e.income || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.cost, 0) + events.reduce((s, e) => s + e.participationCost, 0);
  const totalProfit = totalIncome - totalExpenses;

  // Monthly breakdown
  const months = new Map<string, { income: number; expenses: number }>();
  events.forEach((e) => {
    const key = format(new Date(e.date), "yyyy-MM");
    const m = months.get(key) || { income: 0, expenses: 0 };
    m.income += e.income || 0;
    m.expenses += e.participationCost;
    months.set(key, m);
  });
  expenses.forEach((e) => {
    const key = format(new Date(e.date), "yyyy-MM");
    const m = months.get(key) || { income: 0, expenses: 0 };
    m.expenses += e.cost;
    months.set(key, m);
  });

  const sortedMonths = [...months.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="px-4 pt-2 pb-4">
      <h1 className="text-2xl font-extrabold mb-4">Summary</h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-expense/10 rounded-xl p-3 text-center">
          <TrendingDown size={22} className="mx-auto mb-1 text-expense" />
          <p className="text-[11px] text-muted-foreground font-semibold">Expenses</p>
          <p className="text-lg font-extrabold text-expense">€{totalExpenses.toFixed(0)}</p>
        </div>
        <div className="bg-income/10 rounded-xl p-3 text-center">
          <TrendingUp size={22} className="mx-auto mb-1 text-income" />
          <p className="text-[11px] text-muted-foreground font-semibold">Income</p>
          <p className="text-lg font-extrabold text-income">€{totalIncome.toFixed(0)}</p>
        </div>
        <div className="bg-primary/10 rounded-xl p-3 text-center">
          <DollarSign size={22} className="mx-auto mb-1 text-profit" />
          <p className="text-[11px] text-muted-foreground font-semibold">Profit</p>
          <p className={`text-lg font-extrabold ${totalProfit >= 0 ? "text-income" : "text-expense"}`}>€{totalProfit.toFixed(0)}</p>
        </div>
      </div>

      <h2 className="font-bold text-lg mb-3">Monthly Breakdown</h2>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-4 gap-0 text-xs font-bold text-muted-foreground border-b border-border px-3 py-2.5">
          <span>Month</span>
          <span className="text-right">Expenses</span>
          <span className="text-right">Income</span>
          <span className="text-right">Profit</span>
        </div>
        {/* Rows */}
        {sortedMonths.map(([month, data], i) => {
          const profit = data.income - data.expenses;
          return (
            <div
              key={month}
              className={`grid grid-cols-4 gap-0 px-3 py-3 text-sm ${i < sortedMonths.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="font-bold">{format(new Date(month + "-01"), "MMM yyyy")}</span>
              <span className="text-right font-bold text-expense">€{data.expenses.toFixed(0)}</span>
              <span className="text-right font-bold text-income">€{data.income.toFixed(0)}</span>
              <span className={`text-right font-bold ${profit >= 0 ? "text-income" : "text-expense"}`}>€{profit.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SummaryPage;
