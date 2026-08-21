'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SparkChat } from '@/components/SparkChat';
import { Header } from '@/components/Header';
import { processSensorData, RawSensorData } from '@/lib/sensorEngine';
import { ArrowLeft, Cpu, Radio, ShieldCheck, Thermometer, Wind, Droplets } from 'lucide-react';

export default function ChatPage() {
  const [blynkToken] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [rawSensorData, setRawSensorData] = useState<RawSensorData>({
    v0: 25.3,
    v1: 56.0,
    v2: 164,
    isHardwareConnected: true,
  });

  const [selectedRoomId, setSelectedRoomId] = useState('kitchen');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchBlynkData = async () => {
      try {
        const res = await fetch(`/api/blynk?token=${encodeURIComponent(blynkToken)}&_t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) {
          setRawSensorData({
            v0: json.data.v0 ?? 25.3,
            v1: json.data.v1 ?? 56.0,
            v2: json.data.v2 ?? 164,
            v3: json.data.v3,
            v4: json.data.v4,
            isHardwareConnected: json.data.isHardwareConnected ?? true,
          });
        }
      } catch (err) {
        console.warn('Blynk fetch error:', err);
      }
    };

    fetchBlynkData();
    const interval = setInterval(fetchBlynkData, 5000);
    return () => clearInterval(interval);
  }, [blynkToken]);

  const { metrics, assessment, rooms } = processSensorData(rawSensorData);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Header */}
      <Header
        isHardwareConnected={metrics.isHardwareConnected}
        lastUpdated={metrics.lastUpdated}
        riskLevel={assessment.riskLevel}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenSettings={() => {}}
        onOpenAlertHistory={() => {}}
        alertCount={0}
      />

      {/* Main Fullscreen Layout */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 space-y-4">
        
        {/* Navigation Bar & Mode Badge */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>

          <div className="flex items-center space-x-2 font-mono text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Fullscreen Conversational Mode</span>
          </div>
        </div>

        {/* Fullscreen Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Left Room & Telemetry Sidebar (Span 4) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Room Selector */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider">
                Select Active Room Inspection
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      selectedRoomId === room.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{room.name}</span>
                      {room.hasHardwareSensor && <Cpu className="h-3 w-3 text-emerald-500" />}
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400 font-normal">
                      {room.riskLevel}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Telemetry Summary */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-4 shadow-sm space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-emerald-500" /> Live Hardware Telemetry
                </span>
                <span className="text-[10px] text-zinc-400">{selectedRoom.name}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-zinc-500">
                    <Thermometer className="h-3.5 w-3.5 text-orange-500" /> Temp:
                  </span>
                  <strong className="text-zinc-900 dark:text-white">
                    {metrics.temperature !== null ? `${metrics.temperature}°C` : '--'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-zinc-500">
                    <Wind className="h-3.5 w-3.5 text-amber-500" /> Gas Level:
                  </span>
                  <strong className="text-zinc-900 dark:text-white">
                    {metrics.gas !== null ? `${metrics.gas} PPM` : '--'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-zinc-500">
                    <Droplets className="h-3.5 w-3.5 text-cyan-500" /> Humidity:
                  </span>
                  <strong className="text-zinc-900 dark:text-white">
                    {metrics.humidity !== null ? `${metrics.humidity}%` : '--'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Chat Window (Span 8) */}
          <div className="lg:col-span-8">
            <SparkChat
              metrics={metrics}
              assessment={assessment}
              selectedRoomName={selectedRoom.name}
              isMaximized={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
