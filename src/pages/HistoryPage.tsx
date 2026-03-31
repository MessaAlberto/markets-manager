import { useState, useMemo } from "react";
import { MapPin, Calendar, DollarSign } from "lucide-react";
import { MarketEvent, Expense } from "@/lib/store";
import EventContextMenu from "@/components/EventContextMenu";
import { format, isPast } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface Props {
  events: MarketEvent[];
  expenses: Expense[];
  onDeleteEvent: (id: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onEditEvent: (event: MarketEvent) => void;
  onEditExpense: (expense: Expense) => void;
}

type ViewType = "events" | "expenses";
type SortType = "date-desc" | "date-asc" | "cost-desc" | "cost-asc";

const HistoryPage = ({ events, expenses, onDeleteEvent, onDeleteExpense, onEditEvent, onEditExpense }: Props) => {
  const [view, setView] = useState<ViewType>("events");
  const [sort, setSort] = useState<SortType>("date-desc");
  const [contextMenu, setContextMenu] = useState<{ open: boolean; id: string; pos: { x: number; y: number } }>({ open: false, id: "", pos: { x: 0, y: 0 } });
  const { t } = useTranslation();

  const pastEvents = useMemo(() => {
    return events
      .filter((e) => e.id && e.id.trim() !== "" && isPast(new Date(e.date)))
      .sort((a, b) => {
        switch (sort) {
          case "date-desc": return new Date(b.date).getTime() - new Date(a.date).getTime();
          case "date-asc": return new Date(a.date).getTime() - new Date(b.date).getTime();
          case "cost-desc": return (b.income || 0) - (a.income || 0);
          case "cost-asc": return (a.income || 0) - (b.income || 0);
          default: return 0;
        }
      });
  }, [events, sort]);

  const sortedExpenses = useMemo(() => {
    const stdExpenses = expenses
      .filter((e) => e.id && e.id.trim() !== "")
      .map(e => ({ ...e, isEvent: false }));

    const evtExpenses = events
      .filter((e) => e.id && e.id.trim() !== "" && (e.participationCost || 0) > 0 && e.alreadyPaid)
      .map(e => {
        const locationName = e.location?.trim() ? e.location : (e.name || "Mercatino");
        return {
          id: `evt-${e.id}`,
          title: `${t("subscription")}: ${locationName}`,
          date: e.date,
          cost: e.participationCost,
          isEvent: true
        };
      });

    return [...stdExpenses, ...evtExpenses]
      .sort((a, b) => {
        switch (sort) {
          case "date-desc": return new Date(b.date).getTime() - new Date(a.date).getTime();
          case "date-asc": return new Date(a.date).getTime() - new Date(b.date).getTime();
          case "cost-desc": return b.cost - a.cost;
          case "cost-asc": return a.cost - b.cost;
          default: return 0;
        }
      });
  }, [expenses, events, sort, t]);

  const handleLongPress = (id: string, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setContextMenu({ open: true, id, pos: { x: clientX, y: clientY } });
  };

  const handleEdit = () => {
    if (view === "events") {
      const event = events.find(e => e.id === contextMenu.id);
      if (event) onEditEvent(event);
    } else {
      if (contextMenu.id.startsWith("evt-")) {
        const realId = contextMenu.id.replace("evt-", "");
        const event = events.find(e => e.id === realId);
        if (event) onEditEvent(event);
      } else {
        const expense = expenses.find(e => e.id === contextMenu.id);
        if (expense) onEditExpense(expense);
      }
    }
  };

  return (
    <div className="px-4 pt-2 pb-4">
      <h1 className="text-2xl font-extrabold mb-4">{t("history_title")}</h1>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setView("events")}
          className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${view === "events" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
        >
          {t("market_events")}
        </button>
        <button
          onClick={() => setView("expenses")}
          className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${view === "expenses" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
        >
          {t("expenses")}
        </button>
      </div>

      <div className="mb-4">
        <span className="text-xs font-semibold text-muted-foreground mb-1 block">{t("sort_by")}</span>
        <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">{t("newest_first")}</SelectItem>
            <SelectItem value="date-asc">{t("oldest_first")}</SelectItem>
            <SelectItem value="cost-desc">{t("highest")} {view === "events" ? t("income").toLowerCase() : t("cost").toLowerCase()}</SelectItem>
            <SelectItem value="cost-asc">{t("lowest")} {view === "events" ? t("income").toLowerCase() : t("cost").toLowerCase()}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {view === "events" ? (
          <>
            {pastEvents.length === 0 && <p className="text-muted-foreground text-center py-8">{t("no_past_events")}</p>}
            {pastEvents.map((ev, index) => (
              <div
                key={`event-${ev.id}-${index}`}
                className="bg-card rounded-xl p-4 shadow-sm border border-border active:bg-muted transition-colors"
                onContextMenu={(e) => handleLongPress(ev.id, e)}
                onTouchStart={(e) => {
                  const timer = setTimeout(() => handleLongPress(ev.id, e), 500);
                  const clear = () => clearTimeout(timer);
                  e.currentTarget.addEventListener("touchend", clear, { once: true });
                  e.currentTarget.addEventListener("touchmove", clear, { once: true });
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base flex items-center gap-1.5 min-w-0">
                      {!ev.name && ev.location && <MapPin size={16} className="text-muted-foreground shrink-0" />}
                      <span className="truncate">{ev.name || ev.location}</span>
                    </h3>
                    {ev.name && ev.location && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                        <MapPin size={14} className="shrink-0" /><span className="truncate">{ev.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
                      <Calendar size={14} className="shrink-0" /><span>{format(new Date(ev.date), "dd MMM yyyy")}</span>
                    </div>
                  </div>
                  {ev.income != null && (
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <DollarSign size={16} className="text-income" />
                      <span className="font-bold text-income text-lg">€{ev.income}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {sortedExpenses.length === 0 && <p className="text-muted-foreground text-center py-8">{t("no_expenses")}</p>}
            {sortedExpenses.map((ex, index) => (
              <div
                key={`expense-${ex.id}-${index}`}
                className="bg-card rounded-xl p-4 shadow-sm border border-border active:bg-muted transition-colors"
                onContextMenu={(e) => handleLongPress(ex.id, e)}
                onTouchStart={(e) => {
                  const timer = setTimeout(() => handleLongPress(ex.id, e), 500);
                  const clear = () => clearTimeout(timer);
                  e.currentTarget.addEventListener("touchend", clear, { once: true });
                  e.currentTarget.addEventListener("touchmove", clear, { once: true });
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">{ex.title}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      {ex.isEvent ? <MapPin size={14} /> : <Calendar size={14} />}
                      <span>{format(new Date(ex.date), "dd MMM yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <span className="font-bold text-expense text-lg">-€{ex.cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <EventContextMenu
        open={contextMenu.open}
        onClose={() => setContextMenu((c) => ({ ...c, open: false }))}
        onEdit={handleEdit}
        onDelete={() => {
          if (view === "events") {
            return onDeleteEvent(contextMenu.id);
          } else {
            if (contextMenu.id.startsWith("evt-")) {
              const realId = contextMenu.id.replace("evt-", "");
              return onDeleteEvent(realId);
            }
            return onDeleteExpense(contextMenu.id);
          }
        }}
        position={contextMenu.pos}
      />
    </div>
  );
};

export default HistoryPage;