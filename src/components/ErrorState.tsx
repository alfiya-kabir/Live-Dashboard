import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = React.memo(
  ({
    title = 'Connection interrupted',
    message = 'Unable to establish streaming transport. Attempting to reconnect...',
    onRetry,
  }) => {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-rose-500/5 rounded-xl border border-rose-500/20">
        <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-rose-300">{title}</h3>
        <p className="text-xs text-rose-400/80 max-w-sm mt-1 mb-4">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    );
  }
);

ErrorState.displayName = 'ErrorState';
