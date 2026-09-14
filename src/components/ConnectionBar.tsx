import React from 'react';
import { Play, Pause, RefreshCw, WifiOff } from 'lucide-react';
import { ConnectionStatus } from '../types/event';

interface ConnectionBarProps {
  status: ConnectionStatus;
  reconnectAttempts: number;
  eventsPerSec: number;
  onPause: () => void;
  onResume: () => void;
  onReconnect: () => void;
  onSimulateError: () => void;
}

export const ConnectionBar: React.FC<ConnectionBarProps> = React.memo(
  ({
    status,
    reconnectAttempts,
    eventsPerSec,
    onPause,
    onResume,
    onReconnect,
    onSimulateError,
  }) => {
    const isPaused = status === 'paused';
    const isLive = status === 'live';
    const isReconnecting = status === 'reconnecting';
    const isError = status === 'error';
    const isConnecting = status === 'connecting';

    return (
      <section
        aria-label="Connection Status Bar"
        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              {isLive && (
                <>
                  <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </>
              )}
              {isConnecting && (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 animate-pulse" />
              )}
              {isReconnecting && (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 animate-ping" />
              )}
              {isError && (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              )}
              {isPaused && (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400" />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {isLive && '🟢 Live Connection'}
                  {isConnecting && '🟡 Connecting...'}
                  {isReconnecting && (
                    <span className="text-amber-400">
                      🟠 Reconnecting (Attempt #{reconnectAttempts})...
                    </span>
                  )}
                  {isError && <span className="text-rose-400">🔴 Connection Interrupted</span>}
                  {isPaused && <span className="text-slate-300">⏸ Feed Paused by User</span>}
                </span>

                {isLive && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                    {eventsPerSec} eps
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isLive && 'Ingesting live distributed telemetry buffer via WebStream API'}
                {isConnecting && 'Establishing mock WebSocket/SSE transport channel'}
                {isReconnecting &&
                  'Exponential backoff active. Buffers preserved during retry.'}
                {isError && 'Transport failure. Click Reconnect to resume stream ingestion.'}
                {isPaused && 'Display state preserved. Click Resume to re-enable stream updates.'}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {isPaused ? (
              <button
                type="button"
                onClick={onResume}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                aria-label="Resume real-time data stream"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Resume Feed</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                disabled={!isLive}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 ${
                  isLive
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500/50'
                    : 'bg-slate-800/40 text-slate-500 border border-slate-800/50 cursor-not-allowed'
                }`}
                aria-label="Pause real-time data stream"
              >
                <Pause className="h-3.5 w-3.5" />
                <span>Pause Feed</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReconnect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
              aria-label="Reset and reconnect stream"
              title="Reset and reconnect socket connection"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
              <span>Reconnect</span>
            </button>

            {isLive && (
              <button
                type="button"
                onClick={onSimulateError}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                aria-label="Simulate connection drop"
                title="Simulate network fault to test automatic reconnection backoff"
              >
                <WifiOff className="h-3.5 w-3.5" />
                <span>Simulate Drop</span>
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }
);

ConnectionBar.displayName = 'ConnectionBar';
