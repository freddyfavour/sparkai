'use client';

import React, { useState, useEffect } from 'react';
import { SensorMetrics } from '@/lib/sensorEngine';
import { saveTelemetrySnapshot, getSavedTelemetryHistory, TelemetryPoint } from '@/lib/supabaseClient';
import { Activity, Clock, Flame, Thermometer, Wind, Droplets, ZoomIn, Maximize, Database } from 'lucide-react';

interface AnalyticsDashboardProps {
  currentMetrics: SensorMetrics;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ currentMetrics }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'temp' | 'gas' | 'humidity'>('all');
  const [zoomMode, setZoomMode] = useState<'auto' | 'full'>('auto'); // 'auto' zooms tightly to reveal real micro-fluctuations
  const [hoveredPoint, setHoveredPoint] = useState<{ point: TelemetryPoint; key: 'temp' | 'gas' | 'humidity'; x: number; y: number } | null>(null);

  // Real persisted historical telemetry buffer
  const [history, setHistory] = useState<TelemetryPoint[]>([]);

  // On initial mount, load real saved historical telemetry
  useEffect(() => {
    const saved = getSavedTelemetryHistory();
    if (saved.length > 0) {
      setHistory(saved);
    }
  }, []);

  // Update history buffer ONLY when real Blynk sensor data arrives
  useEffect(() => {
    if (currentMetrics.temperature === null && currentMetrics.gas === null && currentMetrics.humidity === null) {
      return;
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const liveTemp = currentMetrics.temperature ?? 25.0;
    const liveGas = currentMetrics.gas ?? 140;
    const liveHum = currentMetrics.humidity ?? 50.0;

    const newPt: TelemetryPoint = {
      time: nowStr,
      temp: liveTemp,
      gas: liveGas,
      humidity: liveHum,
      anomaly: liveGas >= 400 || liveTemp >= 40 || liveHum >= 75,
    };

    // Save real hardware point to local storage & Supabase
    const updatedHistory = saveTelemetrySnapshot(newPt);
    if (updatedHistory && updatedHistory.length > 0) {
      setHistory([...updatedHistory]);
    } else {
      setHistory((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].time === nowStr) return prev;
        const list = [...prev, newPt];
        return list.slice(-30);
      });
    }
  }, [currentMetrics.lastUpdated, currentMetrics.temperature, currentMetrics.gas, currentMetrics.humidity]);

  // Calculate statistics from actual real history
  const temps = history.map((h) => h.temp);
  const gases = history.map((h) => h.gas);
  const hums = history.map((h) => h.humidity);

  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '--';
  const maxGas = gases.length ? Math.max(...gases) : '--';
  const avgHum = hums.length ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1) : '--';

  // SVG Chart Dimensions
  const chartHeight = 150;
  const chartWidth = 600;
  const paddingLeft = 45; // Space for y-axis numbers
  const graphWidth = chartWidth - paddingLeft;

  // Helper to generate smooth cubic Bezier path string
  const getSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = (p0.x + p1.x) / 2;
      const cp1y = p0.y;
      const cp2x = (p0.x + p1.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
    }
    return d;
  };

  const renderSVGChart = (
    dataKey: 'temp' | 'gas' | 'humidity',
    strokeColor: string,
    unit: string,
    thresholdValue?: number,
    thresholdLabel?: string
  ) => {
    if (history.length < 2) {
      return (
        <div className="flex h-36 flex-col items-center justify-center space-y-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 font-mono text-xs text-zinc-500">
          <Database className="h-5 w-5 text-emerald-500 animate-pulse" />
          <span>Recording real hardware telemetry from ESP32...</span>
          <span className="text-[10px] text-zinc-400">1st reading captured ({history[0]?.temp ?? '--'}°C). Waiting for next 5s poll.</span>
        </div>
      );
    }

    const values = history.map((h) => h[dataKey]);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);

    let minVal = rawMin;
    let maxVal = rawMax;

    if (zoomMode === 'auto') {
      // AUTO-FIT DATA: Auto-zooms scale to actual min/max range so even 0.1°C shifts produce clear wave curves
      if (minVal === maxVal) {
        minVal = Math.max(0, Number((minVal - 0.5).toFixed(1)));
        maxVal = Number((maxVal + 0.5).toFixed(1));
      } else {
        const diff = maxVal - minVal;
        const pad = Math.max(0.1, diff * 0.15);
        minVal = Math.max(0, Number((minVal - pad).toFixed(1)));
        maxVal = Number((maxVal + pad).toFixed(1));
      }
    } else {
      // FULL RANGE: Scales out to show global safety threshold limits
      if (thresholdValue !== undefined) {
        if (thresholdValue > maxVal) maxVal = thresholdValue + 5;
        if (thresholdValue < minVal) minVal = Math.max(0, thresholdValue - 5);
      }
      const diff = maxVal - minVal;
      const pad = diff * 0.1;
      minVal = Math.max(0, Number((minVal - pad).toFixed(1)));
      maxVal = Number((maxVal + pad).toFixed(1));
    }

    const valRange = maxVal - minVal || 1;

    // Convert real data points to coordinates
    const coords = history.map((h, i) => {
      const x = paddingLeft + (i / (history.length - 1)) * graphWidth;
      const y = chartHeight - ((h[dataKey] - minVal) / valRange) * chartHeight;
      return { x, y, point: h };
    });

    const smoothPath = getSmoothPath(coords);
    const areaPath = `${smoothPath} L ${coords[coords.length - 1].x.toFixed(1)},${chartHeight} L ${paddingLeft},${chartHeight} Z`;

    // Threshold Line Y position
    const thresholdY = thresholdValue !== undefined
      ? chartHeight - ((thresholdValue - minVal) / valRange) * chartHeight
      : null;

    const midVal = ((minVal + maxVal) / 2).toFixed(1);

    return (
      <div className="relative w-full">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible font-mono text-[10px]">
          
          {/* Y-Axis Scale Values */}
          <text x="0" y="12" fill="currentColor" className="text-zinc-500 font-bold fill-current text-[10px]">
            {dataKey === 'gas' ? Math.round(maxVal) : maxVal}{unit}
          </text>
          <text x="0" y={chartHeight / 2 + 3} fill="currentColor" className="text-zinc-500 fill-current text-[10px]">
            {dataKey === 'gas' ? Math.round(Number(midVal)) : midVal}{unit}
          </text>
          <text x="0" y={chartHeight - 4} fill="currentColor" className="text-zinc-500 font-bold fill-current text-[10px]">
            {dataKey === 'gas' ? Math.round(minVal) : minVal}{unit}
          </text>

          {/* Background Grid Lines */}
          <line x1={paddingLeft} y1="5" x2={chartWidth} y2="5" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={chartHeight - 5} x2={chartWidth} y2={chartHeight - 5} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeDasharray="3 3" />

          {/* Reference Threshold Line */}
          {thresholdY !== null && thresholdY >= 0 && thresholdY <= chartHeight && (
            <g>
              <line
                x1={paddingLeft}
                y1={thresholdY}
                x2={chartWidth}
                y2={thresholdY}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text x={chartWidth - 120} y={thresholdY - 4} fill="#ef4444" className="font-bold text-[9px] fill-current">
                {thresholdLabel || `Limit: ${thresholdValue}${unit}`}
              </text>
            </g>
          )}

          {/* Gradient Fill */}
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill={`url(#grad-${dataKey})`} />
          <path d={smoothPath} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {coords.map((p, i) => {
            const val = p.point[dataKey];
            const isAbnormal = (dataKey === 'gas' && val >= 400) || (dataKey === 'temp' && val >= 40) || (dataKey === 'humidity' && val >= 75);

            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isAbnormal ? '5' : '3.5'}
                fill={isAbnormal ? '#ef4444' : strokeColor}
                stroke="#09090b"
                strokeWidth="1.5"
                className="cursor-pointer transition-transform hover:scale-150"
                onMouseEnter={() => setHoveredPoint({ point: p.point, key: dataKey, x: p.x, y: p.y })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && hoveredPoint.key === dataKey && (
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-12 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-900 text-white px-2.5 py-1 text-[11px] font-mono shadow-xl pointer-events-none"
            style={{ left: `${(hoveredPoint.x / chartWidth) * 100}%`, top: `${(hoveredPoint.y / chartHeight) * 100}%` }}
          >
            <div className="flex items-center space-x-1">
              <span className="text-zinc-400">{hoveredPoint.point.time}:</span>
              <strong className="text-white">
                {hoveredPoint.point[dataKey]}{unit}
              </strong>
            </div>
          </div>
        )}

        {/* X-Axis Time Labels */}
        <div className="flex justify-between mt-2 pl-10 text-[10px] font-mono text-zinc-500">
          <span>{history[0]?.time}</span>
          <span>{history[Math.floor(history.length / 2)]?.time}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{history[history.length - 1]?.time} (Live)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-5 shadow-sm space-y-4">
      
      {/* Header Controls */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="font-sans text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            Real Telemetry History Graph
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase">
              {history.length} Live Readings Recorded
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Recorded from ESP32 hardware & stored in Supabase / LocalStorage</p>
        </div>

        {/* Controls: Tab Switches & Zoom Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Fit Mode Switch */}
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-1 text-xs">
            <button
              onClick={() => setZoomMode('auto')}
              className={`flex items-center space-x-1 rounded-lg px-2 py-1 font-medium transition ${
                zoomMode === 'auto'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Tight Auto-Zoom to reveal micro-fluctuations"
            >
              <ZoomIn className="h-3 w-3" />
              <span>Auto-Fit Scale</span>
            </button>
            <button
              onClick={() => setZoomMode('full')}
              className={`flex items-center space-x-1 rounded-lg px-2 py-1 font-medium transition ${
                zoomMode === 'full'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Full Range Scale with Threshold Limits"
            >
              <Maximize className="h-3 w-3" />
              <span>Full Scale</span>
            </button>
          </div>

          {/* Graph Filter Tabs */}
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-1 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              All Signals
            </button>
            <button
              onClick={() => setActiveTab('temp')}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                activeTab === 'temp'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Temp
            </button>
            <button
              onClick={() => setActiveTab('gas')}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                activeTab === 'gas'
                  ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Gas
            </button>
            <button
              onClick={() => setActiveTab('humidity')}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                activeTab === 'humidity'
                  ? 'bg-white dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Humidity
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Avg Temperature</span>
          <p className="font-mono text-lg font-bold text-orange-600 dark:text-orange-400 mt-0.5">{avgTemp}°C</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Max Gas Peak</span>
          <p className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{maxGas} PPM</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Avg Humidity</span>
          <p className="font-mono text-lg font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">{avgHum}%</p>
        </div>
      </div>

      {/* Dynamic Graph Views */}
      <div className="space-y-6 pt-2">
        {(activeTab === 'all' || activeTab === 'temp') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                <Thermometer className="h-3.5 w-3.5" /> Temperature Signal Curve (°C)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Combustion Threshold: 45.0°C</span>
            </div>
            {renderSVGChart('temp', '#f97316', '°C', 45.0, 'Fire Hazard: 45°C')}
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'gas') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5" /> Gas Concentration Signal Curve (PPM)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Elevated Gas Threshold: 400 PPM</span>
            </div>
            {renderSVGChart('gas', '#f59e0b', ' PPM', 400, 'Gas Hazard: 400 PPM')}
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'humidity') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5" /> Relative Humidity Curve (%)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Dampness Threshold: 75%</span>
            </div>
            {renderSVGChart('humidity', '#06b6d4', '%', 75, 'High Humidity: 75%')}
          </div>
        )}
      </div>
    </div>
  );
};
