export type EventStatus = 'healthy' | 'warning' | 'critical';

export interface MonitoringEvent {
  id: string;
  timestamp: number;
  service: string;
  status: EventStatus;
  metric: number;
  message: string;
}

export type ConnectionStatus =
  | 'connecting'
  | 'live'
  | 'paused'
  | 'reconnecting'
  | 'error';

export type TimeWindow = '1m' | '5m' | '15m' | 'all';

export interface FilterState {
  service: string;
  status: 'all' | EventStatus;
  timeWindow: TimeWindow;
  searchQuery: string;
}

export interface KpiMetrics {
  totalEvents: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  eventsPerSec: number;
  overallStatus: EventStatus;
  avgMetric: number;
}

export interface StreamMetrics {
  totalEmitted: number;
  totalReceived: number;
  totalDropped: number;
  currentRateEps: number;
}

export interface ChartDataPoint {
  timeLabel: string;
  timestamp: number;
  avgMetric: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  totalEvents: number;
}

export interface StreamClientOptions {
  initialRateEps?: number;
  errorProbability?: number;
}
