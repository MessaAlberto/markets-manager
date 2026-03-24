// pages/Index.tsx
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import AddPopup from "@/components/AddPopup";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import AddEventDialog from "@/components/AddEventDialog";
import RemindersPage from "@/pages/RemindersPage";
import SummaryPage from "@/pages/SummaryPage";
import HistoryPage from "@/pages/HistoryPage";
import StatisticsPage from "@/pages/StatisticsPage";
import { useAppData, MarketEvent, Expense } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [page, setPage] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MarketEvent | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [loading, setLoading] = useState(true);

  const { events, expenses, addEvent, updateEvent, deleteEvent, addExpense, updateExpense, deleteExpense, setInitialData } = useAppData();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/getData');
        const data = await response.json();
        if (data.success) {
          setInitialData(data.events, data.expenses);
        }
      } catch (error) {
        console.error("Errore nel recupero dati:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [setInitialData]);

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
      const res = await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      
      if (data.success) {
        deleteEvent(id);
        toast.success("Event deleted successfully", { duration: 2500 });
      } else {
        toast.error("Failed to delete event", { duration: 2500 });
      }
    } catch (e) {
      console.error(e);
      toast.error("Server error during deletion", { duration: 2500 });
    }
  };

  const handleServerDeleteExpense = async (id: string) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      
      if (data.success) {
        deleteExpense(id);
        toast.success("Expense deleted successfully", { duration: 2500 });
      } else {
        toast.error("Failed to delete expense", { duration: 2500 });
      }
    } catch (e) {
      console.error(e);
      toast.error("Server error during deletion", { duration: 2500 });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center max-w-lg mx-auto">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-muted-foreground font-semibold text-lg">Caricamento database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-20">
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