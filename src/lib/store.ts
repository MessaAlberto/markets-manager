// lib/store.ts
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
  date: string;
  participationCost: number;
  alreadyPaid: boolean;
  income?: number | null;
  reminder?: Reminder;
  mapsLink?: string;
}

export interface Expense {
  id: string;
  title: string;
  date: string;
  cost: number;
}

let globalEvents: MarketEvent[] = [];
let globalExpenses: Expense[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function useAppData() {
  const [, setTick] = useState(0);

  const rerender = useCallback(() => setTick((t) => t + 1), []);

  useState(() => {
    listeners.push(rerender);
    return () => {
      listeners = listeners.filter((l) => l !== rerender);
    };
  });

  const setInitialData = useCallback((events: MarketEvent[], expenses: Expense[]) => {
    globalEvents = events;
    globalExpenses = expenses;
    notify();
  }, []);

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
    setInitialData,
    addEvent,
    updateEvent,
    deleteEvent,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}