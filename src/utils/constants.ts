import { EventStatus } from '../types/event';

export const MAX_EVENTS = 500;
export const MAX_CHART_POINTS = 60;
export const BATCH_INTERVAL_MS = 150;
export const MAX_BUFFER_CAPACITY = 2000;

export const RECONNECT_INITIAL_DELAY_MS = 1000;
export const RECONNECT_MAX_DELAY_MS = 30000;
export const RECONNECT_FACTOR = 2;

export const SERVICES = [
  'API Gateway',
  'Authentication',
  'Payments',
  'Database',
  'Notifications',
  'Search Service',
] as const;

export type ServiceName = (typeof SERVICES)[number];

export const STATUS_CONFIG: Record<
  EventStatus,
  {
    label: string;
    icon: string;
    badgeClass: string;
    borderClass: string;
    textClass: string;
    bgClass: string;
  }
> = {
  healthy: {
    label: 'Healthy',
    icon: '🟢',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500',
  },
  warning: {
    label: 'Warning',
    icon: '🟡',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500',
  },
  critical: {
    label: 'Critical',
    icon: '🔴',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    borderClass: 'border-rose-500',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-500',
  },
};

export const TIME_WINDOWS = [
  { label: 'Last 1 min', value: '1m', durationMs: 60 * 1000 },
  { label: 'Last 5 mins', value: '5m', durationMs: 5 * 60 * 1000 },
  { label: 'Last 15 mins', value: '15m', durationMs: 15 * 60 * 1000 },
  { label: 'All Time', value: 'all', durationMs: Infinity },
] as const;

export const SAMPLE_MESSAGES: Record<EventStatus, string[]> = {
  healthy: [
    'Database query response time normal (14ms)',
    'Authentication token verification latency healthy (22ms)',
    'API Gateway routing throughput stable (4.2k req/s)',
    'Payment settlement pipeline processed batch successfully',
    'Notification push queue drained with zero backlog',
    'Elasticsearch cluster state green, indices balanced',
    'TLS session reuse rate optimal at 94.8%',
  ],
  warning: [
    'Payment gateway latency increased to 320ms',
    'Connection pool utilization exceeded 78%',
    'Garbage collection pause spike detected (180ms)',
    'Search index replication lag increased to 1.4s',
    'Upstream cache hit ratio degraded to 64%',
    'Rate limit threshold approached by external client IP',
  ],
  critical: [
    'Database write replica connection timeout detected',
    'Authentication cluster pod memory threshold breached (>92%)',
    'Downstream payment processor returned HTTP 504 Gateway Timeout',
    'Deadlock detected in transactional order ledger',
    'Search query threadpool exhausted, dropping incoming requests',
  ],
};
