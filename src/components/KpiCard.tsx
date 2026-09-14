import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badge?: {
    text: string;
    badgeClass: string;
  };
}

export const KpiCard: React.FC<KpiCardProps> = React.memo(
  ({ title, value, subtitle, icon: Icon, colorClass, bgClass, borderClass, badge }) => {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border ${borderClass} bg-slate-900/90 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-slate-700`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className={`p-2 rounded-lg ${bgClass}`}>
            <Icon className={`h-4 w-4 ${colorClass}`} />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
            {value}
          </div>
          {badge && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium border ${badge.badgeClass}`}
            >
              {badge.text}
            </span>
          )}
        </div>

        {subtitle && <p className="mt-1.5 text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>
    );
  }
);

KpiCard.displayName = 'KpiCard';
