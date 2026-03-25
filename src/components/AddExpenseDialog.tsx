import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Expense } from "@/lib/store";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { id?: string | number; title: string; date: string; cost: number }) => void;
  editExpense?: Expense | null;
}

const AddExpenseDialog = ({ open, onClose, onAdd, editExpense }: Props) => {
  const today = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (open && editExpense) {
      setTitle(editExpense.title);
      setDate(editExpense.date);
      setCost(editExpense.cost.toString());
    } else if (open && !editExpense) {
      resetForm();
    }
  }, [open, editExpense]);

  const resetForm = () => {
    setTitle("");
    setDate(today);
    setCost("");
  };

  const handleSubmit = async () => {
    try {
      if (!title || !cost) {
        toast.error("Please fill in all required fields", { duration: 2500 });
        return;
      }

      setSaving(true);

      const method = editExpense ? "PUT" : "POST";
      const payload = {
        ...(editExpense && { id: editExpense.id }),
        title,
        date,
        cost: parseFloat(cost),
      };

      const response = await fetch("/api/expenses", {
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
        toast.success(editExpense ? "Expense updated successfully!" : "Expense added successfully!", { duration: 2500 });

        const finalPayload = editExpense ? payload : { ...payload, id: data.id };
        onAdd(finalPayload);

        resetForm();
        onClose();
      } else {
        toast.error(data.message || "Failed to save expense", { duration: 2500 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error", { duration: 2500 });
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!editExpense;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent
        className="max-w-[90vw] rounded-2xl"
        onInteractOutside={(e) => saving && e.preventDefault()}
        onEscapeKeyDown={(e) => saving && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{isEdit ? t("edit_expense") : t("add_expense")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-base font-semibold">{t("title")}</Label>
            <Input disabled={saving} className="mt-1 text-base h-12" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("title_placeholder")} />
          </div>
          <div>
            <Label className="text-base font-semibold">{t("date")}</Label>
            <Input disabled={saving} className="mt-1 text-base h-12" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-base font-semibold">{t("cost")}</Label>
            <Input disabled={saving} className="mt-1 text-base h-12" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full h-12 text-base font-bold">
            {saving && <Loader2 className="animate-spin mr-2" size={18} />}
            {saving ? (isEdit ? t("saving_changes") : t("saving_expense")) : (isEdit ? t("save_changes") : t("save_expense"))}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;