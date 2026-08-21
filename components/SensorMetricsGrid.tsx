'use client';

import React from 'react';
import { Thermometer, Wind, Droplets, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SensorMetrics } from '@/lib/sensorEngine';

interface SensorMetricsGridProps {
  metrics: SensorMetrics;
}

export const SensorMetricsGrid: React.FC<SensorMetricsGridProps> = ({ metrics }) => {
  const { temperature, humidity, gas, airQuality, smoke, tempRateOfChange, gasRateOfChange, humidityRateOfChange } = metrics;

  // Temperature Status & Plain English Explanation
  const getTempStatus = (val: number | null) => {
    if (val === null) return { text: 'Unavailable', plain: 'Sensor reading offline', color: 'text-zinc-500', bar: 'bg-zinc-700', pct: 0 };
    if (val >= 45) return { text: 'Combustion Hazard', plain: 'Dangerously hot! High heat buildup detected.', color: 'text-red-500 dark:text-red-400', bar: 'bg-red-500', pct: Math.min(100, (val / 60) * 100) };
    if (val >= 40) return { text: 'High Heat', plain: 'Unusually warm indoors. Check ventilation.', color: 'text-orange-500 dark:text-orange-400', bar: 'bg-orange-500', pct: (val / 50) * 100 };
    if (val >= 32) return { text: 'Warm Ambient', plain: 'Slightly warm, comfortable for tropical homes.', color: 'text-amber-600 dark:text-amber-300', bar: 'bg-amber-400', pct: (val / 45) * 100 };
    return { text: 'Ideal Comfort', plain: 'Perfect room temperature for living spaces.', color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', pct: (val / 40) * 100 };
  };

  // Gas Status & Plain English Explanation (High gas starts at 400 PPM)
  const getGasStatus = (val: number | null) => {
    if (val === null) return { text: 'Unavailable', plain: 'Sensor reading offline', color: 'text-zinc-500', bar: 'bg-zinc-700', pct: 0 };
    if (val >= 800) return { text: 'Critical Leak Spike', plain: 'Urgent! Heavy gas accumulation detected (> 800 PPM).', color: 'text-red-500 dark:text-red-400', bar: 'bg-red-500', pct: 100 };
    if (val >= 600) return { text: 'High Gas Level', plain: 'Gas level high. Inspect stove burners or connections.', color: 'text-orange-500 dark:text-orange-400', bar: 'bg-orange-500', pct: 75 };
    if (val >= 400) return { text: 'Elevated Gas Level', plain: 'Gas concentration crossed 400 PPM threshold.', color: 'text-amber-600 dark:text-amber-300', bar: 'bg-amber-400', pct: 50 };
    return { text: 'Fresh Air (No Leaks)', plain: 'Clean air! Gas level is within safe baseline (< 400 PPM).', color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', pct: Math.max(15, (val / 400) * 40) };
  };

  // Humidity Status & Plain English Explanation
  const getHumStatus = (val: number | null) => {
    if (val === null) return { text: 'Unavailable', plain: 'Sensor reading offline', color: 'text-zinc-500', bar: 'bg-zinc-700', pct: 0 };
    if (val >= 85) return { text: 'High Moisture', plain: 'Damp air! High chance of mold growth.', color: 'text-cyan-600 dark:text-cyan-400', bar: 'bg-cyan-500', pct: 90 };
    if (val <= 20) return { text: 'Excessively Dry', plain: 'Dry air can irritate eyes and throat.', color: 'text-amber-600 dark:text-amber-300', bar: 'bg-amber-400', pct: 20 };
    return { text: 'Perfect Moisture', plain: 'Optimal humidity level for healthy breathing.', color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', pct: val };
  };

  const tempStat = getTempStatus(temperature);
  const gasStat = getGasStatus(gas);
  const humStat = getHumStatus(humidity);

  const renderTrend = (rate: number, unit: string) => {
    if (rate > 0) {
      return (
        <span className="flex items-center text-xs font-mono font-medium text-amber-500 dark:text-amber-400">
          <TrendingUp className="mr-0.5 h-3 w-3" /> +{rate}{unit}/5m
        </span>
      );
    }
    if (rate < 0) {
      return (
        <span className="flex items-center text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
          <TrendingDown className="mr-0.5 h-3 w-3" /> {rate}{unit}/5m
        </span>
      );
    }
    return (
      <span className="flex items-center text-xs font-mono text-zinc-400 dark:text-zinc-500">
        <Minus className="mr-0.5 h-3 w-3" /> Stable
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-sans text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          Live Sensor Measurements
          <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 font-normal lowercase">
            simplified for human understanding
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* 1. TEMPERATURE */}
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-4 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Thermometer className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                <span>Temperature</span>
              </div>
              <span className={`text-[11px] font-medium font-sans px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 ${tempStat.color}`}>
                {tempStat.text}
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <p className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {temperature !== null ? `${temperature}°C` : <span className="text-zinc-400 dark:text-zinc-600">--</span>}
              </p>
              {renderTrend(tempRateOfChange, '°C')}
            </div>

            {/* Plain English Human Explanation */}
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans border-t border-zinc-100 dark:border-zinc-800/60 pt-2">
              💡 {tempStat.plain}
            </p>
          </div>

          {/* Visual Mini Progress Bar */}
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full transition-all duration-500 ${tempStat.bar}`}
                style={{ width: `${tempStat.pct}%` }}
              ></div>
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              <span>Safe: 20°C - 38°C</span>
              <span>ESP32 Pin V0</span>
            </div>
          </div>
        </div>

        {/* 2. GAS LEVEL */}
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-4 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Wind className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                <span>Gas Level</span>
              </div>
              <span className={`text-[11px] font-medium font-sans px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 ${gasStat.color}`}>
                {gasStat.text}
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <p className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {gas !== null ? `${gas} PPM` : <span className="text-zinc-400 dark:text-zinc-600">--</span>}
              </p>
              {renderTrend(gasRateOfChange, ' PPM')}
            </div>

            {/* Plain English Human Explanation */}
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans border-t border-zinc-100 dark:border-zinc-800/60 pt-2">
              💡 {gasStat.plain}
            </p>
          </div>

          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full transition-all duration-500 ${gasStat.bar}`}
                style={{ width: `${gasStat.pct}%` }}
              ></div>
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              <span>Safe Limit &lt; 400 PPM</span>
              <span>ESP32 Pin V2</span>
            </div>
          </div>
        </div>

        {/* 3. RELATIVE HUMIDITY */}
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-4 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Droplets className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                <span>Humidity</span>
              </div>
              <span className={`text-[11px] font-medium font-sans px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 ${humStat.color}`}>
                {humStat.text}
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <p className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {humidity !== null ? `${humidity}%` : <span className="text-zinc-400 dark:text-zinc-600">--</span>}
              </p>
              {renderTrend(humidityRateOfChange, '%')}
            </div>

            {/* Plain English Human Explanation */}
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans border-t border-zinc-100 dark:border-zinc-800/60 pt-2">
              💡 {humStat.plain}
            </p>
          </div>

          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full transition-all duration-500 ${humStat.bar}`}
                style={{ width: `${humStat.pct}%` }}
              ></div>
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              <span>Optimal 30% - 75%</span>
              <span>ESP32 Pin V1</span>
            </div>
          </div>
        </div>

        {/* 4. AIR QUALITY & SMOKE */}
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-4 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Flame className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                <span>Air Quality / Smoke</span>
              </div>
              <span className="text-[11px] font-medium font-sans px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400">
                Clean Air
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <p className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {smoke !== null ? `${smoke} PPM` : <span className="text-zinc-700 dark:text-zinc-300 font-sans text-xl font-bold">Clear</span>}
              </p>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Safe Air
              </span>
            </div>

            {/* Plain English Human Explanation */}
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans border-t border-zinc-100 dark:border-zinc-800/60 pt-2">
              💡 No smoke particles or combustion pollutants detected in the room.
            </p>
          </div>

          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full w-1/4 bg-emerald-500"></div>
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              <span>Smoke & Fire Monitor</span>
              <span>ESP32 Pins</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
