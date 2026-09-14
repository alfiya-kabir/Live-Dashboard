import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = React.memo(
  ({ message = 'Connecting to live stream...' }) => {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 rounded-xl border border-slate-800">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">{message}</h3>
        <p className="text-xs text-slate-400 mt-1">
          Initializing WebSocket channel & backpressure buffer...
        </p>
      </div>
    );
  }
);

Loading.displayName = 'Loading';
