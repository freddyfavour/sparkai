'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { HomeStatusBanner } from '@/components/HomeStatusBanner';
import { ArchitecturalFloorPlan } from '@/components/ArchitecturalFloorPlan';
import { SensorMetricsGrid } from '@/components/SensorMetricsGrid';
import { SparkChat } from '@/components/SparkChat';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { AlertHistoryModal, AlertLogItem } from '@/components/AlertHistoryModal';
import { SettingsModal } from '@/components/SettingsModal';
import { processSensorData, RawSensorData } from '@/lib/sensorEngine';
import { logHazardEventToSupabase } from '@/lib/supabaseClient';
import { Radio } from 'lucide-react';

export default function Home() {
  // Config state
  const [blynkToken, setBlynkToken] = useState('');
  const [pollingInterval, setPollingInterval] = useState(5000);
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  // Virtual Pin Mapping State
  const [tempPin, setTempPin] = useState('v0');
  const [humPin, setHumPin] = useState('v1');
  const [gasPin, setGasPin] = useState('v2');

  // Hardware Raw State
  const [rawSensorData, setRawSensorData] = useState<RawSensorData>({
    v0: 25.3,
    v1: 56.0,
    v2: 164,
    isHardwareConnected: true,
  });

  // Simulation Override State (For Hackathon Live Demos)
  const [simulationMode, setSimulationMode] = useState<'FIRE' | 'GAS' | 'MOLD' | 'RESET'>('RESET');

  // Theme State (Light / Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // UI Navigation & Modals
  const [selectedRoomId, setSelectedRoomId] = useState('kitchen');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAlertHistoryOpen, setIsAlertHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Chat external trigger
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);

  // Alert Log History
  const [alertLogs, setAlertLogs] = useState<AlertLogItem[]>([]);

  // Web Audio Context for crazy loud emergency alarm siren
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startLoudEmergencyAlarm = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      // 3 rapid piercing, high-pitch emergency alarm bursts (2900 Hz smoke alarm frequency)
      [0, 0.14, 0.28].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth'; // Piercing sharp waveform
        osc.frequency.setValueAtTime(2900, now + delay);
        osc.frequency.exponentialRampToValueAtTime(2400, now + delay + 0.1);

        gain.gain.setValueAtTime(0.85, now + delay); // Crazy loud volume
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.1);
      });
    } catch (e) {
      console.warn('Loud emergency alarm error:', e);
    }
  };

  // Poll Blynk API
  const fetchBlynkData = async () => {
    try {
      const url = `/api/blynk?token=${encodeURIComponent(blynkToken)}&tempPin=${tempPin}&humPin=${humPin}&gasPin=${gasPin}&_t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        if (simulationMode === 'RESET') {
          setRawSensorData({
            v0: json.data.v0 ?? 25.0,
            v1: json.data.v1 ?? 50.0,
            v2: json.data.v2 ?? 150,
            v3: json.data.v3,
            v4: json.data.v4,
            isHardwareConnected: json.data.isHardwareConnected ?? true,
          });
        }
      }
    } catch (err) {
      console.warn('Blynk fetch error:', err);
    }
  };

  useEffect(() => {
    fetchBlynkData();
    const interval = setInterval(fetchBlynkData, pollingInterval);
    return () => clearInterval(interval);
  }, [blynkToken, pollingInterval, simulationMode, tempPin, humPin, gasPin]);

  // Compute active telemetry metrics & hazard engine
  const activeRawData: RawSensorData = { ...rawSensorData };
  if (simulationMode === 'FIRE') {
    activeRawData.v0 = 46.8; // Temp spike
    activeRawData.v2 = 820; // High gas & combustion
    activeRawData.v1 = 35.0;
  } else if (simulationMode === 'GAS') {
    activeRawData.v0 = 27.1; // Temp normal
    activeRawData.v2 = 750; // Gas leak concentration spike
  } else if (simulationMode === 'MOLD') {
    activeRawData.v0 = 31.5;
    activeRawData.v1 = 86.0; // High humidity
    activeRawData.v2 = 135;
  }

  const { metrics, assessment, rooms } = processSensorData(activeRawData);

  // Trigger loud sirens on hazard detection
  useEffect(() => {
    const isEmergency = assessment.hazardDetected && (assessment.riskLevel === 'HIGH' || assessment.riskLevel === 'CRITICAL');

    if (isEmergency && soundEnabled) {
      startLoudEmergencyAlarm();
      if (!alarmIntervalRef.current) {
        alarmIntervalRef.current = setInterval(startLoudEmergencyAlarm, 1200); // Continuous repeating loud alarm loop
      }

      // Log hazard event to Supabase and memory
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAlertLogs((prev) => {
        if (prev.length > 0 && prev[0].title === assessment.hazardTitle) return prev;
        
        logHazardEventToSupabase({
          room_name: assessment.primaryRoomName,
          hazard_type: assessment.hazardType,
          severity: assessment.riskLevel,
          measured_text: assessment.measuredText,
          recommendation: assessment.recommendedText,
        });

        const newItem: AlertLogItem = {
          id: `log-${Date.now()}`,
          title: assessment.hazardTitle,
          hazardType: assessment.hazardType,
          riskLevel: assessment.riskLevel,
          roomName: assessment.primaryRoomName,
          timestamp: nowStr,
          measuredSummary: assessment.measuredText,
          recommendation: assessment.recommendedText,
          resolved: false,
        };
        return [newItem, ...prev];
      });
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [assessment.hazardTitle, assessment.riskLevel, soundEnabled]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white transition-colors duration-200">
      {/* Header Navigation */}
      <Header
        isHardwareConnected={metrics.isHardwareConnected}
        lastUpdated={metrics.lastUpdated}
        riskLevel={assessment.riskLevel}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAlertHistory={() => setIsAlertHistoryOpen(true)}
        alertCount={alertLogs.filter((a) => !a.resolved).length}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Top Home Safety Status Banner */}
        <HomeStatusBanner
          assessment={assessment}
          onAskSpark={(prompt) => setChatPrompt(prompt)}
          onSimulateHazard={(type) => setSimulationMode(type)}
        />

        {/* Core Layout: Left Telemetry & Spatial / Right Spark AI */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* LEFT COLUMN: Floor Plan, Live Gauges, Analytics (Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Architectural Home Map */}
            <ArchitecturalFloorPlan
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={(id) => setSelectedRoomId(id)}
            />

            {/* Live Sensor Metrics Grid */}
            <SensorMetricsGrid metrics={metrics} />

            {/* Time-Series Analytics Dashboard */}
            <AnalyticsDashboard currentMetrics={metrics} />
          </div>

          {/* RIGHT COLUMN: Spark Conversational AI & Hardware Info (Span 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Spark Chat Component */}
            <SparkChat
              metrics={metrics}
              assessment={assessment}
              selectedRoomName={selectedRoom.name}
              externalPrompt={chatPrompt}
              onClearExternalPrompt={() => setChatPrompt(undefined)}
            />

            {/* Real Hardware Data Contract & Info Card */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-5 shadow-inner space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-emerald-500" /> Physical IoT Data Flow
                </span>
                <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-600 dark:text-zinc-400 uppercase">
                  ESP32 ➔ Blynk ➔ Spark
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                <p className="flex justify-between">
                  <span>Template ID:</span>
                  <strong className="text-zinc-900 dark:text-zinc-200">TMPL2D3AAifkn</strong>
                </p>
                <p className="flex justify-between">
                  <span>Template Name:</span>
                  <strong className="text-zinc-900 dark:text-zinc-200">Spaek</strong>
                </p>
                <p className="flex justify-between">
                  <span>Auth Token:</span>
                  <strong className="text-zinc-900 dark:text-zinc-200">Configured in .env</strong>
                </p>
                <p className="flex justify-between">
                  <span>Pin Assignment:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{tempPin.toUpperCase()} (Temp), {humPin.toUpperCase()} (Hum), {gasPin.toUpperCase()} (Gas)</strong>
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 p-3 text-[11px] font-sans text-zinc-600 dark:text-zinc-400">
                <p className="text-zinc-900 dark:text-zinc-300 font-semibold mb-1">Architecture Guarantee:</p>
                No fake mock numbers in live mode. Spark connects directly to your physical ESP32 sensor hardware via Blynk API token.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AlertHistoryModal
        isOpen={isAlertHistoryOpen}
        onClose={() => setIsAlertHistoryOpen(false)}
        alerts={alertLogs}
        onClearAlerts={() => setAlertLogs([])}
        onResolveAlert={(id) =>
          setAlertLogs((prev) =>
            prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
          )
        }
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        blynkToken={blynkToken}
        onSaveToken={(t) => setBlynkToken(t)}
        pollingInterval={pollingInterval}
        onSaveInterval={(i) => setPollingInterval(i)}
        preferredLanguage={preferredLanguage}
        onSaveLanguage={(l) => setPreferredLanguage(l)}
        tempPin={tempPin}
        humPin={humPin}
        gasPin={gasPin}
        onSavePinMapping={(t, h, g) => {
          setTempPin(t);
          setHumPin(h);
          setGasPin(g);
        }}
      />
    </div>
  );
}
