import { useRef, useEffect, useCallback } from "react";

interface WheelPickerProps {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const WheelPicker = ({ items, value, onChange, height }: WheelPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerHeight = height || ITEM_HEIGHT * VISIBLE_ITEMS;
  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);

  const selectedIndex = items.findIndex(i => i.value === value);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const currentScroll = containerRef.current.scrollTop;
    const targetScroll = (selectedIndex >= 0 ? selectedIndex : 0) * ITEM_HEIGHT;
    
    if (Math.abs(currentScroll - targetScroll) > ITEM_HEIGHT / 2) {
      containerRef.current.scrollTop = targetScroll;
    }
  }, [selectedIndex]);

  const handleScrollEnd = useCallback(() => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const idx = Math.round(scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    
    if (items[clamped] && items[clamped].value !== value) {
      onChange(items[clamped].value);
    }
  }, [items, value, onChange]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    let timeout: ReturnType<typeof setTimeout>;
    
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleScrollEnd, 150);
    };
    
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timeout);
    };
  }, [handleScrollEnd]);

  return (
    <div className="relative rounded-xl bg-muted overflow-hidden" style={{ height: pickerHeight }}>
      <div
        className="absolute left-2 right-2 rounded-lg bg-primary/10 border border-primary/20 pointer-events-none z-10"
        style={{
          top: paddingItems * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
        }}
      />
      
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-muted to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-muted to-transparent z-20 pointer-events-none" />

      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {Array.from({ length: paddingItems }).map((_, i) => (
          <div key={`top-${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}
        
        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={item.value}
              className={`flex items-center justify-center transition-all duration-150 cursor-pointer select-none ${
                isSelected ? "text-foreground font-bold text-lg" : "text-muted-foreground text-base opacity-60"
              }`}
              style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center" }}
              onClick={() => {
                onChange(item.value);
                containerRef.current?.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
              }}
            >
              {item.label}
            </div>
          );
        })}
        
        {Array.from({ length: paddingItems }).map((_, i) => (
          <div key={`bot-${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}
      </div>
    </div>
  );
};

export default WheelPicker;