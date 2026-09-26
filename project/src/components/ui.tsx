import type { ReactNode } from 'react';

export function Panel({
  children,
  className = '',
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`glass-panel ${className}`}>
      {label && (
        <div className="px-4 py-2.5 border-b border-navy-700/40 flex items-center justify-between">
          <span className="data-label">{label}</span>
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  accent = 'cyan',
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  accent?: 'cyan' | 'amber' | 'coral' | 'success';
}) {
  const accentMap = {
    cyan: 'text-cyan-400 border-cyan-500/20',
    amber: 'text-amber-400 border-amber-500/20',
    coral: 'text-coral-400 border-coral-500/20',
    success: 'text-success-400 border-success-500/20',
  };
  return (
    <div className={`glass-panel p-4 border-l-2 ${accentMap[accent]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="data-label">{label}</span>
        {icon && <div className={accentMap[accent].split(' ')[0]}>{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-navy-50 font-mono">{value}</div>
      {sublabel && <div className="text-xs text-navy-400 mt-1">{sublabel}</div>}
    </div>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value > 0.85 ? 'bg-coral-500' : value > 0.7 ? 'bg-amber-400' : 'bg-cyan-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-navy-700/60 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-navy-200 w-10 text-right">{pct}%</span>
    </div>
  );
}

export function Badge({
  children,
  color,
  bg,
}: {
  children: ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <span
      className="chip"
      style={{ color, backgroundColor: bg }}
    >
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-navy-400">
      <div className="w-12 h-12 rounded-full border-2 border-navy-700 border-dashed mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
