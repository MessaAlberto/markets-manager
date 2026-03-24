import { useState, useMemo } from "react";
import { MarketEvent, Expense } from "@/lib/store";
import { format, subMonths, subYears, parse } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import WheelPicker from "@/components/WheelPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  events: MarketEvent[];
  expenses: Expense[];
}

type Mode = "markets" | "expenses";
type TimeFilter = "all" | "1m" | "5m" | "1y" | "5y" | "month" | "year";

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "1m", label: "Last month" },
  { value: "5m", label: "Last 5 months" },
  { value: "1y", label: "Last year" },
  { value: "5y", label: "Last 5 years" },
  { value: "month", label: "Specific month" },
  { value: "year", label: "Specific year" },
];

const CHART_COLOR = "hsl(210, 60%, 45%)";
const INCOME_COLOR = "hsl(145, 50%, 42%)";
const EXPENSE_COLOR = "hsl(15, 75%, 55%)";

const EMPTY_LOCATION = "(Nessun Luogo)";
const EMPTY_EVENT = "(Nessun Evento)";

function filterByTime<T extends { date: string }>(items: T[], tf: TimeFilter, specific: string): T[] {
  const now = new Date();
  return items.filter(item => {
    const d = new Date(item.date);
    switch (tf) {
      case "all": return true;
      case "1m": return d >= subMonths(now, 1);
      case "5m": return d >= subMonths(now, 5);
      case "1y": return d >= subYears(now, 1);
      case "5y": return d >= subYears(now, 5);
      case "month": return specific ? format(d, "yyyy-MM") === specific : true;
      case "year": return specific ? format(d, "yyyy") === specific : true;
    }
  });
}

function sortChronologically(data: { name: string;[k: string]: any }[], keyFormat: string) {
  return [...data].sort((a, b) => {
    try {
      const da = parse(a.name, keyFormat, new Date());
      const db = parse(b.name, keyFormat, new Date());
      return da.getTime() - db.getTime();
    } catch {
      return 0;
    }
  });
}

function buildTimeMap<T extends { date: string }>(
  items: T[],
  getVal: (item: T) => number,
  keyFn: (d: Date) => string
) {
  const map = new Map<string, { count: number; total: number }>();
  items.forEach(item => {
    const k = keyFn(new Date(item.date));
    const d = map.get(k) || { count: 0, total: 0 };
    d.count++;
    d.total += getVal(item);
    map.set(k, d);
  });
  return [...map.entries()].map(([name, d]) => ({
    name,
    count: d.count,
    total: d.total,
    avg: d.count > 0 ? Math.round(d.total / d.count) : 0,
  }));
}

