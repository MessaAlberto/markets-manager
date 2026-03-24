import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  eventId: string | number;
  eventName: string;
  onAdd: (income: number) => void;
}

const AddIncomeDialog = ({ open, onClose, eventId, eventName, onAdd }: Props) => {
  const [income, setIncome] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    try {
      if (!income) {
        toast.error("Please enter an income amount", { duration: 2500 });
        return;
      }

      setSaving(true);
      const parsedIncome = parseFloat(income);

      const response = await fetch("/api/income", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-pin": localStorage.getItem("mercatini-pin") || ""
        },
        body: JSON.stringify({
          id: eventId,
          income: parsedIncome,
        }),
      });

      if (response.status === 401) {
        toast.error("Wrong or changed PIN. Please log in again.");
        onClose();
        return;
      }

      const data = await response.json();

      if (data.success) {
        onAdd(parsedIncome);
        setIncome("");
        toast.success("Income added successfully!", { duration: 2500 });
        onClose();
      } else {
        toast.error(data.message || "Failed to add income", { duration: 2500 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error", { duration: 2500 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent
        className="max-w-[90vw] rounded-2xl"
        onInteractOutside={(e) => saving && e.preventDefault()}
        onEscapeKeyDown={(e) => saving && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Add Income</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">For: <strong>{eventName}</strong></p>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-base font-semibold">Income (€)</Label>
            <Input disabled={saving} className="mt-1 text-base h-12" type="number" step="0.01" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0.00" />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full h-12 text-base font-bold">
            {saving && <Loader2 className="animate-spin mr-2" size={18} />}
            {saving ? "Saving…" : "Save Income"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddIncomeDialog;