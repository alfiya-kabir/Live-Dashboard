import React from 'react';
import { MonitoringEvent } from '../types/event';
import { formatTimestamp } from '../utils/helpers';
import { STATUS_CONFIG } from '../utils/constants';

interface EventRowProps {
  event: MonitoringEvent;
  style?: React.CSSProperties;
}

export const EventRow: React.FC<EventRowProps> = React.memo(({ event, style }) => {
  const statusCfg = STATUS_CONFIG[event.status];

  // Visual latency bar indicator calculation (capped at 100%)
  const latencyPct = Math.min(100, Math.round((event.metric / 800) * 100));

  return (
    <div
      style={style}
      role="row"
      className="flex items-center px-4 py-2.5 border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors text-xs font-sans group"
    >
      {/* Timestamp */}
      <div role="cell" className="w-28 sm:w-32 flex-shrink-0 font-mono text-slate-400">
        {formatTimestamp(event.timestamp)}
      </div>

      {/* Service */}
      <div role="cell" className="w-32 sm:w-36 flex-shrink-0 font-medium text-slate-200 truncate pr-2">
        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300">
          {event.service}
        </span>
      </div>

      {/* Status Badge */}
      <div role="cell" className="w-24 sm:w-28 flex-shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.badgeClass}`}
        >
          <span className="text-[9px]">{statusCfg.icon}</span>
          <span>{statusCfg.label}</span>
        </span>
      </div>

      {/* Metric (Latency / CPU) */}
      <div role="cell" className="w-28 sm:w-32 flex-shrink-0 pr-3">
        <div className="flex items-center justify-between font-mono mb-1">
          <span
            className={
              event.status === 'critical'
                ? 'text-rose-400 font-bold'
                : event.status === 'warning'
                ? 'text-amber-400 font-medium'
                : 'text-emerald-400 font-medium'
            }
          >
            {event.metric} ms
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
          <div
            className={`h-full rounded-full ${statusCfg.bgClass}`}
            style={{ width: `${latencyPct}%` }}
          />
        </div>
      </div>

      {/* Message - Strict Plain Text Rendering to Prevent XSS */}
      <div
        role="cell"
        className="flex-1 min-w-0 text-slate-300 font-mono text-[11px] truncate group-hover:text-white"
        title={event.message}
      >
        {/* DO NOT USE dangerouslySetInnerHTML. Safe text node rendering only: */}
        <span>{event.message}</span>
      </div>
    </div>
  );
});

EventRow.displayName = 'EventRow';
