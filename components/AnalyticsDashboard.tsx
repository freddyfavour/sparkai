'use client';

import React, { useState, useEffect } from 'react';
import { SensorMetrics } from '@/lib/sensorEngine';
import { Activity, Clock, Flame, Thermometer, Wind, Droplets } from 'lucide-react';

interface DataPoint {
  time: string;
  temp: number;
  gas: number;
  humidity: number;
  anomaly?: boolean;
}

interface AnalyticsDashboardProps {
  currentMetrics: SensorMetrics;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ currentMetrics }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'temp' | 'gas' | 'humidity'>('all');
  const [timeRange, setTimeRange] = useState<'live' | '1h' | '24h'>('live');

  // Simulated & Live history buffer
  const [history, setHistory] = useState<DataPoint[]>([]);

  useEffect(() => {
    // Generate initial realistic baseline points if history is empty
    if (history.length === 0) {
      const initial: DataPoint[] = [];
      const baseTemp = currentMetrics.temperature ?? 26.2;
      const baseGas = currentMetrics.gas ?? 147;
      const baseHum = currentMetrics.humidity ?? 48.0;

      for (let i = 12; i >= 1; i--) {
        const d = new Date(Date.now() - i * 30 * 1000);
        initial.push({
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: Number((baseTemp + (Math.random() * 0.6 - 0.3)).toFixed(1)),
          gas: Math.round(baseGas + (Math.random() * 10 - 5)),
          humidity: Number((baseHum + (Math.random() * 1.0 - 0.5)).toFixed(1)),
        });
      }
      setHistory(initial);
    } else {
      // Append current metric snapshot
      if (currentMetrics.temperature !== null) {
        setHistory((prev) => {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newPt: DataPoint = {
            time: nowStr,
            temp: currentMetrics.temperature!,
            gas: currentMetrics.gas ?? 147,
            humidity: currentMetrics.humidity ?? 48,
            anomaly: currentMetrics.gas! > 220 || currentMetrics.temperature! > 38,
          };
          const updated = [...prev, newPt];
          if (updated.length > 24) updated.shift();
          return updated;
        });
      }
    }
  }, [currentMetrics.lastUpdated]);

  // Calculate statistics
  const temps = history.map((h) => h.temp);
  const gases = history.map((h) => h.gas);
  const hums = history.map((h) => h.humidity);

  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '--';
  const maxGas = gases.length ? Math.max(...gases) : '--';
  const avgHum = hums.length ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1) : '--';

  // SVG Chart Dimensions
  const chartHeight = 160;
  const chartWidth = 600;

  const renderSVGChart = (dataKey: 'temp' | 'gas' | 'humidity', strokeColor: string, baselineMin: number, baselineMax: number) => {
    if (history.length < 2) return null;

    const values = history.map((h) => h[dataKey]);
    const minVal = Math.min(...values, baselineMin) - 2;
    const maxVal = Math.max(...values, baselineMax) + 2;

    const points = history.map((h, index) => {
      const x = (index / (history.length - 1)) * chartWidth;
      const y = chartHeight - ((h[dataKey] - minVal) / (maxVal - minVal)) * chartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathString = `M ${points.join(' L ')}`;
    const areaString = `M 0,${chartHeight} L ${points.join(' L ')} L ${chartWidth},${chartHeight} Z`;

    return (
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40 overflow-visible">
          {/* Subtle Gridlines */}
          <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#27272a" strokeDasharray="3 3" />
          <line x1="0" y1="80" x2={chartWidth} y2="80" stroke="#27272a" strokeDasharray="3 3" />
          <line x1="0" y1="140" x2={chartWidth} y2="140" stroke="#27272a" strokeDasharray="3 3" />

          {/* Area gradient fill */}
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={areaString} fill={`url(#grad-${dataKey})`} />
          <path d={pathString} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Points */}
          {history.map((h, i) => {
            const x = (i / (history.length - 1)) * chartWidth;
            const y = chartHeight - ((h[dataKey] - minVal) / (maxVal - minVal)) * chartHeight;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={h.anomaly ? '5' : '3'}
                fill={h.anomaly ? '#ef4444' : strokeColor}
                stroke="#09090b"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        {/* Time Labels */}
        <div className="flex justify-between mt-2 text-[10px] font-mono text-zinc-500">
          <span>{history[0]?.time}</span>
          <span>{history[Math.floor(history.length / 2)]?.time}</span>
          <span>{history[history.length - 1]?.time} (Live)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 shadow-inner">
      
      {/* Header Controls */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 border-b border-zinc-800/80 pb-4">
        <div>
          <h3 className="font-sans text-base font-bold text-white flex items-center gap-2">
            Historical Environmental Analytics
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400 uppercase">
              Time-Series
            </span>
          </h3>
          <p className="text-xs text-zinc-400">Continuous telemetry pattern analysis</p>
        </div>

        {/* Tab & Filter Switches */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                activeTab === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Signals
            </button>
            <button
              onClick={() => setActiveTab('temp')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                activeTab === 'temp' ? 'bg-zinc-800 text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Temp
            </button>
            <button
              onClick={() => setActiveTab('gas')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                activeTab === 'gas' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Gas
            </button>
            <button
              onClick={() => setActiveTab('humidity')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                activeTab === 'humidity' ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Humidity
            </button>
          </div>

          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-xs font-mono">
            <button
              onClick={() => setTimeRange('live')}
              className={`rounded-md px-2 py-0.5 ${timeRange === 'live' ? 'bg-zinc-800 text-emerald-400 font-bold' : 'text-zinc-500'}`}
            >
              Live
            </button>
            <button
              onClick={() => setTimeRange('1h')}
              className={`rounded-md px-2 py-0.5 ${timeRange === '1h' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500'}`}
            >
              1h
            </button>
            <button
              onClick={() => setTimeRange('24h')}
              className={`rounded-md px-2 py-0.5 ${timeRange === '24h' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500'}`}
            >
              24h
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Avg Temperature</span>
          <p className="font-mono text-lg font-bold text-orange-400 mt-0.5">{avgTemp}°C</p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Max Gas Peak</span>
          <p className="font-mono text-lg font-bold text-amber-400 mt-0.5">{maxGas} PPM</p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Avg Humidity</span>
          <p className="font-mono text-lg font-bold text-cyan-400 mt-0.5">{avgHum}%</p>
        </div>
      </div>

      {/* Chart Views */}
      <div className="mt-5 space-y-6">
        {(activeTab === 'all' || activeTab === 'temp') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-orange-400 flex items-center gap-1.5">
                <Thermometer className="h-3.5 w-3.5" /> Temperature Pattern (°C)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Baseline 20-32°C</span>
            </div>
            {renderSVGChart('temp', '#f97316', 20, 35)}
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'gas') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-amber-400 flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5" /> Gas Concentration Trend (PPM)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Threshold &lt; 200 PPM</span>
            </div>
            {renderSVGChart('gas', '#f59e0b', 100, 300)}
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'humidity') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5" /> Relative Humidity Curve (%)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Optimal 35-65%</span>
            </div>
            {renderSVGChart('humidity', '#06b6d4', 30, 80)}
          </div>
        )}
      </div>
    </div>
  );
};
