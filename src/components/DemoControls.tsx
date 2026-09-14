import React, { useState } from 'react';
import {
  Sliders,
  Zap,
  Flame,
  ShieldAlert,
  WifiOff,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LiveStreamStats } from '../hooks/useLiveStream';

interface DemoControlsProps {
  currentRate: number;
  onSetRate: (rate: number) => void;
  onBurst: (count: number) => void;
  onInjectMalformed: () => void;
  onSimulateError: (msg?: string) => void;
  onClearEvents: () => void;
  stats: LiveStreamStats;
}

export const DemoControls: React.FC<DemoControlsProps> = React.memo(
  ({
    currentRate,
    onSetRate,
    onBurst,
    onInjectMalformed,
    onSimulateError,
    onClearEvents,
    stats,
  }) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    return (
      <aside
        aria-label="Technical Assessment and Stress Testing Controls"
        className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all"
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-850 flex items-center justify-between text-left transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">
              Technical Assessment & Stress Testing Controls
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Interactive Stress Sandbox
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Dropped/Rejected:</span>
              <span className="text-amber-400 font-bold">{stats.totalDropped}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Total Valid:</span>
              <span className="text-emerald-400 font-bold">{stats.totalReceived}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-4">
            <p className="text-xs text-slate-400">
              Use these development controls to evaluate the backpressure batching engine,
              reconnection exponential backoff, bounded memory capping, and untrusted payload validation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Stream Rate Selector */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    Continuous Ingestion Rate
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">{currentRate} eps</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[10, 25, 100, 500].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => onSetRate(rate)}
                      className={`py-1 rounded text-center font-mono font-medium transition-colors ${
                        currentRate === rate
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {rate}/s
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Batched to React state every 150ms regardless of frequency.
                </p>
              </div>

              {/* Instant Burst Generator */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    Instant Burst Injection
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[50, 200, 500].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => onBurst(count)}
                      className="py-1 px-2 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-center font-mono font-medium transition-colors"
                    >
                      +{count}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Simulates sudden telemetry spikes and tests memory bounds.
                </p>
              </div>

              {/* Resilience & Validation Controls */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  Security & Resilience
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onInjectMalformed}
                    className="flex-1 py-1 px-2 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-center font-medium transition-colors"
                    title="Inject corrupted objects to test strict type guard rejection"
                  >
                    Inject Bad Data
                  </button>

                  <button
                    type="button"
                    onClick={() => onSimulateError('Manual network simulation error')}
                    className="flex-1 py-1 px-2 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-center font-medium transition-colors"
                    title="Simulate network disconnect to trigger exponential backoff"
                  >
                    <WifiOff className="h-3 w-3 inline mr-1" />
                    Drop Network
                  </button>

                  <button
                    type="button"
                    onClick={onClearEvents}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                    title="Clear event buffer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Malformed packets are safely rejected by validate.ts.
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    );
  }
);

DemoControls.displayName = 'DemoControls';
