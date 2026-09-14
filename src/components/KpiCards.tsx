import React, { useMemo } from 'react';
import { Layers, CheckCircle2, AlertTriangle, AlertOctagon, Zap, HeartPulse } from 'lucide-react';
import { MonitoringEvent } from '../types/event';
import { KpiCard } from './KpiCard';
import { calculateKpiMetrics, formatNumber } from '../utils/helpers';
import { STATUS_CONFIG } from '../utils/constants';

interface KpiCardsProps {
  events: readonly MonitoringEvent[];
  eventsPerSec: number;
}

export const KpiCards: React.FC<KpiCardsProps> = React.memo(({ events, eventsPerSec }) => {
  const kpis = useMemo(() => {
    return calculateKpiMetrics(events, eventsPerSec);
  }, [events, eventsPerSec]);

  const healthyPct =
    kpis.totalEvents > 0
      ? Math.round((kpis.healthyCount / kpis.totalEvents) * 100)
      : 0;
  const warningPct =
    kpis.totalEvents > 0
      ? Math.round((kpis.warningCount / kpis.totalEvents) * 100)
      : 0;
  const criticalPct =
    kpis.totalEvents > 0
      ? Math.round((kpis.criticalCount / kpis.totalEvents) * 100)
      : 0;

  const statusConfig = STATUS_CONFIG[kpis.overallStatus];

  return (
    <section aria-label="Key Performance Indicators" className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* Total Events */}
      <KpiCard
        title="Total Ingested"
        value={formatNumber(kpis.totalEvents)}
        subtitle="Bounded sliding window"
        icon={Layers}
        colorClass="text-cyan-400"
        bgClass="bg-cyan-500/10"
        borderClass="border-slate-800"
        badge={{
          text: '500 max',
          badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        }}
      />

      {/* Healthy Events */}
      <KpiCard
        title="Healthy Events"
        value={formatNumber(kpis.healthyCount)}
        subtitle={`${healthyPct}% of buffered telemetry`}
        icon={CheckCircle2}
        colorClass="text-emerald-400"
        bgClass="bg-emerald-500/10"
        borderClass="border-slate-800"
        badge={{
          text: `${healthyPct}%`,
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        }}
      />

      {/* Warning Events */}
      <KpiCard
        title="Warnings"
        value={formatNumber(kpis.warningCount)}
        subtitle={`${warningPct}% elevated metrics`}
        icon={AlertTriangle}
        colorClass="text-amber-400"
        bgClass="bg-amber-500/10"
        borderClass="border-slate-800"
        badge={{
          text: `${warningPct}%`,
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        }}
      />

      {/* Critical Events */}
      <KpiCard
        title="Critical"
        value={formatNumber(kpis.criticalCount)}
        subtitle={`${criticalPct}% error anomalies`}
        icon={AlertOctagon}
        colorClass="text-rose-400"
        bgClass="bg-rose-500/10"
        borderClass="border-slate-800"
        badge={{
          text: `${criticalPct}%`,
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        }}
      />

      {/* Ingestion Rate */}
      <KpiCard
        title="Ingestion Rate"
        value={`${kpis.eventsPerSec}`}
        subtitle="Events per second"
        icon={Zap}
        colorClass="text-blue-400"
        bgClass="bg-blue-500/10"
        borderClass="border-slate-800"
        badge={{
          text: 'Live rate',
          badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        }}
      />

      {/* Overall Status */}
      <KpiCard
        title="System Status"
        value={statusConfig.label}
        subtitle={`Avg Metric: ${kpis.avgMetric}ms`}
        icon={HeartPulse}
        colorClass={statusConfig.textClass}
        bgClass={statusConfig.badgeClass}
        borderClass="border-slate-800"
        badge={{
          text: statusConfig.icon,
          badgeClass: statusConfig.badgeClass,
        }}
      />
    </section>
  );
});

KpiCards.displayName = 'KpiCards';
