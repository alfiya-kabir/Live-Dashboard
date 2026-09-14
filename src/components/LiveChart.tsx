import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { MonitoringEvent } from '../types/event';
import { aggregateChartPoints } from '../utils/helpers';
import { MAX_CHART_POINTS } from '../utils/constants';
import { Activity, Gauge } from 'lucide-react';

interface LiveChartProps {
  events: readonly MonitoringEvent[];
}

export const LiveChart: React.FC<LiveChartProps> = React.memo(({ events }) => {
  const chartData = useMemo(() => {
    return aggregateChartPoints(events, MAX_CHART_POINTS);
  }, [events]);

  const latestMetric = chartData.length > 0 ? chartData[chartData.length - 1].avgMetric : 0;

  return (
    <section
      aria-label="Real-time Telemetry Metric Chart"
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Live Response Latency & Load Distribution
            </h2>
            <p className="text-xs text-slate-400">
              Aggregated sliding window time-series ({chartData.length} data points, bounded max {MAX_CHART_POINTS})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" />
            <span className="text-slate-300">Avg Latency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-500 inline-block" />
            <span className="text-slate-400">Warning (&gt;200ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
            <span className="text-slate-400">Critical (&gt;600ms)</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300 text-xs font-semibold flex items-center gap-1.5">
            <Gauge className="h-3 w-3 text-cyan-400" />
            <span>Now: {latestMetric} ms</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs font-medium">
            Waiting for live telemetry metrics...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                minTickGap={24}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                domain={[0, (dataMax: number) => Math.max(300, Math.ceil(dataMax * 1.15))]}
                unit="ms"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl text-xs backdrop-blur-md">
                        <p className="font-semibold text-white mb-1.5">{data.timeLabel}</p>
                        <div className="space-y-1">
                          <p className="text-cyan-400 font-mono">
                            Avg Latency: <span className="font-bold">{data.avgMetric} ms</span>
                          </p>
                          <p className="text-slate-400">
                            Batch Events: <span className="text-slate-200">{data.totalEvents}</span>
                          </p>
                          <div className="flex gap-2 pt-1 border-t border-slate-800 text-[11px]">
                            <span className="text-emerald-400">H: {data.healthyCount}</span>
                            <span className="text-amber-400">W: {data.warningCount}</span>
                            <span className="text-rose-400">C: {data.criticalCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.6} />
              <ReferenceLine y={600} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.6} />
              <Area
                type="monotone"
                dataKey="avgMetric"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#metricGradient)"
                isAnimationActive={false} /* Disabled to prevent frame drops during high-frequency streaming */
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
});

LiveChart.displayName = 'LiveChart';
