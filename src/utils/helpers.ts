import { MonitoringEvent, KpiMetrics, EventStatus, ChartDataPoint } from '../types/event';

/**
 * Formats a UNIX timestamp (ms) into HH:mm:ss.SSS for high-precision telemetry display.
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Formats a UNIX timestamp into a short time representation (HH:mm:ss).
 */
export function formatShortTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Formats numbers with localized thousands separators.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Calculates derived KPI metrics from the bounded event array.
 * Pure function designed for efficient memoization.
 */
export function calculateKpiMetrics(
  events: readonly MonitoringEvent[],
  eventsPerSec: number
): KpiMetrics {
  const totalEvents = events.length;

  if (totalEvents === 0) {
    return {
      totalEvents: 0,
      healthyCount: 0,
      warningCount: 0,
      criticalCount: 0,
      eventsPerSec: 0,
      overallStatus: 'healthy',
      avgMetric: 0,
    };
  }

  let healthyCount = 0;
  let warningCount = 0;
  let criticalCount = 0;
  let metricSum = 0;

  for (let i = 0; i < totalEvents; i++) {
    const event = events[i];
    metricSum += event.metric;
    if (event.status === 'healthy') healthyCount++;
    else if (event.status === 'warning') warningCount++;
    else if (event.status === 'critical') criticalCount++;
  }

  // Derive overall system status
  let overallStatus: EventStatus = 'healthy';
  const criticalRatio = criticalCount / totalEvents;
  const warningRatio = warningCount / totalEvents;

  if (criticalCount > 0 && criticalRatio > 0.08) {
    overallStatus = 'critical';
  } else if (warningCount > 0 && (warningRatio > 0.2 || criticalCount > 0)) {
    overallStatus = 'warning';
  }

  return {
    totalEvents,
    healthyCount,
    warningCount,
    criticalCount,
    eventsPerSec,
    overallStatus,
    avgMetric: Math.round((metricSum / totalEvents) * 10) / 10,
  };
}

/**
 * Aggregates a slice of raw events into time-bucketed chart points.
 * Ensures the chart dataset is strictly bounded and smooth.
 */
export function aggregateChartPoints(
  events: readonly MonitoringEvent[],
  maxPoints: number = 60
): ChartDataPoint[] {
  if (events.length === 0) return [];

  // Events are ordered newest first. We need chronological order for time-series charts.
  // Take at most maxPoints * 3 recent events and aggregate into maxPoints bins or use direct window
  const recentEvents = events.slice(0, Math.min(events.length, maxPoints * 5)).reverse();

  if (recentEvents.length <= maxPoints) {
    return recentEvents.map((evt) => ({
      timeLabel: formatShortTime(evt.timestamp),
      timestamp: evt.timestamp,
      avgMetric: evt.metric,
      healthyCount: evt.status === 'healthy' ? 1 : 0,
      warningCount: evt.status === 'warning' ? 1 : 0,
      criticalCount: evt.status === 'critical' ? 1 : 0,
      totalEvents: 1,
    }));
  }

  // Downsample into evenly distributed buckets
  const bucketSize = recentEvents.length / maxPoints;
  const points: ChartDataPoint[] = [];

  for (let i = 0; i < maxPoints; i++) {
    const startIdx = Math.floor(i * bucketSize);
    const endIdx = Math.floor((i + 1) * bucketSize);
    const bucket = recentEvents.slice(startIdx, endIdx);

    if (bucket.length === 0) continue;

    let metricSum = 0;
    let healthy = 0;
    let warning = 0;
    let critical = 0;

    for (const item of bucket) {
      metricSum += item.metric;
      if (item.status === 'healthy') healthy++;
      else if (item.status === 'warning') warning++;
      else if (item.status === 'critical') critical++;
    }

    const midpointEvent = bucket[Math.floor(bucket.length / 2)];

    points.push({
      timeLabel: formatShortTime(midpointEvent.timestamp),
      timestamp: midpointEvent.timestamp,
      avgMetric: Math.round((metricSum / bucket.length) * 10) / 10,
      healthyCount: healthy,
      warningCount: warning,
      criticalCount: critical,
      totalEvents: bucket.length,
    });
  }

  return points;
}
