import { useState, useCallback } from "react";

export interface Reminder {
  message: string;
  date: string;
  time: string;
}

export interface MarketEvent {
  id: string;
  name: string;
  location: string;
  date: string; // ISO date
  participationCost: number;
  alreadyPaid: boolean;
  income?: number;
  reminder?: Reminder;
}

export interface Expense {
  id: string;
  title: string;
  date: string;
  cost: number;
}

const INITIAL_EVENTS: MarketEvent[] = [
  { id: "1", name: "Flea Market Downtown", location: "City Center Plaza", date: "2026-03-28", participationCost: 30, alreadyPaid: true },
  { id: "2", name: "Spring Fair", location: "Riverside Park", date: "2026-04-05", participationCost: 50, alreadyPaid: false },
  { id: "3", name: "Artisan Market", location: "Old Town Square", date: "2026-03-15", participationCost: 25, alreadyPaid: true, income: 180 },
  { id: "4", name: "Sunday Bazaar", location: "Community Hall", date: "2026-03-10", participationCost: 20, alreadyPaid: true, income: 95 },
  { id: "5", name: "Vintage Market", location: "Warehouse District", date: "2026-02-22", participationCost: 35, alreadyPaid: true, income: 220 },
  { id: "6", name: "Night Market", location: "Harbor Walk", date: "2026-01-18", participationCost: 40, alreadyPaid: true, income: 310 },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: "1", title: "Display Stand", date: "2026-03-12", cost: 45 },
  { id: "2", title: "Price Tags", date: "2026-03-08", cost: 12 },
  { id: "3", title: "Transport Gas", date: "2026-02-20", cost: 30 },
  { id: "4", title: "Packaging Materials", date: "2026-01-15", cost: 25 },
];

let globalEvents = [...INITIAL_EVENTS];
let globalExpenses = [...INITIAL_EXPENSES];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function useAppData() {
  const [, setTick] = useState(0);

  const rerender = useCallback(() => setTick((t) => t + 1), []);

  // Subscribe on mount
  useState(() => {
    listeners.push(rerender);
    return () => {
      listeners = listeners.filter((l) => l !== rerender);
    };
  });

  // MODIFICATO: Accetta un ID opzionale ed evita di sovrascriverlo se esiste
  const addEvent = (e: Omit<MarketEvent, "id"> & { id?: string | number }) => {
    const newId = e.id ? e.id.toString() : Date.now().toString();
    globalEvents = [...globalEvents, { ...e, id: newId }];
    notify();
  };

  const updateEvent = (id: string, updates: Partial<MarketEvent>) => {
    globalEvents = globalEvents.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev));
    notify();
  };

  const deleteEvent = (id: string) => {
    globalEvents = globalEvents.filter((ev) => ev.id !== id);
    notify();
  };

  // MODIFICATO: Accetta un ID opzionale ed evita di sovrascriverlo se esiste
  const addExpense = (e: Omit<Expense, "id"> & { id?: string | number }) => {
    const newId = e.id ? e.id.toString() : Date.now().toString();
    globalExpenses = [...globalExpenses, { ...e, id: newId }];
    notify();
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    globalExpenses = globalExpenses.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex));
    notify();
  };

  const deleteExpense = (id: string) => {
    globalExpenses = globalExpenses.filter((ex) => ex.id !== id);
    notify();
  };

  return {
    events: globalEvents,
    expenses: globalExpenses,
    addEvent,
    updateEvent,
    deleteEvent,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}