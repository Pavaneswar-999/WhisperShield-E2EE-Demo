import React, { useState, useRef, useEffect } from 'react';

export interface JellyRadioItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface JellyRadioProps {
  items: JellyRadioItem[] | string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string, index: number) => void;
  chipColor?: string;
  activeColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: 'sm' | 'md' | 'lg';
  gap?: number;
  radius?: number;
  disabled?: boolean;
  className?: string;
}

export const JellyRadio: React.FC<JellyRadioProps> = ({
  items,
  defaultValue,
  value: controlledValue,
  onChange,
  size = 'md',
  gap = 6,
  radius = 16,
  disabled = false,
  className = ''
}) => {
  // Normalize items
  const parsedItems: JellyRadioItem[] = Array.isArray(items)
    ? items
    : [
        { value: 'all', label: 'All Channels' },
        { value: 'active', label: 'Double Ratchet' },
        { value: 'initial', label: 'X3DH Handshakes' }
      ];

  const initialVal = controlledValue ?? defaultValue ?? parsedItems[0]?.value ?? '';
  const [selected, setSelected] = useState<string>(initialVal);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; height: number }>({
    left: 0,
    width: 0,
    height: 0
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const currentVal = controlledValue ?? selected;

  useEffect(() => {
    const btn = buttonRefs.current.get(currentVal);
    const container = containerRef.current;
    if (btn && container) {
      const btnRect = btn.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      setPillStyle({
        left: btnRect.left - contRect.left,
        width: btnRect.width,
        height: btnRect.height
      });
    }
  }, [currentVal, items]);

  const handleSelect = (item: JellyRadioItem, index: number) => {
    if (item.disabled || disabled) return;
    if (!controlledValue) {
      setSelected(item.value);
    }
    onChange?.(item.value, index);
  };

  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3',
    md: 'text-xs font-semibold py-2 px-4',
    lg: 'text-sm font-bold py-2.5 px-5'
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md select-none ${className}`}
      style={{ gap: `${gap}px`, borderRadius: `${radius}px` }}
    >
      {/* Animated Elastic Jelly Floating Pill Indicator */}
      <span
        className="absolute top-1 rounded-xl bg-white dark:bg-white/[0.14] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
        style={{
          left: `${pillStyle.left}px`,
          width: `${pillStyle.width}px`,
          height: `${pillStyle.height}px`,
          borderRadius: `${Math.max(8, radius - 4)}px`
        }}
      />

      {parsedItems.map((item, idx) => {
        const isActive = item.value === currentVal;
        return (
          <button
            key={item.value}
            ref={(el) => {
              if (el) buttonRefs.current.set(item.value, el);
              else buttonRefs.current.delete(item.value);
            }}
            type="button"
            disabled={item.disabled || disabled}
            onClick={() => handleSelect(item, idx)}
            className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${
              isActive
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {item.icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default JellyRadio;

