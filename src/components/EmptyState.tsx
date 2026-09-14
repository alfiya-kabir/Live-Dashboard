import React from 'react';
import { Inbox, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({
    title = 'No events found',
    message = 'Waiting for monitoring events or no records matched the selected filters.',
    actionLabel,
    onAction,
  }) => {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
        <div className="p-3 rounded-full bg-slate-800 text-slate-400 mb-3">
          <Inbox className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
