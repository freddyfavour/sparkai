'use client';

import React from 'react';
import { RoomState } from '@/lib/sensorEngine';
import { Cpu, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ArchitecturalFloorPlanProps {
  rooms: RoomState[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
}

export const ArchitecturalFloorPlan: React.FC<ArchitecturalFloorPlanProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
}) => {
  const getRoom = (id: string) => rooms.find((r) => r.id === id) || rooms[0];

  const kitchen = getRoom('kitchen');
  const living = getRoom('living');
  const bedroom = getRoom('bedroom');
  const garage = getRoom('garage');

  const selectedRoom = getRoom(selectedRoomId);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'border-red-500/80 bg-red-950/40 text-red-400 shadow-red-950/40 animate-pulse';
      case 'HIGH':
        return 'border-orange-500/70 bg-orange-950/30 text-orange-400 shadow-orange-950/30';
      case 'MEDIUM':
      case 'LOW':
        return 'border-amber-500/60 bg-amber-950/30 text-amber-300';
      case 'SAFE':
      default:
        return 'border-emerald-500/30 bg-zinc-900/60 text-zinc-300 hover:border-emerald-500/60';
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 shadow-inner space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-3 gap-2">
        <div>
          <h3 className="font-sans text-base font-bold tracking-tight text-white flex items-center gap-2">
            Interactive Home Floor Plan
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400 uppercase">
              Click Room to Inspect
            </span>
          </h3>
          <p className="text-xs text-zinc-400">
            Real-time room layout & hardware sensor map
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Safe</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <span>Watch</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
            <span>Hazard</span>
          </span>
        </div>
      </div>

      {/* Blueprint Grid Container */}
      <div className="relative grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12 min-h-[290px] p-2 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] rounded-xl border border-zinc-800/60">
        
        {/* KITCHEN - Primary Hardware Location (Span 7) */}
        <div
          onClick={() => onSelectRoom('kitchen')}
          className={`group relative cursor-pointer rounded-xl border p-4 transition-all duration-200 lg:col-span-7 flex flex-col justify-between ${getRiskColor(
            kitchen.riskLevel
          )} ${selectedRoomId === 'kitchen' ? 'ring-2 ring-emerald-400 border-emerald-400 shadow-md shadow-emerald-950/20' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  KITCHEN
                </span>
                {kitchen.hasHardwareSensor && (
                  <span className="flex items-center gap-1 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                    <Cpu className="h-3 w-3" /> ESP32 Hardware Live
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Primary Hardware Sensors (Temp, Humidity, Gas)
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                kitchen.riskLevel === 'SAFE'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {kitchen.riskLevel}
            </span>
          </div>

          {/* Telemetry row */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800/60 pt-3 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">Temp</span>
              <p className="text-sm font-bold text-white">
                {kitchen.temperature !== null ? `${kitchen.temperature}°C` : '--'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">Gas</span>
              <p className="text-sm font-bold text-white">
                {kitchen.gas !== null ? `${kitchen.gas} PPM` : '--'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">Humidity</span>
              <p className="text-sm font-bold text-white">
                {kitchen.humidity !== null ? `${kitchen.humidity}%` : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* LIVING ROOM (Span 5) */}
        <div
          onClick={() => onSelectRoom('living')}
          className={`group relative cursor-pointer rounded-xl border p-4 transition-all duration-200 lg:col-span-5 flex flex-col justify-between ${getRiskColor(
            living.riskLevel
          )} ${selectedRoomId === 'living' ? 'ring-2 ring-emerald-400 border-emerald-400' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                LIVING ROOM
              </span>
              <p className="mt-0.5 text-[11px] text-zinc-400">Adjacent lounge space</p>
            </div>
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
              {living.riskLevel}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800/60 pt-3 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">Temp</span>
              <p className="text-sm font-semibold text-zinc-200">
                {living.temperature !== null ? `${living.temperature}°C` : '--'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">Est. Gas</span>
              <p className="text-sm font-semibold text-zinc-200">
                {living.gas !== null ? `${living.gas} PPM` : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* MASTER BEDROOM (Span 6) */}
        <div
          onClick={() => onSelectRoom('bedroom')}
          className={`group relative cursor-pointer rounded-xl border p-4 transition-all duration-200 lg:col-span-6 flex flex-col justify-between ${getRiskColor(
            bedroom.riskLevel
          )} ${selectedRoomId === 'bedroom' ? 'ring-2 ring-emerald-400 border-emerald-400' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                MASTER BEDROOM
              </span>
              <p className="mt-0.5 text-[11px] text-zinc-400">Sleep & Rest zone</p>
            </div>
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
              {bedroom.riskLevel}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800/60 pt-3 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">Temp</span>
              <p className="text-sm font-semibold text-zinc-200">
                {bedroom.temperature !== null ? `${bedroom.temperature}°C` : '--'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">Humidity</span>
              <p className="text-sm font-semibold text-zinc-200">
                {bedroom.humidity !== null ? `${bedroom.humidity}%` : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* GARAGE / UTILITY (Span 6) */}
        <div
          onClick={() => onSelectRoom('garage')}
          className={`group relative cursor-pointer rounded-xl border p-4 transition-all duration-200 lg:col-span-6 flex flex-col justify-between ${getRiskColor(
            garage.riskLevel
          )} ${selectedRoomId === 'garage' ? 'ring-2 ring-emerald-400 border-emerald-400' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                GARAGE / UTILITY
              </span>
              <p className="mt-0.5 text-[11px] text-zinc-400">Storage & vehicle bay</p>
            </div>
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
              {garage.riskLevel}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800/60 pt-3 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">Temp</span>
              <p className="text-sm font-semibold text-zinc-200">
                {garage.temperature !== null ? `${garage.temperature}°C` : '--'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">Est. Gas</span>
              <p className="text-sm font-semibold text-zinc-200">
                {garage.gas !== null ? `${garage.gas} PPM` : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plain English Room Inspection Banner */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-white">Active Room Inspection: {selectedRoom.name}</span>
            <p className="text-zinc-400 text-[11px]">
              {selectedRoom.hasHardwareSensor
                ? `Direct ESP32 hardware sensors active (Temp: ${selectedRoom.temperature}°C, Gas: ${selectedRoom.gas} PPM, Humidity: ${selectedRoom.humidity}%). Status: Normal & Safe.`
                : `Spatial estimation zone based on central home hardware sensors. Status: ${selectedRoom.riskLevel}.`}
            </p>
          </div>
        </div>

        <span className="font-mono text-[11px] text-zinc-500 flex-shrink-0">
          Selected for AI Context
        </span>
      </div>
    </div>
  );
};
