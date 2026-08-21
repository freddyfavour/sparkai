'use client';

import React, { useState } from 'react';
import { X, Sliders, Key, Cpu, RefreshCw, Check, Globe } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  blynkToken: string;
  onSaveToken: (token: string) => void;
  pollingInterval: number;
  onSaveInterval: (interval: number) => void;
  preferredLanguage: string;
  onSaveLanguage: (lang: string) => void;
  tempPin?: string;
  humPin?: string;
  gasPin?: string;
  onSavePinMapping?: (temp: string, hum: string, gas: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  blynkToken,
  onSaveToken,
  pollingInterval,
  onSaveInterval,
  preferredLanguage,
  onSaveLanguage,
  tempPin = 'v0',
  humPin = 'v1',
  gasPin = 'v2',
  onSavePinMapping,
}) => {
  const [tokenInput, setTokenInput] = useState(blynkToken);
  const [intervalInput, setIntervalInput] = useState(pollingInterval);
  const [langInput, setLangInput] = useState(preferredLanguage);
  
  const [tempPinInput, setTempPinInput] = useState(tempPin);
  const [humPinInput, setHumPinInput] = useState(humPin);
  const [gasPinInput, setGasPinInput] = useState(gasPin);

  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveToken(tokenInput);
    onSaveInterval(intervalInput);
    onSaveLanguage(langInput);
    if (onSavePinMapping) {
      onSavePinMapping(tempPinInput, humPinInput, gasPinInput);
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-zinc-900 dark:text-white">Spark Hardware Settings</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Blynk credentials & ESP32 pin mappings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="my-5 space-y-4 text-xs">
          
          {/* Blynk Auth Token */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-amber-500" /> Blynk Auth Token
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter your Blynk Auth Token"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {/* Virtual Pin Selector Mapping */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3 space-y-2 font-mono">
            <div className="flex items-center justify-between text-zinc-800 dark:text-zinc-200 font-bold">
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-emerald-500" /> Datastream Pin Mapping:
              </span>
              <span className="text-[10px] text-zinc-500">Virtual Pins</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-1 font-sans">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Temperature Pin</label>
                <select
                  value={tempPinInput}
                  onChange={(e) => setTempPinInput(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs font-mono"
                >
                  <option value="v0">V0 Pin</option>
                  <option value="v1">V1 Pin</option>
                  <option value="v2">V2 Pin</option>
                  <option value="v3">V3 Pin</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Humidity Pin</label>
                <select
                  value={humPinInput}
                  onChange={(e) => setHumPinInput(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs font-mono"
                >
                  <option value="v1">V1 Pin</option>
                  <option value="v0">V0 Pin</option>
                  <option value="v2">V2 Pin</option>
                  <option value="v3">V3 Pin</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Gas Level Pin</label>
                <select
                  value={gasPinInput}
                  onChange={(e) => setGasPinInput(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs font-mono"
                >
                  <option value="v2">V2 Pin</option>
                  <option value="v0">V0 Pin</option>
                  <option value="v1">V1 Pin</option>
                  <option value="v3">V3 Pin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Polling Interval */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-emerald-500" /> Polling Frequency
            </label>
            <select
              value={intervalInput}
              onChange={(e) => setIntervalInput(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value={3000}>3 Seconds (High Speed)</option>
              <option value={5000}>5 Seconds (Recommended)</option>
              <option value={10000}>10 Seconds (Standard)</option>
            </select>
          </div>

          {/* Language Preference */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-purple-500" /> Spark Language
            </label>
            <select
              value={langInput}
              onChange={(e) => setLangInput(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="English">English</option>
              <option value="Nigerian Pidgin">Nigerian Pidgin</option>
              <option value="Yoruba">Yoruba</option>
              <option value="Hausa">Hausa</option>
              <option value="Igbo">Igbo</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 px-4 py-2 text-xs font-bold transition hover:opacity-90"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
