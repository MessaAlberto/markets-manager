import { Bell, BarChart3, Clock, TrendingUp, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomNavProps {
  active: number;
  onNavigate: (page: number) => void;
  onFabClick: () => void;
}

const tabs = [
  { icon: Bell, label: "Reminders" },
  { icon: BarChart3, label: "Summary" },
  { icon: Clock, label: "History" },
  { icon: TrendingUp, label: "Stats" },
];

const BottomNav = ({ active, onNavigate, onFabClick }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav border-t border-border z-50">
      <div className="max-w-lg mx-auto grid grid-cols-5 items-end relative h-16">
        {tabs.slice(0, 2).map((tab, i) => {
          const isActive = active === i;
          return (
            <button
              key={tab.label}
              onClick={() => onNavigate(i)}
              className={`flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 transition-colors ${
                isActive ? "text-nav-active" : "text-nav-inactive"
              }`}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-semibold">{tab.label}</span>
            </button>
          );
        })}

        <div className="flex items-center justify-center relative">
          <button
            onClick={onFabClick}
            className="absolute -top-[75px] w-[70px] h-[70px] rounded-full bg-fab text-fab-foreground shadow-xl flex items-center justify-center active:scale-95 transition-transform border-4 border-background"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        {tabs.slice(2).map((tab, i) => {
          const idx = i + 2;
          const isActive = active === idx;
          return (
            <button
              key={tab.label}
              onClick={() => onNavigate(idx)}
              className={`flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 transition-colors ${
                isActive ? "text-nav-active" : "text-nav-inactive"
              }`}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;