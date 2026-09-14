import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { FilterState, EventStatus, TimeWindow } from '../types/event';
import { SERVICES, TIME_WINDOWS } from '../utils/constants';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  filteredCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = React.memo(
  ({ filters, onFilterChange, onReset, filteredCount, totalCount }) => {
    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({ ...filters, service: e.target.value });
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({
        ...filters,
        status: e.target.value as 'all' | EventStatus,
      });
    };

    const handleTimeWindowChange = (timeWindow: TimeWindow) => {
      onFilterChange({ ...filters, timeWindow });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ ...filters, searchQuery: e.target.value });
    };

    const isFiltered =
      filters.service !== 'all' ||
      filters.status !== 'all' ||
      filters.timeWindow !== 'all' ||
      filters.searchQuery.trim().length > 0;

    return (
      <section
        aria-label="Event Filtering Controls"
        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              placeholder="Search message text, IDs, or services..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors"
              aria-label="Search events"
            />
          </div>

          {/* Select Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Service Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="service-select" className="text-xs text-slate-400 font-medium">
                Service:
              </label>
              <select
                id="service-select"
                value={filters.service}
                onChange={handleServiceChange}
                className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors"
              >
                <option value="all">All Services</option>
                {SERVICES.map((svc) => (
                  <option key={svc} value={svc}>
                    {svc}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="status-select" className="text-xs text-slate-400 font-medium">
                Status:
              </label>
              <select
                id="status-select"
                value={filters.status}
                onChange={handleStatusChange}
                className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="healthy">🟢 Healthy</option>
                <option value="warning">🟡 Warning</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-medium transition-colors ml-auto lg:ml-0"
                aria-label="Reset all filters"
                title="Reset all filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Time Window Buttons and Match Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Time Window:
            </span>
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              {TIME_WINDOWS.map((win) => (
                <button
                  key={win.value}
                  type="button"
                  onClick={() => handleTimeWindowChange(win.value)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    filters.timeWindow === win.value
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {win.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            Showing <span className="text-cyan-300 font-semibold">{filteredCount}</span> of{' '}
            <span className="text-slate-300">{totalCount}</span> buffered events
          </div>
        </div>
      </section>
    );
  }
);

FilterBar.displayName = 'FilterBar';
