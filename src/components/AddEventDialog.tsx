import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin } from "lucide-react";
import { MarketEvent } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { id?: string | number; name: string; location: string; date: string; participationCost: number; alreadyPaid: boolean; income?: number | null }) => void;
  editEvent?: MarketEvent | null;
}

const AddEventDialog = ({ open, onClose, onAdd, editEvent }: Props) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [cost, setCost] = useState("");
  const [paid, setPaid] = useState(false);
  const [income, setIncome] = useState("");
  const [saving, setSaving] = useState(false);

  const [comuni, setComuni] = useState<string[]>([]);
  const [showComuni, setShowComuni] = useState(false);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json")
      .then(res => res.json())
      .then(data => {
        const nomi = data.map((c: any) => c.nome).sort();
        setComuni(nomi);
      })
      .catch(err => console.error("Errore nel caricamento dei comuni", err));
  }, []);

  const filteredComuni = useMemo(() => {
    if (!location) return comuni.slice(0, 50);
    return comuni
      .filter(c => c.toLowerCase().includes(location.toLowerCase()))
      .slice(0, 50);
  }, [comuni, location]);

  const resetForm = () => {
    setName("");
    setLocation("");
    setDate("");
    setCost("");
    setPaid(false);
    setIncome("");
    setShowComuni(false);
  };

  useEffect(() => {
    if (open && editEvent) {
      setName(editEvent.name === "(Nessun Evento)" ? "" : editEvent.name);
      setLocation(editEvent.location === "(Nessun Luogo)" ? "" : editEvent.location);
      setDate(editEvent.date);
      setCost(editEvent.participationCost.toString());
      setPaid(editEvent.alreadyPaid);
      setIncome(editEvent.income != null ? editEvent.income.toString() : "");
    } else if (open && !editEvent) {
      resetForm();
    }
  }, [open, editEvent]);

  const handleSubmit = async () => {
    try {
      if (!date || !cost) {
        toast.error("Please fill in Date and Cost", { duration: 2500 });
        return;
      }

      setSaving(true);

      const isEdit = !!editEvent;
      const method = isEdit ? "PUT" : "POST";

      const finalName = name.trim() !== "" ? name.trim() : "(Nessun Evento)";
      const finalLocation = location.trim() !== "" ? location.trim() : "(Nessun Luogo)";

      const payload: any = {
        name: finalName,
        location: finalLocation,
        date,
        participationCost: parseFloat(cost),
        alreadyPaid: paid,
      };

      if (isEdit) {
        payload.id = editEvent.id;
        payload.income = income ? parseFloat(income) : null;
      }

      const response = await fetch("/api/events", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-pin": localStorage.getItem("mercatini-pin") || ""
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        toast.error("Wrong or changed PIN. Please log in again.");
        onClose();
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success(isEdit ? "Event updated successfully!" : "Event added successfully!", { duration: 2500 });

        const finalPayload = isEdit ? payload : { ...payload, id: data.id };
        onAdd(finalPayload);

        resetForm();
        onClose();
      } else {
        toast.error(data.message || "Failed to save event", { duration: 2500 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error", { duration: 2500 });
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!editEvent;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent
        className="max-w-[90vw] rounded-2xl"
        onInteractOutside={(e) => saving && e.preventDefault()}
        onEscapeKeyDown={(e) => saving && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{isEdit ? "Edit Market Event" : "Add Market Event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-base font-semibold">Event Name <span className="text-muted-foreground font-normal text-sm">(optional)</span></Label>
            <Input disabled={saving} className="mt-1 text-base h-12" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fiori e Colori" />
          </div>

          <div className="relative">
            <Label className="text-base font-semibold">Location (Comune) <span className="text-muted-foreground font-normal text-sm">(optional)</span></Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
              <Input
                disabled={saving}
                className="pl-10 text-base h-12"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowComuni(true);
                }}
                onFocus={() => setShowComuni(true)}
                onBlur={() => setTimeout(() => setShowComuni(false), 200)}
                placeholder="Cerca un comune..."
                autoComplete="off"
              />
            </div>

            {/* Show dropdown menu */}
            {showComuni && (
              <div className="absolute z-[100] w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md max-h-56 overflow-y-auto">
                {filteredComuni.length > 0 ? (
                  filteredComuni.map(c => (
                    <div
                      key={c}
                      className="px-3 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer text-base transition-colors"
                      onClick={() => {
                        setLocation(c);
                        setShowComuni(false);
                      }}
                    >
                      {c}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-center text-muted-foreground">Nessun comune trovato</div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label className="text-base font-semibold">Date</Label>
            <Input disabled={saving} className="mt-1 text-base h-12" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-base font-semibold">Participation Cost (€)</Label>
            <Input disabled={saving} className="mt-1 text-base h-12" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
          </div>

          {isEdit && (
            <div>
              <Label className="text-base font-semibold text-primary">Income (€)</Label>
              <Input
                disabled={saving}
                className="mt-1 text-base h-12 border-primary/50 bg-primary/5"
                type="number"
                step="0.01"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="0.00 (leave empty to remove)"
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Checkbox disabled={saving} id="paid" checked={paid} onCheckedChange={(v) => setPaid(!!v)} className="w-6 h-6" />
            <Label htmlFor="paid" className={`text-base font-semibold cursor-pointer ${saving ? "opacity-50" : ""}`}>Already Paid Participation Cost</Label>
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full h-12 text-base font-bold mt-2">
            {saving && <Loader2 className="animate-spin mr-2" size={18} />}
            {saving ? (isEdit ? "Saving Changes…" : "Saving Event…") : (isEdit ? "Save Changes" : "Save Event")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;