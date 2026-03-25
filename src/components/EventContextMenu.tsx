import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void> | void;
  position: { x: number; y: number };
}

const EventContextMenu = ({ open, onClose, onEdit, onDelete, position }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useTranslation();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className={`fixed inset-0 z-[100] transition-colors ${isDeleting ? "bg-background/50 cursor-wait" : ""}`}
            onClick={() => !isDeleting && onClose()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[101] bg-card rounded-xl shadow-xl border border-border overflow-hidden"
            style={{ top: Math.min(position.y, window.innerHeight - 120), left: Math.min(position.x, window.innerWidth - 160) }}
          >
            <button
              disabled={isDeleting}
              onClick={() => { onEdit(); onClose(); }}
              className="flex items-center gap-3 px-5 py-3 w-full text-left hover:bg-muted active:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil size={18} /> <span className="font-semibold">{t("edit")}</span>
            </button>
            <button
              disabled={isDeleting}
              onClick={handleDelete}
              className="flex items-center gap-3 px-5 py-3 w-full text-left hover:bg-muted active:bg-accent text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              <span className="font-semibold">{isDeleting ? t("deleting") : t("delete")}</span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventContextMenu;