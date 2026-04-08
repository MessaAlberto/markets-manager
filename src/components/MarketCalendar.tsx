import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MarketEvent } from "@/lib/store";
import { useTranslation } from "react-i18next";

interface Props {
  events: MarketEvent[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

const MarketCalendar = ({ events, selectedDate, onSelectDate }: Props) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { i18n } = useTranslation();
  
  // Sceglie la localizzazione corretta per i nomi dei mesi (Gennaio, January...)
  const locale = i18n.language === 'it' ? it : enUS;

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  // Inizia la settimana di lunedì (weekStartsOn: 1)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = i18n.language === 'it' 
    ? ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] 
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-card rounded-xl p-4 border border-border shadow-sm mb-4">
      {/* Header Calendario */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-full bg-muted hover:bg-accent active:scale-95 transition-transform">
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-bold text-lg capitalize">{format(currentMonth, "MMMM yyyy", { locale })}</h2>
        <button onClick={nextMonth} className="p-1.5 rounded-full bg-muted hover:bg-accent active:scale-95 transition-transform">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Giorni della settimana */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-xs font-extrabold text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Griglia dei giorni */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const isCurrentMonth = isSameMonth(d, monthStart);
          const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
          // Cerca se c'è almeno un evento in questo giorno
          const hasEvent = events.some(e => isSameDay(new Date(e.date), d));
          const isDayToday = isToday(d);

          return (
            <div
              key={i}
              onClick={() => onSelectDate(isSelected ? null : d)}
              className={`
                relative flex items-center justify-center h-10 rounded-lg text-sm cursor-pointer transition-all
                ${!isCurrentMonth ? "text-muted-foreground/30" : "text-foreground"}
                ${isSelected ? "bg-primary text-primary-foreground font-bold shadow-md scale-105 z-10" : "hover:bg-muted active:scale-95"}
                ${isDayToday && !isSelected ? "border-2 border-primary text-primary font-extrabold" : ""}
              `}
            >
              <span>{format(d, "d")}</span>
              
              {/* Pallino che indica un mercatino */}
              {hasEvent && (
                <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-income"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketCalendar;