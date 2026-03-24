import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, CalendarPlus, X } from "lucide-react";

interface AddPopupProps {
  open: boolean;
  onClose: () => void;
  onAddExpense: () => void;
  onAddEvent: () => void;
}

const AddPopup = ({ open, onClose, onAddExpense, onAddEvent }: AddPopupProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/30 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 inset-x-0 mx-auto -translate-x-1/2 z-50 bg-card rounded-2xl shadow-2xl p-5 w-[85vw] max-w-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onAddExpense(); onClose(); }}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-expense/10 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-expense flex items-center justify-center">
                  <ShoppingCart size={22} className="text-primary-foreground" />
                </div>
                <span className="font-bold text-sm">Add Expense</span>
              </button>
              <button
                onClick={() => { onAddEvent(); onClose(); }}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <CalendarPlus size={22} className="text-primary-foreground" />
                </div>
                <span className="font-bold text-sm">Add Event</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddPopup;
