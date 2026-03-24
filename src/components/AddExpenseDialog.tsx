import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Expense } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; date: string; cost: number }) => void;
  editExpense?: Expense | null;
}

const AddExpenseDialog = ({ open, onClose, onAdd, editExpense }: Props) => {
  const today = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && editExpense) {
      setTitle(editExpense.title);
      setDate(editExpense.date);
      setCost(editExpense.cost.toString());
    } else if (open && !editExpense) {
      setTitle(""); setDate(today); setCost("");
    }
  }, [open, editExpense]);

  const handleSubmit = async () => {
    try {
      if (!title || !cost) {
        toast.error("Please fill in all required fields", { duration: 2500 });
        return;
      }
      setSaving(true);
      await new Promise(r => setTimeout(r, 400));
      onAdd({ title, date, cost: parseFloat(cost) });
      if (!editExpense) { setTitle(""); setDate(today); setCost(""); }
      toast.success(editExpense ? "Expense updated!" : "Expense added!", { duration: 2500 });
      onClose();
    } catch {
      toast.error("Failed to save expense", { duration: 2500 });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!editExpense;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[90vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEdit ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-base font-semibold">Title</Label>
            <Input className="mt-1 text-base h-12" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Display Stand" />
          </div>
          <div>
            <Label className="text-base font-semibold">Date</Label>
            <Input className="mt-1 text-base h-12" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-base font-semibold">Cost (€)</Label>
            <Input className="mt-1 text-base h-12" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full h-12 text-base font-bold">
            {saving && <Loader2 className="animate-spin mr-2" size={18} />}
            {saving ? (isEdit ? "Saving Changes…" : "Saving Expense…") : (isEdit ? "Save Changes" : "Save Expense")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
