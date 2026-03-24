import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { MarketEvent } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { id?: string | number; name: string; location: string; date: string; participationCost: number; alreadyPaid: boolean }) => void;
  editEvent?: MarketEvent | null;
}

const AddEventDialog = ({ open, onClose, onAdd, editEvent }: Props) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [cost, setCost] = useState("");
  const [paid, setPaid] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setLocation("");
    setDate("");
    setCost("");
    setPaid(false);
  };

  useEffect(() => {
    if (open && editEvent) {
      setName(editEvent.name);
      setLocation(editEvent.location);
      setDate(editEvent.date);
      setCost(editEvent.participationCost.toString());
      setPaid(editEvent.alreadyPaid);
    } else if (open && !editEvent) {
      resetForm();
    }
  }, [open, editEvent]);

  const handleSubmit = async () => {
    try {
      if (!name || !location || !date || !cost) {
        toast.error("Please fill in all required fields", { duration: 2500 });
        return;
      }
      
      setSaving(true);
      
      const method = editEvent ? "PUT" : "POST";
      const payload = {
        ...(editEvent && { id: editEvent.id }),
        name,
        location,
        date,
        participationCost: parseFloat(cost),
        alreadyPaid: paid,
      };

      const response = await fetch("/api/events", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editEvent ? "Event updated successfully!" : "Event added successfully!", { duration: 2500 });

        const finalPayload = editEvent ? payload : { ...payload, id: data.id };
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[90vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEdit ? "Edit Market Event" : "Add Market Event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-base font-semibold">Event Name</Label>
            <Input className="mt-1 text-base h-12" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunday Bazaar" />
          </div>
          <div>
            <Label className="text-base font-semibold">Location</Label>
            <Input className="mt-1 text-base h-12" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. City Center" />
          </div>
          <div>
            <Label className="text-base font-semibold">Date</Label>
            <Input className="mt-1 text-base h-12" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-base font-semibold">Participation Cost (€)</Label>
            <Input className="mt-1 text-base h-12" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="paid" checked={paid} onCheckedChange={(v) => setPaid(!!v)} className="w-6 h-6" />
            <Label htmlFor="paid" className="text-base font-semibold cursor-pointer">Already Paid</Label>
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full h-12 text-base font-bold">
            {saving && <Loader2 className="animate-spin mr-2" size={18} />}
            {saving ? (isEdit ? "Saving Changes…" : "Saving Event…") : (isEdit ? "Save Changes" : "Save Event")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;