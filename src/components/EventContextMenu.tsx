import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  position: { x: number; y: number };
}

const EventContextMenu = ({ open, onClose, onEdit, onDelete, position }: Props) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-card rounded-xl shadow-xl border border-border overflow-hidden"
            style={{ top: Math.min(position.y, window.innerHeight - 120), left: Math.min(position.x, window.innerWidth - 160) }}
          >
            <button onClick={() => { onEdit(); onClose(); }} className="flex items-center gap-3 px-5 py-3 w-full text-left hover:bg-muted active:bg-accent transition-colors">
              <Pencil size={18} /> <span className="font-semibold">Edit</span>
            </button>
            <button onClick={() => { onDelete(); onClose(); }} className="flex items-center gap-3 px-5 py-3 w-full text-left hover:bg-muted active:bg-accent text-destructive transition-colors">
              <Trash2 size={18} /> <span className="font-semibold">Delete</span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventContextMenu;
