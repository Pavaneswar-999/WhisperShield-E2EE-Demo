import React from 'react';

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'brand' | 'emerald' | 'indigo' | 'amber' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
  iconPosition?: 'left' | 'right';
  liquidWave?: boolean;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  liquidWave = true,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-5 py-2.5 text-xs font-semibold rounded-2xl gap-2',
    lg: 'px-7 py-3.5 text-sm font-bold rounded-2xl gap-2.5'
  }[size];

  const variantClasses = {
    // Primary: Apple / Linear style deep slate liquid pill with glossy sheen
    primary:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-liquid hover:shadow-liquid-hover border border-slate-700/50',
    // Brand: High-end Japanese Indigo & Steel Teal liquid button
    brand:
      'bg-gradient-to-r from-[#285C70] via-[#224D5F] to-[#1C3E4E] hover:from-[#326F86] hover:to-[#224D5F] text-white shadow-lg shadow-[#285C70]/30 border border-[#60899B]/40',
    // Secondary: Ultra-clean Star Dust frosted glass liquid button
    secondary:
      'bg-[#F2EDEA]/90 hover:bg-[#FFFAF8] text-charcoal-700 shadow-sm border border-[#D8D3D1] hover:border-[#60899B]/50 backdrop-blur-md dark:bg-white/[0.08] dark:hover:bg-white/[0.14] dark:text-neutral-100 dark:border-white/[0.1]',
    // Emerald: Cryptographic verified action with vivid mint/emerald liquid sheen
    emerald:
      'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-liquid-emerald border border-emerald-400/40',
    // Indigo: Ratchet & protocol action with violet/indigo liquid gradient
    indigo:
      'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-liquid-indigo border border-indigo-400/40',
    // Amber: Out-of-band / Safety Number action with warm honey/terracotta sheen
    amber:
      'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-liquid-amber border border-amber-300/40',
    // Ghost: Subtle hover-only liquid pill
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-neutral-300 border border-transparent hover:border-slate-200 dark:hover:border-white/[0.08]',
    // Dark: Sleek high-tech obsidian liquid pill
    dark:
      'bg-[#0f131a] hover:bg-[#161c26] text-slate-100 shadow-md border border-white/[0.1]'
  }[variant];

  return (
    <button
      {...props}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150 ease-out active:scale-[0.96] overflow-hidden select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${sizeClasses} ${variantClasses} ${className}`}
    >
      {/* Specular Liquid Light Reflection (Sweeping shimmer) */}
      {liquidWave && !disabled && (
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent z-10"
        />
      )}

      {/* Subtle top inner reflection border for liquid 3D depth */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />

      {/* Button Content */}
      <span className="relative z-20 flex items-center gap-2">
        {Icon && iconPosition === 'left' && (
          <Icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
        )}
        {children}
        {Icon && iconPosition === 'right' && (
          <Icon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        )}
      </span>
    </button>
  );
};

