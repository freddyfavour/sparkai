'use client';

import React from 'react';
import { X, AlertTriangle, ShieldCheck, Clock, Trash2, MapPin } from 'lucide-react';
import { RiskLevel } from '@/lib/sensorEngine';

export interface AlertLogItem {
  id: string;
  title: string;
  hazardType: string;
  riskLevel: RiskLevel;
  roomName: string;
  timestamp: string;
  measuredSummary: string;
  recommendation: string;
  resolved: boolean;
}

interface AlertHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertLogItem[];
  onClearAlerts: () => void;
  onResolveAlert: (id: string) => void;
}

export const AlertHistoryModal: React.FC<AlertHistoryModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onClearAlerts,
  onResolveAlert,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-white">Hazard Event History</h3>
              <p className="text-xs text-zinc-400">Recorded environmental anomalies & safety logs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="my-4 max-h-[400px] overflow-y-auto space-y-3 font-sans text-xs pr-1">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <ShieldCheck className="mx-auto h-8 w-8 text-emerald-400 opacity-60" />
              <p className="mt-2 font-medium">No hazard events logged.</p>
              <p className="text-[11px] text-zinc-600">Your home has maintained safe environmental parameters.</p>
            </div>
          ) : (
            alerts.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 transition ${
                  item.riskLevel === 'CRITICAL'
                    ? 'border-red-500/40 bg-red-950/20'
                    : item.riskLevel === 'HIGH'
                    ? 'border-orange-500/40 bg-orange-950/20'
                    : 'border-zinc-800 bg-zinc-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                          item.riskLevel === 'CRITICAL'
                            ? 'bg-red-500/30 text-red-300'
                            : 'bg-amber-500/30 text-amber-300'
                        }`}
                      >
                        {item.riskLevel}
                      </span>
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-zinc-400 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-zinc-500" /> {item.roomName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-zinc-500" /> {item.timestamp}
                      </span>
                    </div>
                  </div>

                  {!item.resolved ? (
                    <button
                      onClick={() => onResolveAlert(item.id)}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" /> Resolved
                    </span>
                  )}
                </div>

                <div className="mt-3 border-t border-zinc-800/60 pt-2 font-mono text-[11px] text-zinc-300 space-y-1">
                  <p>• {item.measuredSummary}</p>
                  <p className="text-zinc-400 font-sans">• <strong>Rec:</strong> {item.recommendation}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          {alerts.length > 0 ? (
            <button
              onClick={onClearAlerts}
              className="flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-red-400 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          ) : (
            <div></div>
          )}
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
