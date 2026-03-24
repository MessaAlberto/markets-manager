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
  eventName: string;
  onAdd: (income: number) => void;
}

const AddIncomeDialog = ({ open, onClose, eventName, onAdd }: Props) => {
  const [income, setIncome] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    try {
      if (!income) {
        toast.error("Please enter an income amount", { duration: 2500 });
        return;
      }
      setSaving(true);
      await new Promise(r => setTimeout(r, 400));
      onAdd(parseFloat(income));
      setIncome("");
      toast.success("Income added!", { duration: 2500 });
      onClose();
    } catch {
      toast.error("Failed to add income", { duration: 2500 });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[90vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Income</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">For: <strong>{eventName}</strong></p>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-base font-semibold">Income (€)</Label>
            <Input className="mt-1 text-base h-12" type="number" step="0.01" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0.00" />
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
