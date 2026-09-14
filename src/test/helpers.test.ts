import { describe, it, expect } from 'vitest';
import {
  calculateKpiMetrics,
  aggregateChartPoints,
  formatNumber,
  formatTimestamp,
} from '../utils/helpers';
import { MonitoringEvent } from '../types/event';

describe('helpers.ts', () => {
  const mockEvents: MonitoringEvent[] = [
    {
      id: '1',
      timestamp: 1718000000000,
      service: 'API Gateway',
      status: 'healthy',
      metric: 20,
      message: 'OK',
    },
    {
      id: '2',
      timestamp: 1718000001000,
      service: 'Database',
      status: 'warning',
      metric: 250,
      message: 'Latency warning',
    },
    {
      id: '3',
      timestamp: 1718000002000,
      service: 'Payments',
      status: 'critical',
      metric: 850,
      message: 'Timeout critical',
    },
  ];

  it('calculates KPI metrics correctly', () => {
    const kpis = calculateKpiMetrics(mockEvents, 30);
    expect(kpis.totalEvents).toBe(3);
    expect(kpis.healthyCount).toBe(1);
    expect(kpis.warningCount).toBe(1);
    expect(kpis.criticalCount).toBe(1);
    expect(kpis.eventsPerSec).toBe(30);
    expect(kpis.avgMetric).toBeCloseTo(373.3, 1);
    expect(kpis.overallStatus).toBe('critical');
  });

  it('handles empty events for KPIs gracefully', () => {
    const kpis = calculateKpiMetrics([], 0);
    expect(kpis.totalEvents).toBe(0);
    expect(kpis.healthyCount).toBe(0);
    expect(kpis.avgMetric).toBe(0);
    expect(kpis.overallStatus).toBe('healthy');
  });

  it('aggregates chart points bounded within maxPoints', () => {
    const points = aggregateChartPoints(mockEvents, 2);
    expect(points.length).toBeLessThanOrEqual(2);
    expect(points[0]).toHaveProperty('avgMetric');
    expect(points[0]).toHaveProperty('timeLabel');
  });

  it('formats numbers with thousands separators', () => {
    expect(formatNumber(1245000)).toMatch(/1[,\s.]245[,\s.]000/);
  });

  it('formats high-precision timestamps', () => {
    const formatted = formatTimestamp(new Date('2024-06-10T12:30:45.678Z').getTime());
    expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
  });
});