const StatisticsPage = ({ events, expenses }: Props) => {
  const [mode, setMode] = useState<Mode>("markets");
  const [locationFilter, setLocationFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [specificPeriod, setSpecificPeriod] = useState("");

  const pastEvents = events.filter(e => new Date(e.date) <= new Date());

  const locations = useMemo(() =>
    [...new Set(pastEvents.map(e => (e.location && e.location.trim() !== "") ? e.location : EMPTY_LOCATION))].sort(),
    [pastEvents]);

  const eventNames = useMemo(() =>
    [...new Set(pastEvents.map(e => (e.name && e.name.trim() !== "") ? e.name : EMPTY_EVENT))].sort(),
    [pastEvents]);

  const periods = useMemo(() => {
    const dates = mode === "markets" ? pastEvents.map(e => e.date) : expenses.map(e => e.date);
    const set = new Set<string>();
    dates.forEach(d => {
      if (timeFilter === "month") set.add(format(new Date(d), "yyyy-MM"));
      else if (timeFilter === "year") set.add(format(new Date(d), "yyyy"));
    });
    return [...set].sort();
  }, [pastEvents, expenses, timeFilter, mode]);

  const pickerItems = useMemo(() => {
    return periods.map(p => ({
      value: p,
      label: timeFilter === "month" ? format(new Date(p + "-01"), "MMM yyyy") : p,
    }));
  }, [periods, timeFilter]);

  const effectivePeriod = specificPeriod || (periods.length > 0 ? periods[0] : "");

  const filteredEvents = useMemo(() => {
    let data = filterByTime(pastEvents, timeFilter, effectivePeriod);

    if (locationFilter) {
      if (locationFilter === EMPTY_LOCATION) {
        data = data.filter(e => !e.location || e.location.trim() === "");
      } else {
        data = data.filter(e => e.location === locationFilter);
      }
    }

    if (eventFilter) {
      if (eventFilter === EMPTY_EVENT) {
        data = data.filter(e => !e.name || e.name.trim() === "");
      } else {
        data = data.filter(e => e.name === eventFilter);
      }
    }

    return data;
  }, [pastEvents, timeFilter, effectivePeriod, locationFilter, eventFilter]);

  const filteredExpenses = useMemo(
    () => filterByTime(expenses, timeFilter, effectivePeriod),
    [expenses, timeFilter, effectivePeriod]
  );

  const buildGrouped = (key: "location" | "name") => {
    const map = new Map<string, { count: number; totalIncome: number }>();
    filteredEvents.forEach(e => {
      let k = e[key];
      if (!k || k.trim() === "") {
        k = key === "location" ? EMPTY_LOCATION : EMPTY_EVENT;
      }

      const d = map.get(k) || { count: 0, totalIncome: 0 };
      d.count++;
      d.totalIncome += e.income || 0;
      map.set(k, d);
    });
    return [...map.entries()].map(([name, d]) => ({
      name: name.length > 14 ? name.slice(0, 14) + "…" : name,
      count: d.count,
      totalIncome: d.totalIncome,
      avgIncome: d.count > 0 ? Math.round(d.totalIncome / d.count) : 0,
    }));
  };

  const useYearOnly = timeFilter === "5y" || timeFilter === "all";

  const marketTimeDataByMonth = useMemo(() => {
    const raw = buildTimeMap(filteredEvents, e => e.income || 0, d => format(d, "MMM yy"));
    return sortChronologically(raw, "MMM yy");
  }, [filteredEvents]);

  const marketTimeDataByYear = useMemo(() => {
    const raw = buildTimeMap(filteredEvents, e => e.income || 0, d => format(d, "yyyy"));
    return sortChronologically(raw, "yyyy");
  }, [filteredEvents]);

  const locationData = useMemo(() => buildGrouped("location"), [filteredEvents]);
  const eventData = useMemo(() => buildGrouped("name"), [filteredEvents]);

  const expenseTimeDataByMonth = useMemo(() => {
    const raw = buildTimeMap(filteredExpenses, e => e.cost, d => format(d, "MMM yy"));
    return sortChronologically(raw, "MMM yy");
  }, [filteredExpenses]);

  const expenseTimeDataByYear = useMemo(() => {
    const raw = buildTimeMap(filteredExpenses, e => e.cost, d => format(d, "yyyy"));
    return sortChronologically(raw, "yyyy");
  }, [filteredExpenses]);

  const ChartCard = ({ title, dataKey, color, data: chartData }: { title: string; dataKey: string; color: string; data: any[] }) => (
    <div className="bg-card rounded-xl p-2 border border-border shadow-sm">
      <h3 className="font-bold text-sm mb-1 ml-1">{title}</h3>
      {chartData.length === 0 ? (
        <p className="text-muted-foreground text-center py-6 text-sm">No data</p>
      ) : (
        <div className="flex items-start h-[220px] w-full overflow-hidden">

          <div className="w-[40px] shrink-0 bg-card h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                <Bar dataKey={dataKey} fill="transparent" isAnimationActive={false} />
                <YAxis width={35} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} height={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 overflow-x-auto h-full border-l border-border/50">
            <div style={{ minWidth: chartData.length > 5 ? `${chartData.length * 28}px` : '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                  barCategoryGap="15%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,15%,88%)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={30}
                    textAnchor="start"
                    height={50}
                  />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey={dataKey} radius={[3, 3, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );

  const showLocationCharts = !locationFilter;
  const showEventCharts = !eventFilter;

  const renderMarketTimeCharts = () => {
    if (timeFilter === "all") {
      return (
        <>
          <h2 className="font-bold text-base mb-3 text-muted-foreground">By Year</h2>
          <div className="space-y-4 mb-6">
            <ChartCard title="Count of Markets" dataKey="count" color={CHART_COLOR} data={marketTimeDataByYear} />
            <ChartCard title="Total Income" dataKey="total" color={INCOME_COLOR} data={marketTimeDataByYear} />
            <ChartCard title="Average Income" dataKey="avg" color={INCOME_COLOR} data={marketTimeDataByYear} />
          </div>
          <h2 className="font-bold text-base mb-3 text-muted-foreground">By Month</h2>
          <div className="space-y-4">
            <ChartCard title="Count of Markets" dataKey="count" color={CHART_COLOR} data={marketTimeDataByMonth} />
            <ChartCard title="Total Income" dataKey="total" color={INCOME_COLOR} data={marketTimeDataByMonth} />
            <ChartCard title="Average Income" dataKey="avg" color={INCOME_COLOR} data={marketTimeDataByMonth} />
          </div>
        </>
      );
    }

    const data = useYearOnly ? marketTimeDataByYear : marketTimeDataByMonth;
    return (
      <>
        <h2 className="font-bold text-base mb-3 text-muted-foreground">By Time</h2>
        <div className="space-y-4">
          <ChartCard title="Count of Markets" dataKey="count" color={CHART_COLOR} data={data} />
          <ChartCard title="Total Income" dataKey="total" color={INCOME_COLOR} data={data} />
          <ChartCard title="Average Income" dataKey="avg" color={INCOME_COLOR} data={data} />
        </div>
      </>
    );
  };

  const renderExpenseTimeCharts = () => {
    if (timeFilter === "all") {
      return (
        <>
          <h2 className="font-bold text-base mb-3 text-muted-foreground">By Year</h2>
          <div className="space-y-4 mb-6">
            <ChartCard title="Count of Expenses" dataKey="count" color={CHART_COLOR} data={expenseTimeDataByYear} />
            <ChartCard title="Total Cost" dataKey="total" color={EXPENSE_COLOR} data={expenseTimeDataByYear} />
            <ChartCard title="Average Cost" dataKey="avg" color={EXPENSE_COLOR} data={expenseTimeDataByYear} />
          </div>
          <h2 className="font-bold text-base mb-3 text-muted-foreground">By Month</h2>
          <div className="space-y-4">
            <ChartCard title="Count of Expenses" dataKey="count" color={CHART_COLOR} data={expenseTimeDataByMonth} />
            <ChartCard title="Total Cost" dataKey="total" color={EXPENSE_COLOR} data={expenseTimeDataByMonth} />
            <ChartCard title="Average Cost" dataKey="avg" color={EXPENSE_COLOR} data={expenseTimeDataByMonth} />
          </div>
        </>
      );
    }

    const data = useYearOnly ? expenseTimeDataByYear : expenseTimeDataByMonth;
    return (
      <div className="space-y-4">
        <ChartCard title="Count of Expenses" dataKey="count" color={CHART_COLOR} data={data} />
        <ChartCard title="Total Cost" dataKey="total" color={EXPENSE_COLOR} data={data} />
        <ChartCard title="Average Cost" dataKey="avg" color={EXPENSE_COLOR} data={data} />
      </div>
    );
  };

  return (
    <div className="px-4 pt-2 pb-4">
      <h1 className="text-2xl font-extrabold mb-4">Statistics</h1>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode("markets"); setTimeFilter("all"); setSpecificPeriod(""); }}
          className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${mode === "markets" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
        >
          Markets
        </button>
        <button
          onClick={() => { setMode("expenses"); setTimeFilter("all"); setSpecificPeriod(""); }}
          className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${mode === "expenses" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
        >
          Expenses
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-5">
        {mode === "markets" && (
          <>
            <div>
              <span className="text-xs font-semibold text-muted-foreground mb-1 block">Location:</span>
              <Select value={locationFilter || "__all__"} onValueChange={v => setLocationFilter(v === "__all__" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Locations</SelectItem>
                  {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground mb-1 block">Event:</span>
              <Select value={eventFilter || "__all__"} onValueChange={v => setEventFilter(v === "__all__" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Events</SelectItem>
                  {eventNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div>
          <span className="text-xs font-semibold text-muted-foreground mb-1 block">Time:</span>
          <Select value={timeFilter} onValueChange={(v) => { setTimeFilter(v as TimeFilter); setSpecificPeriod(""); }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {(timeFilter === "month" || timeFilter === "year") && pickerItems.length > 0 && (
          <WheelPicker
            items={pickerItems}
            value={effectivePeriod}
            onChange={setSpecificPeriod}
          />
        )}
      </div>

      {/* Charts */}
      {mode === "markets" ? (
        <div className="space-y-6">
          <div>{renderMarketTimeCharts()}</div>

          {showLocationCharts && (
            <div>
              <h2 className="font-bold text-base mb-3 text-muted-foreground">By Location</h2>
              <div className="space-y-4">
                <ChartCard title="Count of Markets" dataKey="count" color={CHART_COLOR} data={locationData} />
                <ChartCard title="Total Income" dataKey="totalIncome" color={INCOME_COLOR} data={locationData} />
                <ChartCard title="Average Income" dataKey="avgIncome" color={INCOME_COLOR} data={locationData} />
              </div>
            </div>
          )}

          {showEventCharts && (
            <div>
              <h2 className="font-bold text-base mb-3 text-muted-foreground">By Event</h2>
              <div className="space-y-4">
                <ChartCard title="Count of Markets" dataKey="count" color={CHART_COLOR} data={eventData} />
                <ChartCard title="Total Income" dataKey="totalIncome" color={INCOME_COLOR} data={eventData} />
                <ChartCard title="Average Income" dataKey="avgIncome" color={INCOME_COLOR} data={eventData} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {renderExpenseTimeCharts()}
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;