import { useState } from "react";
import { MapPin, Calendar, Bell, CreditCard, DollarSign, Navigation } from "lucide-react";
import { MarketEvent, Reminder } from "@/lib/store";
import EventContextMenu from "@/components/EventContextMenu";
import AddIncomeDialog from "@/components/AddIncomeDialog";
import { format, isPast, isToday, isFuture } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  events: MarketEvent[];
  onUpdateEvent: (id: string, updates: Partial<MarketEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent: (event: MarketEvent) => void;
}

const RemindersPage = ({ events, onUpdateEvent, onDeleteEvent, onEditEvent }: Props) => {
  const [contextMenu, setContextMenu] = useState<{ open: boolean; id: string; pos: { x: number; y: number } }>({ open: false, id: "", pos: { x: 0, y: 0 } });
  const [incomeDialog, setIncomeDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const [reminderDialog, setReminderDialog] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [reminderForm, setReminderForm] = useState<Reminder>({ message: "", date: "", time: "" });

  // Filter: only show events missing some info (past without income, or upcoming with missing payment/no reminder)
  const filtered = events.filter((ev) => {
    const eventDate = new Date(ev.date);
    const past = isPast(eventDate) && !isToday(eventDate);
    if (past) {
      return !ev.income; // past events only if missing income
    }
    // upcoming: show if missing payment or no reminder set
    return true;
  });

  // Sort by most recent first
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleLongPress = (id: string, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setContextMenu({ open: true, id, pos: { x: clientX, y: clientY } });
  };

  const handleSaveReminder = () => {
    if (!reminderForm.message || !reminderForm.date || !reminderForm.time) return;
    onUpdateEvent(reminderDialog.id, { reminder: { ...reminderForm } });
    setReminderDialog({ open: false, id: "" });
    setReminderForm({ message: "", date: "", time: "" });
  };

  const contextEvent = events.find((e) => e.id === contextMenu.id);

  return (
    <TooltipProvider>
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-extrabold mb-4">Reminders</h1>
        {sorted.length === 0 && (
          <p className="text-muted-foreground text-center py-8">All caught up! No pending actions.</p>
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
                    <h3 className="font-bold text-base truncate">{ev.name}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      <MapPin size={14} />
                      <span className="truncate">{ev.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
                      <Calendar size={14} />
                      <span>{format(eventDate, "dd MMM yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center ml-2 shrink-0">
                    {past ? (
                      <button
                        onClick={() => setIncomeDialog({ open: true, id: ev.id, name: ev.name })}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-income text-primary-foreground font-bold text-sm active:scale-95 transition-transform"
                      >
                        <DollarSign size={16} /> Add Income
                      </button>
                    ) : (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-2 rounded-lg bg-muted active:scale-95 transition-transform">
                              <Navigation size={18} className="text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Get directions</TooltipContent>
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
                          <TooltipContent>{hasReminder ? "Reminder set" : "Set reminder"}</TooltipContent>
                        </Tooltip>

                        {missingPayment && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 px-2 py-2 rounded-lg bg-expense/10">
                                <CreditCard size={16} className="text-expense" />
                                <span className="text-expense font-bold text-xs">-€{ev.participationCost}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Missing payment: €{ev.participationCost}</TooltipContent>
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
          onDelete={() => onDeleteEvent(contextMenu.id)}
          position={contextMenu.pos}
        />

        <AddIncomeDialog
          open={incomeDialog.open}
          onClose={() => setIncomeDialog((d) => ({ ...d, open: false }))}
          eventName={incomeDialog.name}
          onAdd={(income) => onUpdateEvent(incomeDialog.id, { income })}
        />

        {/* Reminder Dialog */}
        <Dialog open={reminderDialog.open} onOpenChange={(o) => !o && setReminderDialog({ open: false, id: "" })}>
          <DialogContent className="max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Set Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-base font-semibold">Message</Label>
                <Input className="mt-1 text-base h-12" value={reminderForm.message} onChange={(e) => setReminderForm((f) => ({ ...f, message: e.target.value }))} placeholder="e.g. Prepare stock" />
              </div>
              <div>
                <Label className="text-base font-semibold">Date</Label>
                <Input className="mt-1 text-base h-12" type="date" value={reminderForm.date} onChange={(e) => setReminderForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-base font-semibold">Time</Label>
                <Input className="mt-1 text-base h-12" type="time" value={reminderForm.time} onChange={(e) => setReminderForm((f) => ({ ...f, time: e.target.value }))} />
              </div>
              <Button onClick={handleSaveReminder} className="w-full h-12 text-base font-bold">Save Reminder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default RemindersPage;
