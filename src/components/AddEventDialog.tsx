import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin, Link as LinkIcon } from "lucide-react";
import { MarketEvent, useAppData } from "@/lib/store";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { id?: string | number; name: string; location: string; date: string; participationCost: number; alreadyPaid: boolean; income?: number | null; mapsLink?: string }) => void;
  editEvent?: MarketEvent | null;
}

const AddEventDialog = ({ open, onClose, onAdd, editEvent }: Props) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [date, setDate] = useState("");
  const [cost, setCost] = useState("");
  const [paid, setPaid] = useState(false);
  const [income, setIncome] = useState("");
  const [saving, setSaving] = useState(false);

  const [comuni, setComuni] = useState<string[]>([]);
  const [showComuni, setShowComuni] = useState(false);
  const [showEventNames, setShowEventNames] = useState(false);

  const { t } = useTranslation();
  const { events } = useAppData();

  const existingEventNames = useMemo(() => {
    const names = events.map(e => e.name).filter(n => n && n.trim() !== "");
    return Array.from(new Set(names)).sort();
  }, [events]);

  const filteredEventNames = useMemo(() => {
    if (!name) return existingEventNames.slice(0, 50);
    return existingEventNames
      .filter(n => n.toLowerCase().includes(name.toLowerCase()))
      .slice(0, 50);
  }, [existingEventNames, name]);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json")
      .then(res => res.json())
      .then(data => {
        const nomi = data.map((c: any) => c.nome).sort();
        setComuni(nomi);
      })
      .catch(err => console.error("Error loading municipalities", err));
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
    setMapsLink("");
    setDate("");
    setCost("");
    setPaid(false);
    setIncome("");
    setShowComuni(false);
    setShowEventNames(false);
  };

  useEffect(() => {
    if (open && editEvent) {
      setName(editEvent.name || "");
      setLocation(editEvent.location || "");
      setMapsLink(editEvent.mapsLink || "");
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
      if (!date) {
        toast.error(t("missing_date"), { duration: 2500 });
        return;
      }

      const finalName = name.trim();
      const finalLocation = location.trim();

      if (!finalName && !finalLocation) {
        toast.error(t("name_or_location_required"), { duration: 2500 });
        return;
      }

      setSaving(true);

      const isEdit = !!editEvent;
      const method = isEdit ? "PUT" : "POST";

      const parsedCost = cost.trim() === "" ? 0 : parseFloat(cost) || 0;
      const finalPaid = parsedCost === 0 ? true : paid;

      const payload: any = {
        name: finalName,
        location: finalLocation,
        mapsLink: mapsLink.trim(),
        date,
        participationCost: parsedCost,
        alreadyPaid: finalPaid,
      };

      if (isEdit) {
        payload.id = editEvent?.id;
        payload.income = income ? parseFloat(income) : null;
        payload.reminder = editEvent?.reminder;
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
        toast.error(t("wrong_pin"), { duration: 2500 });
        onClose();
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success(isEdit ? t("update_event_success") : t("add_event_success"), { duration: 2500 });

        const finalPayload = isEdit ? payload : { ...payload, id: data.id };
        onAdd(finalPayload);

        resetForm();
        onClose();
      } else {
        toast.error(data.message || t("failed_save_event"), { duration: 2500 });
      }
    } catch (err) {
      console.error(err);
      toast.error(t("server_error"), { duration: 2500 });
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!editEvent;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent
        className="max-w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => saving && e.preventDefault()}
        onEscapeKeyDown={(e) => saving && e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{isEdit ? t("edit_market_event") : t("add_market_event")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">

          <div className="relative">
            <Label className="text-base font-semibold">{t("event_name")} <span className="text-muted-foreground font-normal text-sm">{t("optional")}</span></Label>
            <div className="relative mt-1">
              <Input
                disabled={saving}
                className="text-base h-12 w-full"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowEventNames(true);
                }}
                onFocus={() => setShowEventNames(true)}
                onBlur={() => setTimeout(() => setShowEventNames(false), 200)}
                placeholder={t("event_name_placeholder")}
                autoComplete="off"
              />
            </div>

            {showEventNames && filteredEventNames.length > 0 && (
              <div className="absolute z-[100] w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md max-h-56 overflow-y-auto">
                {filteredEventNames.map(n => (
                  <div
                    key={n}
                    className="px-3 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer text-base transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setName(n);
                      setShowEventNames(false);
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Label className="text-base font-semibold">{t("location")} <span className="text-muted-foreground font-normal text-sm">{t("optional")}</span></Label>
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
                placeholder={t("location_placeholder")}
                autoComplete="off"
              />
            </div>

            {showComuni && (
              <div className="absolute z-[100] w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md max-h-56 overflow-y-auto">
                {filteredComuni.length > 0 ? (
                  filteredComuni.map(c => (
                    <div
                      key={c}
                      className="px-3 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer text-base transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setLocation(c);
                        setShowComuni(false);
                      }}
                    >
                      {c}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-center text-muted-foreground">{t("no_location_found")}</div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label className="text-base font-semibold">{t("maps_url")} <span className="text-muted-foreground font-normal text-sm">{t("optional")}</span></Label>
            <div className="relative mt-1">
              <LinkIcon className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
              <Input disabled={saving} className="pl-10 mt-1 text-base h-12" value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder={t("maps_url_placeholder")} />
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold">{t("date")}</Label>
            <Input disabled={saving} className="mt-1 text-base h-12" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-base font-semibold">{t("participation_cost")} <span className="text-muted-foreground font-normal text-sm">{t("optional")}</span></Label>
            <Input disabled={saving} className="mt-1 text-base h-12" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
          </div>

          {isEdit && (
            <div>
              <Label className="text-base font-semibold text-primary">{t("income")}</Label>
              <Input
                disabled={saving}
                className="mt-1 text-base h-12 border-primary/50 bg-primary/5"
                type="number"
                step="0.01"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder={`0.00 (${t("leave_empty_to_remove")})`}
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Checkbox disabled={saving || (cost.trim() === "" || parseFloat(cost) === 0)} id="paid" checked={cost.trim() === "" || parseFloat(cost) === 0 ? true : paid} onCheckedChange={(v) => setPaid(!!v)} className="w-6 h-6" />
            <Label htmlFor="paid" className={`text-base font-semibold cursor-pointer ${saving || (cost.trim() === "" || parseFloat(cost) === 0) ? "opacity-50" : ""}`}>{t("already_paid")}</Label>
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full h-12 text-base font-bold mt-2">
            {saving && <Loader2 className="animate-spin mr-2" size={18} />}
            {saving ? (isEdit ? t("saving_changes") : t("saving_event")) : (isEdit ? t("save_changes") : t("save_event"))}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;