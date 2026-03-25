import { Bell, BarChart3, Clock, TrendingUp, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BottomNavProps {
  active: number;
  onNavigate: (page: number) => void;
  onFabClick: () => void;
}

const tabs = [
  { icon: Bell, labelKey: "reminders_title" },
  { icon: BarChart3, labelKey: "summary_title" },
  { icon: Clock, labelKey: "history_title" },
  { icon: TrendingUp, labelKey: "statistics_title" },
];

const BottomNav = ({ active, onNavigate, onFabClick }: BottomNavProps) => {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav border-t border-border z-50">
      {/* AGGIUNTO 'px-3' QUI SOTTO PER STRINGERE I BOTTONI VERSO IL CENTRO */}
      <div className="max-w-lg mx-auto grid grid-cols-5 items-end relative h-20 px-3">
        
        {tabs.slice(0, 2).map((tab, i) => {
          const isActive = active === i;
          return (
            <button
              key={tab.labelKey}
              onClick={() => onNavigate(i)}
              className={`flex flex-col items-center justify-center gap-0.5 pt-2 pb-5 transition-colors ${
                isActive ? "text-nav-active" : "text-nav-inactive"
              }`}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-semibold">{t(tab.labelKey)}</span>
            </button>
          );
        })}

        <div className="flex items-center justify-center relative">
          <button
            onClick={onFabClick}
            className="absolute -top-[88px] w-[70px] h-[70px] rounded-full bg-fab text-fab-foreground shadow-xl flex items-center justify-center active:scale-95 transition-transform border-4 border-background"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        {tabs.slice(2).map((tab, i) => {
          const idx = i + 2;
          const isActive = active === idx;
          return (
            <button
              key={tab.labelKey}
              onClick={() => onNavigate(idx)}
              className={`flex flex-col items-center justify-center gap-0.5 pt-2 pb-5 transition-colors ${
                isActive ? "text-nav-active" : "text-nav-inactive"
              }`}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-semibold">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;