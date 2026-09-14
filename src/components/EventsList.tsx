import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { MonitoringEvent } from '../types/event';
import { EventRow } from './EventRow';
import { EmptyState } from './EmptyState';
import { ListFilter, ShieldCheck } from 'lucide-react';
import { MAX_EVENTS } from '../utils/constants';

interface EventsListProps {
  events: readonly MonitoringEvent[];
  totalUnfilteredCount: number;
  onResetFilters?: () => void;
}

export const EventsList: React.FC<EventsListProps> = React.memo(
  ({ events, totalUnfilteredCount, onResetFilters }) => {
    return (
      <section
        aria-label="Recent Monitoring Events"
        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col"
      >
        {/* Table Header Bar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Live Event Stream</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {events.length} {events.length === 1 ? 'event' : 'events'}
              {events.length !== totalUnfilteredCount && ` (filtered from ${totalUnfilteredCount})`}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70" />
              XSS Sanitized
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Limit: {MAX_EVENTS} bounded
            </span>
          </div>
        </div>

        {/* Scrollable Container with Fixed Column Headers */}
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Column Headers */}
            <div
              role="row"
              className="flex items-center px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
            >
              <div role="columnheader" className="w-28 sm:w-32 flex-shrink-0">
                Timestamp
              </div>
              <div role="columnheader" className="w-32 sm:w-36 flex-shrink-0 pr-2">
                Service
              </div>
              <div role="columnheader" className="w-24 sm:w-28 flex-shrink-0">
                Status
              </div>
              <div role="columnheader" className="w-28 sm:w-32 flex-shrink-0 pr-3">
                Metric (Latency)
              </div>
              <div role="columnheader" className="flex-1 min-w-0">
                Telemetry Message
              </div>
            </div>

            {/* Virtualized Rows or Empty State */}
            {events.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No matching events"
                  message={
                    totalUnfilteredCount > 0
                      ? 'No events match the active filter criteria. Try adjusting or resetting filters.'
                      : 'Waiting for monitoring events to arrive from the live stream...'
                  }
                  actionLabel={totalUnfilteredCount > 0 ? 'Clear Filters' : undefined}
                  onAction={onResetFilters}
                />
              </div>
            ) : (
              <List
                height={480}
                itemCount={events.length}
                itemSize={44}
                width="100%"
                className="scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-900"
              >
                {({ index, style }) => (
                  <EventRow key={events[index].id} event={events[index]} style={style} />
                )}
              </List>
            )}
          </div>
        </div>
      </section>
    );
  }
);

EventsList.displayName = 'EventsList';
