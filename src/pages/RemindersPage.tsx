import { useState } from "react";
import { MapPin, Calendar, Bell, CreditCard, DollarSign, Navigation, Loader2 } from "lucide-react";
import { MarketEvent, Reminder } from "@/lib/store";
import EventContextMenu from "@/components/EventContextMenu";
import AddIncomeDialog from "@/components/AddIncomeDialog";
import { format, isPast, isToday } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Props {
  events: MarketEvent[];
  onUpdateEvent: (id: string, updates: Partial<MarketEvent>) => void;
  onDeleteEvent: (id: string) => Promise<void>;
  onEditEvent: (event: MarketEvent) => void;
}

const RemindersPage = ({ events, onUpdateEvent, onDeleteEvent, onEditEvent }: Props) => {
  const [contextMenu, setContextMenu] = useState<{ open: boolean; id: string; pos: { x: number; y: number } }>({ open: false, id: "", pos: { x: 0, y: 0 } });
  const [incomeDialog, setIncomeDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const [reminderDialog, setReminderDialog] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; id: string; name: string; cost: number }>({ open: false, id: "", name: "", cost: 0 });
  const [reminderForm, setReminderForm] = useState<Reminder>({ message: "", date: "", time: "" });
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const filtered = events.filter((ev) => {
    const eventDate = new Date(ev.date);
    const past = isPast(eventDate) && !isToday(eventDate);
    if (past) {
      return ev.income == null;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    const pastA = isPast(dateA) && !isToday(dateA);
    const pastB = isPast(dateB) && !isToday(dateB);

    if (pastA && !pastB) return -1;
    if (!pastA && pastB) return 1;

    return dateA.getTime() - dateB.getTime();
  });

  const handleLongPress = (id: string, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setContextMenu({ open: true, id, pos: { x: clientX, y: clientY } });
  };

  const downloadICS = (event: MarketEvent, reminder: Reminder) => {
    const startDate = new Date(`${reminder.date}T${reminder.time}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatICSDate = (d: Date) => {
      return d.getFullYear().toString() +
        (d.getMonth() + 1).toString().padStart(2, '0') +
        d.getDate().toString().padStart(2, '0') + "T" +
        d.getHours().toString().padStart(2, '0') +
        d.getMinutes().toString().padStart(2, '0') +
        d.getSeconds().toString().padStart(2, '0');
    };

    const dtStart = formatICSDate(startDate);
    const dtEnd = formatICSDate(endDate);
    const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split('.')[0] + "Z";
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Markets Manager//App//IT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:reminder-${event.id}-${Date.now()}@marketsmanager`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${reminder.message} - ${event.name || event.location}`,
      `LOCATION:${event.location || ""}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${(event.name || event.location || "evento").replace(/\s+/g, "_")}_reminder.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveReminder = async () => {
    if (!reminderForm.message || !reminderForm.date || !reminderForm.time) {
      toast.error(t("fill_reminder_fields"), { duration: 2500 });
      return;
    }

    const currentEvent = events.find(e => e.id === reminderDialog.id);
    if (!currentEvent) return;

    setSaving(true);

    try {
      const payload = {
        id: currentEvent.id,
        name: currentEvent.name,
        location: currentEvent.location,
        date: currentEvent.date,
        participationCost: currentEvent.participationCost,
        alreadyPaid: currentEvent.alreadyPaid,
        income: currentEvent.income,
        mapsLink: currentEvent.mapsLink,
        reminder: reminderForm
      };

      const response = await fetch("/api/events", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-pin": localStorage.getItem("mercatini-pin") || ""
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        toast.error(t("wrong_pin"));
        setReminderDialog({ open: false, id: "" });
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success(t("reminder_saved"), { duration: 2500 });
        downloadICS(currentEvent, reminderForm);
        onUpdateEvent(reminderDialog.id, { reminder: { ...reminderForm } });
        setReminderDialog({ open: false, id: "" });
        setReminderForm({ message: "", date: "", time: "" });
      } else {
        toast.error(data.message || t("failed_save_reminder"), { duration: 2500 });
      }
    } catch (err) {
      console.error(err);
      toast.error(t("server_error"), { duration: 2500 });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPayment = async () => {
    const currentEvent = events.find(e => e.id === paymentDialog.id);
    if (!currentEvent) return;

    setSaving(true);

    try {
      const payload = {
        id: currentEvent.id,
        name: currentEvent.name,
        location: currentEvent.location,
        date: currentEvent.date,
        participationCost: currentEvent.participationCost,
        alreadyPaid: true,
        income: currentEvent.income,
        mapsLink: currentEvent.mapsLink,
        reminder: currentEvent.reminder
      };

      const response = await fetch("/api/events", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-pin": localStorage.getItem("mercatini-pin") || ""
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        toast.error(t("wrong_pin"));
        setPaymentDialog({ open: false, id: "", name: "", cost: 0 });
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success(t("payment_marked_paid"), { duration: 2500 });
        onUpdateEvent(paymentDialog.id, { alreadyPaid: true });
        setPaymentDialog({ open: false, id: "", name: "", cost: 0 });
      } else {
        toast.error(data.message || t("failed_confirm_payment"), { duration: 2500 });
      }
    } catch (err) {
      console.error(err);
      toast.error(t("server_error"), { duration: 2500 });
    } finally {
      setSaving(false);
    }
  };

  const contextEvent = events.find((e) => e.id === contextMenu.id);

  return (
    <TooltipProvider>
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-extrabold mb-4">{t("reminders_title")}</h1>
        {sorted.length === 0 && (
          <p className="text-muted-foreground text-center py-8">{t("all_caught_up")}</p>
        )}
        <div className="space-y-3">
          {sorted.map((ev) => {
            const eventDate = new Date(ev.date);
            const past = isPast(eventDate) && !isToday(eventDate);
            const hasReminder = !!ev.reminder;
            const missingPayment = !ev.alreadyPaid;

            return (
              <div
                key={ev.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border active:bg-muted transition-colors"
                onContextMenu={(e) => handleLongPress(ev.id, e)}
                onTouchStart={(e) => {
                  const timer = setTimeout(() => handleLongPress(ev.id, e), 500);
                  const clear = () => clearTimeout(timer);
                  e.currentTarget.addEventListener("touchend", clear, { once: true });
                  e.currentTarget.addEventListener("touchmove", clear, { once: true });
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base flex items-center gap-1.5 min-w-0">
                      {!ev.name && ev.location && <MapPin size={16} className="text-muted-foreground shrink-0" />}
                      <span className="truncate">{ev.name || ev.location}</span>
                    </h3>
                    {ev.name && ev.location && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
                      <Calendar size={14} className="shrink-0" />
                      <span>{format(eventDate, "dd MMM yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center ml-2 shrink-0">
                    {past ? (
                      <button
                        onClick={() => setIncomeDialog({ open: true, id: ev.id, name: ev.name || ev.location })}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-income text-primary-foreground font-bold text-sm active:scale-95 transition-transform"
                      >
                        <DollarSign size={16} /> {t("add_income")}
                      </button>
                    ) : (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                if (ev.mapsLink) {
                                  window.location.href = ev.mapsLink;
                                } else {
                                  window.location.href = `http://googleusercontent.com/maps.google.com/3${ev.location ? encodeURIComponent(ev.location) : ""}`;
                                }
                              }}
                              className="p-2 rounded-lg bg-muted active:scale-95 transition-transform"
                            >
                              <Navigation size={18} className="text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{t("get_directions")}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                setReminderDialog({ open: true, id: ev.id });
                                if (ev.reminder) {
                                  setReminderForm({ ...ev.reminder });
                                } else {
                                  setReminderForm({ message: "", date: "", time: "" });
                                }
                              }}
                              className="p-2 rounded-lg bg-muted active:scale-95 transition-transform"
                            >
                              <Bell size={18} className={hasReminder ? "text-income" : "text-muted-foreground"} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{hasReminder ? t("reminder_set") : t("set_reminder")}</TooltipContent>
                        </Tooltip>

                        {missingPayment && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setPaymentDialog({ open: true, id: ev.id, name: ev.name || ev.location, cost: ev.participationCost })}
                                className="flex items-center gap-1 px-2 py-2 rounded-lg bg-expense/10 active:scale-95 transition-transform"
                              >
                                <CreditCard size={16} className="text-expense" />
                                <span className="text-expense font-bold text-xs">-€{ev.participationCost}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{t("missing_payment")}: €{ev.participationCost}</TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <EventContextMenu
          open={contextMenu.open}
          onClose={() => setContextMenu((c) => ({ ...c, open: false }))}
          onEdit={() => contextEvent && onEditEvent(contextEvent)}
          onDelete={() => { return onDeleteEvent(contextMenu.id) }}
          position={contextMenu.pos}
        />

        <AddIncomeDialog
          open={incomeDialog.open}
          onClose={() => setIncomeDialog((d) => ({ ...d, open: false }))}
          eventId={incomeDialog.id}
          eventName={incomeDialog.name}
          onAdd={(income) => onUpdateEvent(incomeDialog.id, { income })}
        />

        <Dialog open={reminderDialog.open} onOpenChange={(o) => !o && !saving && setReminderDialog({ open: false, id: "" })}>
          <DialogContent
            className="max-w-[90vw] rounded-2xl"
            onInteractOutside={(e) => saving && e.preventDefault()}
            onEscapeKeyDown={(e) => saving && e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-xl">{t("set_reminder")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-base font-semibold">{t("message")}</Label>
                <Input disabled={saving} className="mt-1 text-base h-12" value={reminderForm.message} onChange={(e) => setReminderForm((f) => ({ ...f, message: e.target.value }))} placeholder={t("message_placeholder")} />
              </div>
              <div>
                <Label className="text-base font-semibold">{t("date")}</Label>
                <Input disabled={saving} className="mt-1 text-base h-12" type="date" value={reminderForm.date} onChange={(e) => setReminderForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-base font-semibold">{t("time")}</Label>
                <Input disabled={saving} className="mt-1 text-base h-12" type="time" value={reminderForm.time} onChange={(e) => setReminderForm((f) => ({ ...f, time: e.target.value }))} />
              </div>
              <Button onClick={handleSaveReminder} disabled={saving} className="w-full h-12 text-base font-bold">
                {saving && <Loader2 className="animate-spin mr-2" size={18} />}
                {saving ? t("saving") : t("save_reminder")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={paymentDialog.open} onOpenChange={(o) => !o && !saving && setPaymentDialog({ open: false, id: "", name: "", cost: 0 })}>
          <DialogContent
            className="max-w-[90vw] rounded-2xl"
            onInteractOutside={(e) => saving && e.preventDefault()}
            onEscapeKeyDown={(e) => saving && e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-xl">{t("confirm_payment")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <p className="text-muted-foreground text-sm">
                {t("confirm_payment_prefix")} <strong>€{paymentDialog.cost}</strong> {t("for")} <strong>{paymentDialog.name}</strong>?
              </p>
              <Button onClick={handleConfirmPayment} disabled={saving} className="w-full h-12 text-base font-bold">
                {saving && <Loader2 className="animate-spin mr-2" size={18} />}
                {saving ? t("confirming") : t("mark_as_paid")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default RemindersPage;