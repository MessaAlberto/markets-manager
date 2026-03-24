import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import AddPopup from "@/components/AddPopup";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import AddEventDialog from "@/components/AddEventDialog";
import RemindersPage from "@/pages/RemindersPage";
import SummaryPage from "@/pages/SummaryPage";
import HistoryPage from "@/pages/HistoryPage";
import StatisticsPage from "@/pages/StatisticsPage";
import { useAppData, MarketEvent, Expense } from "@/lib/store";

const Index = () => {
  const [page, setPage] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MarketEvent | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { events, expenses, addEvent, updateEvent, deleteEvent, addExpense, updateExpense, deleteExpense } = useAppData();

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
      const updateData = {
        ...data,
        id: data.id?.toString()
      };
      updateEvent(editingEvent.id, updateData as Partial<MarketEvent>);
      setEditingEvent(null);
    } else {
      addEvent(data as any);
    }
  };

  const handleExpenseSubmit = (data: { id?: string | number; title: string; date: string; cost: number }) => {
    if (editingExpense) {
      const updateData = {
        ...data,
        id: data.id?.toString()
      };
      updateExpense(editingExpense.id, updateData as Partial<Expense>);
      setEditingExpense(null);
    } else {
      addExpense(data as any);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-20">
      <div className="overflow-y-auto pt-2">
        {page === 0 && <RemindersPage events={events} onUpdateEvent={updateEvent} onDeleteEvent={deleteEvent} onEditEvent={handleEditEvent} />}
        {page === 1 && <SummaryPage events={events} expenses={expenses} />}
        {page === 2 && <HistoryPage events={events} expenses={expenses} onDeleteEvent={deleteEvent} onDeleteExpense={deleteExpense} onEditEvent={handleEditEvent} onEditExpense={handleEditExpense} />}
        {page === 3 && <StatisticsPage events={events} expenses={expenses} />}
      </div>

      <BottomNav active={page} onNavigate={setPage} onFabClick={() => setPopupOpen(true)} />
      <AddPopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        onAddExpense={() => { setEditingExpense(null); setExpenseOpen(true); }}
        onAddEvent={() => { setEditingEvent(null); setEventOpen(true); }}
      />
      <AddExpenseDialog
        open={expenseOpen}
        onClose={() => { setExpenseOpen(false); setEditingExpense(null); }}
        onAdd={handleExpenseSubmit}
        editExpense={editingExpense}
      />
      <AddEventDialog
        open={eventOpen}
        onClose={() => { setEventOpen(false); setEditingEvent(null); }}
        onAdd={handleEventSubmit}
        editEvent={editingEvent}
      />
    </div>
  );
};

export default Index;