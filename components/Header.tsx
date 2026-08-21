'use client';

import React from 'react';
import { Cpu, Wifi, WifiOff, Volume2, VolumeX, Sliders, AlertTriangle, Sun, Moon } from 'lucide-react';
import { RiskLevel } from '@/lib/sensorEngine';

interface HeaderProps {
  isHardwareConnected: boolean;
  lastUpdated: string;
  riskLevel: RiskLevel;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenAlertHistory: () => void;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isHardwareConnected,
  lastUpdated,
  riskLevel,
  soundEnabled,
  onToggleSound,
  isDarkMode,
  onToggleTheme,
  onOpenSettings,
  onOpenAlertHistory,
  alertCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Left: Brand & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 border border-zinc-700/60 shadow-inner">
            <span className="font-mono text-lg font-black tracking-tighter text-white">S</span>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isHardwareConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isHardwareConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-sans text-xl font-bold tracking-tight text-zinc-900 dark:text-white">SPARK</h1>
              <span className="rounded bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400 uppercase border border-zinc-300 dark:border-zinc-700/50">
                v1.0 IoT Intelligence
              </span>
            </div>
            <p className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:block">
              Sensors detect conditions. Spark understands them.
            </p>
          </div>
        </div>

        {/* Center: Hardware Connection Status Badge */}
        <div className="hidden items-center space-x-4 md:flex">
          <div className="flex items-center space-x-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-900/90 px-3.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 shadow-sm">
            <Cpu className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="font-medium text-zinc-500 dark:text-zinc-400">ESP32 Device:</span>
            {isHardwareConnected ? (
              <span className="flex items-center font-semibold text-emerald-600 dark:text-emerald-400">
                <Wifi className="mr-1 h-3 w-3" /> Blynk Connected
              </span>
            ) : (
              <span className="flex items-center font-semibold text-amber-600 dark:text-amber-400">
                <WifiOff className="mr-1 h-3 w-3" /> Standby / Reconnecting
              </span>
            )}
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-500" suppressHydrationWarning>Live {lastUpdated}</span>
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Light / Dark Mode Switch */}
          <button
            onClick={onToggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-200 dark:hover:bg-zinc-800"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-700" />}
          </button>

          {/* Alert History Button */}
          <button
            onClick={onOpenAlertHistory}
            className="relative flex items-center space-x-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-200 dark:hover:bg-zinc-800"
            title="View Hazard Event History"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span className="hidden sm:inline">Alerts</span>
            {alertCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/40">
                {alertCount}
              </span>
            )}
          </button>

          {/* Sound Alarm Toggle */}
          <button
            onClick={onToggleSound}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition ${
              soundEnabled
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
            title={soundEnabled ? 'Hazard Audio Alert Enabled' : 'Hazard Audio Alert Muted'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-200 dark:hover:bg-zinc-800"
            title="Configure Blynk Auth & System Settings"
          >
            <Sliders className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
