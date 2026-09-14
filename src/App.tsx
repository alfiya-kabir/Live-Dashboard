import React, { useState, useMemo, useCallback } from 'react';
import { useLiveStream } from './hooks/useLiveStream';
import { useDebounce } from './hooks/useDebounce';
import { FilterState, MonitoringEvent } from './types/event';
import { TIME_WINDOWS } from './utils/constants';
import { Header } from './components/Header';
import { ConnectionBar } from './components/ConnectionBar';
import { KpiCards } from './components/KpiCards';
import { LiveChart } from './components/LiveChart';
import { FilterBar } from './components/FilterBar';
import { EventsList } from './components/EventsList';
import { DemoControls } from './components/DemoControls';
import { Loading } from './components/Loading';
import { ErrorState } from './components/ErrorState';

const INITIAL_FILTERS: FilterState = {
  service: 'all',
  status: 'all',
  timeWindow: 'all',
  searchQuery: '',
};

export const App: React.FC = () => {
  const {
    events,
    status,
    stats,
    currentRate,
    pause,
    resume,
    reconnect,
    setRate,
    burst,
    injectMalformed,
    simulateError,
    clearEvents,
  } = useLiveStream();

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Debounce search query so text typing does not cause laggy filtering
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 200);

  // Filter events derived with useMemo without mutating underlying bounded events
  const filteredEvents = useMemo(() => {
    let result: readonly MonitoringEvent[] = events;

    // Time window filter
    if (filters.timeWindow !== 'all') {
      const windowCfg = TIME_WINDOWS.find((w) => w.value === filters.timeWindow);
      if (windowCfg && Number.isFinite(windowCfg.durationMs)) {
        const cutoffTime = Date.now() - windowCfg.durationMs;
        result = result.filter((e) => e.timestamp >= cutoffTime);
      }
    }

    // Service filter
    if (filters.service !== 'all') {
      result = result.filter((e) => e.service === filters.service);
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter((e) => e.status === filters.status);
    }

    // Search query filter (search across message, service, and id)
    if (debouncedSearchQuery.trim().length > 0) {
      const queryLower = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.message.toLowerCase().includes(queryLower) ||
          e.service.toLowerCase().includes(queryLower) ||
          e.id.toLowerCase().includes(queryLower)
      );
    }

    return result;
  }, [events, filters.timeWindow, filters.service, filters.status, debouncedSearchQuery]);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  // Initial loading view if connecting and no events arrived yet
  const isInitialLoading = status === 'connecting' && events.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Connection Bar */}
        <ConnectionBar
          status={status}
          reconnectAttempts={stats.reconnectAttempts}
          eventsPerSec={stats.eventsPerSec}
          onPause={pause}
          onResume={resume}
          onReconnect={reconnect}
          onSimulateError={simulateError}
        />

        {/* Initial Loading or Error Fallbacks */}
        {isInitialLoading ? (
          <Loading message="Establishing high-frequency telemetry stream..." />
        ) : status === 'error' && events.length === 0 ? (
          <ErrorState
            title="Unable to connect to live stream"
            message="The telemetry gateway cannot be reached. Retrying automatically..."
            onRetry={reconnect}
          />
        ) : (
          <>
            {/* KPI Analytic Cards */}
            <KpiCards events={events} eventsPerSec={stats.eventsPerSec} />

            {/* Live Metric Time-Series Chart */}
            <LiveChart events={events} />

            {/* Event Filters */}
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              filteredCount={filteredEvents.length}
              totalCount={events.length}
            />

            {/* Virtualized Recent Events List */}
            <EventsList
              events={filteredEvents}
              totalUnfilteredCount={events.length}
              onResetFilters={handleResetFilters}
            />
          </>
        )}

        {/* Stress Testing & Technical Demo Sandbox (Collapsible) */}
        <DemoControls
          currentRate={currentRate}
          onSetRate={setRate}
          onBurst={burst}
          onInjectMalformed={injectMalformed}
          onSimulateError={simulateError}
          onClearEvents={clearEvents}
          stats={stats}
        />
      </main>

      <footer className="border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-400">
        Live Monitoring Dashboard &bull; React 18 &bull; TypeScript &bull; Vite &bull; Tailwind CSS
        &bull; 60fps Backpressure Engine
      </footer>
    </div>
  );
};
export default App;
