import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import AddPopup from "@/components/AddPopup";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import AddEventDialog from "@/components/AddEventDialog";
import RemindersPage from "@/pages/RemindersPage";
import SummaryPage from "@/pages/SummaryPage";
import HistoryPage from "@/pages/HistoryPage";
import StatisticsPage from "@/pages/StatisticsPage";
import LanguageSwitcher from "@/components/LanguageSwitcher"; // IMPORTATO
import { useAppData, MarketEvent, Expense } from "@/lib/store";
import { Loader2, Lock, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const Index = () => {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [page, setPage] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MarketEvent | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  const { events, expenses, addEvent, updateEvent, deleteEvent, addExpense, updateExpense, deleteExpense, setInitialData } = useAppData();
  const { t } = useTranslation();

  useEffect(() => {
    const savedPin = localStorage.getItem("mercatini-pin");
    if (savedPin) {
      setIsAuthenticated(true);
    }
    setAuthChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    localStorage.setItem("mercatini-pin", pin);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("mercatini-pin");
    setPin("");
    setIsAuthenticated(false);
    setLoading(true);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchInitialData = async () => {
      try {
        const savedPin = localStorage.getItem("mercatini-pin") || "";
        const response = await fetch('/api/getData', {
          headers: { 'x-api-pin': savedPin }
        });

        if (response.status === 401) {
          toast.error(t("wrong_pin"));
          handleLogout();
          return;
        }

        const data = await response.json();
        if (data.success) {
          setInitialData(data.events, data.expenses);
        } else {
          toast.error(t("failed_load_data") + (data.message || t("unknown_error")));
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error(t("server_error_loading"));
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, setInitialData, t]);

  const handleEditEvent = (event: MarketEvent) => {
    setEditingEvent(event);
    setEventOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseOpen(true);
  };

  const handleEventSubmit = (data: { id?: string | number; name: string; location: string; date: string; participationCost: number; alreadyPaid: boolean }) => {
    if (editingEvent) {
      const updateData = { ...data, id: data.id?.toString() };
      updateEvent(editingEvent.id, updateData as Partial<MarketEvent>);
      setEditingEvent(null);
    } else {
      addEvent(data as any);
    }
  };

  const handleExpenseSubmit = (data: { id?: string | number; title: string; date: string; cost: number }) => {
    if (editingExpense) {
      const updateData = { ...data, id: data.id?.toString() };
      updateExpense(editingExpense.id, updateData as Partial<Expense>);
      setEditingExpense(null);
    } else {
      addExpense(data as any);
    }
  };

  const handleServerDeleteEvent = async (id: string) => {
    try {
      const savedPin = localStorage.getItem("mercatini-pin") || "";
      const res = await fetch('/api/events', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-pin': savedPin
        },
        body: JSON.stringify({ id })
      });
      if (res.status === 401) {
        toast.error(t("wrong_pin"));
        handleLogout(); return;
      }
      const data = await res.json();
      if (data.success) {
        deleteEvent(id);
        toast.success(t("event_deleted"));
      }
    } catch (e) { toast.error(t("server_error")); }
  };

  const handleServerDeleteExpense = async (id: string) => {
    try {
      const savedPin = localStorage.getItem("mercatini-pin") || "";
      const res = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-pin': savedPin
        },
        body: JSON.stringify({ id })
      });
      if (res.status === 401) {
        toast.error(t("wrong_pin"));
        handleLogout(); return;
      }
      const data = await res.json();
      if (data.success) {
        deleteExpense(id);
        toast.success(t("expense_deleted"));
      }
    } catch (e) { toast.error(t("server_error")); }
  };

  if (authChecking) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center max-w-lg mx-auto p-6">
        <div className="bg-card w-full p-8 rounded-3xl shadow-lg border border-border flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Lock className="text-primary" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold mb-2">{t("private_area")}</h1>
          <p className="text-muted-foreground mb-8 text-sm">{t("enter_pin")}</p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-4 text-muted-foreground" size={20} />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={t("secret_pin")}
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-border bg-background text-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-xl active:scale-[0.98] transition-transform text-lg"
            >
              {t("continue")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center max-w-lg mx-auto">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-muted-foreground font-semibold text-lg">{t("synchronizing")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative max-w-lg mx-auto pb-20">
      
      <LanguageSwitcher />

      <div className="overflow-y-auto pt-2">
        {page === 0 && <RemindersPage events={events} onUpdateEvent={updateEvent} onDeleteEvent={handleServerDeleteEvent} onEditEvent={handleEditEvent} />}
        {page === 1 && <SummaryPage events={events} expenses={expenses} />}
        {page === 2 && <HistoryPage events={events} expenses={expenses} onDeleteEvent={handleServerDeleteEvent} onDeleteExpense={handleServerDeleteExpense} onEditEvent={handleEditEvent} onEditExpense={handleEditExpense} />}
        {page === 3 && <StatisticsPage events={events} expenses={expenses} />}
      </div>

      <BottomNav active={page} onNavigate={setPage} onFabClick={() => setPopupOpen(true)} />
      <AddPopup open={popupOpen} onClose={() => setPopupOpen(false)} onAddExpense={() => { setEditingExpense(null); setExpenseOpen(true); }} onAddEvent={() => { setEditingEvent(null); setEventOpen(true); }} />
      <AddExpenseDialog open={expenseOpen} onClose={() => { setExpenseOpen(false); setEditingExpense(null); }} onAdd={handleExpenseSubmit} editExpense={editingExpense} />
      <AddEventDialog open={eventOpen} onClose={() => { setEventOpen(false); setEditingEvent(null); }} onAdd={handleEventSubmit} editEvent={editingEvent} />
    </div>
  );
};

export default Index;