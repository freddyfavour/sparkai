'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, AlertTriangle, Info, HelpCircle, ArrowRight, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { HazardAssessment } from '@/lib/sensorEngine';

interface HomeStatusBannerProps {
  assessment: HazardAssessment;
  onAskSpark: (prompt: string) => void;
  onSimulateHazard: (type: 'FIRE' | 'GAS' | 'MOLD' | 'RESET') => void;
}

export const HomeStatusBanner: React.FC<HomeStatusBannerProps> = ({
  assessment,
  onAskSpark,
  onSimulateHazard,
}) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const { hazardDetected, hazardTitle, riskLevel, anomalyScore, primaryRoomName, measuredText, detectedText, inferredText, recommendedText } = assessment;

  // Calculate intuitive Home Health Score (100 = Perfect, 0 = Danger)
  const healthScore = Math.max(10, Math.round((1 - anomalyScore) * 100));

  // Determine styling based on risk level
  const getBannerStyle = () => {
    switch (riskLevel) {
      case 'CRITICAL':
        return {
          container: 'border-red-500/50 bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-950 shadow-lg shadow-red-950/20',
          badge: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
          icon: <AlertOctagon className="h-9 w-9 text-red-500 animate-pulse" />,
          titleColor: 'text-red-400',
          statusText: 'CRITICAL HAZARD DETECTED',
          scoreColor: 'text-red-400 border-red-500/30 bg-red-500/10',
          summaryText: `Possible safety hazard detected in your ${primaryRoomName}. Please review recommended safety actions immediately.`,
        };
      case 'HIGH':
        return {
          container: 'border-orange-500/40 bg-gradient-to-r from-orange-950/30 via-zinc-900 to-zinc-950 shadow-md shadow-orange-950/10',
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
          icon: <AlertTriangle className="h-9 w-9 text-orange-400" />,
          titleColor: 'text-orange-400',
          statusText: 'HIGH RISK ALERT',
          scoreColor: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
          summaryText: `Significant sensor elevation in ${primaryRoomName}. Check stove burners or heat sources.`,
        };
      case 'MEDIUM':
      case 'LOW':
        return {
          container: 'border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-zinc-900 to-zinc-950',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          icon: <Info className="h-9 w-9 text-amber-400" />,
          titleColor: 'text-amber-300',
          statusText: 'ATTENTION REQUIRED',
          scoreColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
          summaryText: `Minor environmental shift detected in ${primaryRoomName}. Keep an eye on conditions.`,
        };
      case 'SAFE':
      default:
        return {
          container: 'border-emerald-500/20 bg-gradient-to-r from-emerald-950/10 via-zinc-900 to-zinc-950',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: <ShieldCheck className="h-9 w-9 text-emerald-400" />,
          titleColor: 'text-emerald-400',
          statusText: 'HOME SAFE & HEALTHY',
          scoreColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
          summaryText: `All room sensors show clean air, safe gas levels, and comfortable temperatures. No threats detected.`,
        };
    }
  };

  const style = getBannerStyle();

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${style.container} p-5 sm:p-6 transition-all duration-300 shadow-xl`}>
      
      {/* Top Banner Row */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        
        {/* Left Status & Plain English Title */}
        <div className="flex items-start space-x-4">
          <div className="mt-1 flex-shrink-0">{style.icon}</div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md border px-2.5 py-0.5 font-mono text-xs font-bold tracking-wide uppercase ${style.badge}`}>
                {style.statusText}
              </span>
              <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-300">
                Primary Room: <strong className="text-white">{primaryRoomName}</strong>
              </span>
            </div>

            <h2 className={`mt-2 font-sans text-xl sm:text-2xl font-black tracking-tight ${style.titleColor}`}>
              {hazardTitle}
            </h2>

            {/* Plain English Explanation */}
            <p className="mt-1 text-xs sm:text-sm text-zinc-300 max-w-2xl font-sans leading-relaxed">
              {style.summaryText}
            </p>
          </div>
        </div>

        {/* Right: Home Health Score Meter */}
        <div className="flex items-center space-x-4 border-t border-zinc-800/80 pt-3 md:border-t-0 md:pt-0">
          <div className={`flex flex-col items-center justify-center rounded-2xl border px-4 py-2 text-center ${style.scoreColor}`}>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
              Safety Score
            </span>
            <span className="font-mono text-2xl font-black">{healthScore}<span className="text-xs text-zinc-500 font-normal">/100</span></span>
            <span className="text-[10px] font-sans font-medium text-zinc-300">
              {healthScore >= 90 ? 'Excellent' : healthScore >= 70 ? 'Moderate' : 'Action Needed'}
            </span>
          </div>

          {/* Test Simulation Quick Controls */}
          <div className="hidden sm:flex flex-col space-y-1 text-right">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Simulate Scenarios:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSimulateHazard('RESET')}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${!hazardDetected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
              >
                Normal
              </button>
              <button
                onClick={() => onSimulateHazard('GAS')}
                className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
              >
                🔥 Gas Leak
              </button>
              <button
                onClick={() => onSimulateHazard('FIRE')}
                className="rounded bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300 border border-red-500/30 hover:bg-red-500/20"
              >
                🚨 Fire Risk
              </button>
              <button
                onClick={() => onSimulateHazard('MOLD')}
                className="rounded bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20"
              >
                💧 Mold / High Humidity
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable "How Spark Thinks" Guide */}
      <div className="mt-4 border-t border-zinc-800/80 pt-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center space-x-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition"
          >
            <Activity className="h-3.5 w-3.5 text-purple-400" />
            <span>How Spark AI Reasons (Sense ➔ Understand ➔ Reason ➔ Act)</span>
            {showHowItWorks ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() =>
              onAskSpark(
                hazardDetected
                  ? `Spark, why did you flag ${hazardTitle} in simple words?`
                  : `Spark, explain my current home readings in simple terms.`
              )
            }
            className="inline-flex items-center space-x-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-white transition hover:bg-zinc-700"
          >
            <span>Ask Spark AI</span>
            <ArrowRight className="h-3 w-3 text-zinc-400" />
          </button>
        </div>

        {/* How It Works Expanded Breakdown */}
        {showHowItWorks && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 font-sans text-xs">
            
            {/* 1. SENSE */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3.5">
              <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                <span>1. SENSE (Hardware)</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed font-mono">
                {measuredText}
              </p>
            </div>

            {/* 2. UNDERSTAND */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3.5">
              <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                <span>2. UNDERSTAND (Pattern)</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
                {detectedText}
              </p>
            </div>

            {/* 3. REASON */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3.5">
              <div className="flex items-center space-x-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-purple-400"></span>
                <span>3. REASON (Gemini AI)</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
                {inferredText}
              </p>
            </div>

            {/* 4. ACT */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3.5">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>4. RESPOND (Action)</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed font-medium">
                {recommendedText}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
