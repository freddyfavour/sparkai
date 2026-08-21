'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { SensorMetrics, HazardAssessment } from '@/lib/sensorEngine';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'spark';
  text: string;
  timestamp: string;
  evidenceCard?: {
    room: string;
    riskLevel: string;
    hazardType: string;
    tempValue: string;
    tempDiff: string;
    gasValue: string;
    gasDiff: string;
    timestamp: string;
  };
}

interface SparkChatProps {
  metrics: SensorMetrics;
  assessment: HazardAssessment;
  selectedRoomName: string;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const SparkChat: React.FC<SparkChatProps> = ({
  metrics,
  assessment,
  selectedRoomName,
  externalPrompt,
  onClearExternalPrompt,
  isMaximized = false,
  onToggleMaximize,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'spark',
      text: `Hello! I'm **Spark**, your home environmental intelligence assistant.\n\nI continuously monitor your ESP32 sensors to explain what your environmental numbers mean in real human context. Ask me anything about your indoor air, gas levels, temperature trends, or safety recommendations!`,
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle incoming prompt passed from external buttons (e.g. from banner)
  useEffect(() => {
    if (externalPrompt) {
      handleSendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: textToSend,
          metrics,
          assessment,
          room: selectedRoomName,
          conversationHistory: messages.slice(-6),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const sparkMsg: Message = {
          id: `spark-${Date.now()}`,
          sender: 'spark',
          text: data.replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          evidenceCard: data.evidenceCard,
        };
        setMessages((prev) => [...prev, sparkMsg]);
      } else {
        throw new Error(data.error || 'Failed to generate AI response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: Message = {
        id: `spark-err-${Date.now()}`,
        sender: 'spark',
        text: `I had trouble connecting to my Gemini reasoning engine. However, based on local hardware telemetry in the **${selectedRoomName}**:\n\n• **Temperature:** ${metrics.temperature ?? '--'}°C\n• **Gas:** ${metrics.gas ?? '--'} PPM\n• **Status:** ${assessment.hazardTitle}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse Markdown **bold** and *italic* into bolded HTML elements
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      if (!line.trim()) return <div key={lineIdx} className="h-1.5" />;

      // Regex split for **bold** and *italic*
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);

      return (
        <p key={lineIdx} className="leading-relaxed">
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} className="font-bold text-zinc-950 dark:text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={partIdx} className="italic text-zinc-800 dark:text-zinc-200">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  const quickPrompts = [
    'Is my home 100% safe right now?',
    'Spark, wetin dey happen for kitchen?',
    'Explain my gas reading in simple words',
    'What should I do if gas goes high?',
  ];

  return (
    <div
      className={`flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 shadow-lg transition-all duration-300 ${
        isMaximized ? 'h-[calc(100vh-120px)] w-full' : 'h-[520px]'
      }`}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 px-4 py-3 bg-zinc-100/80 dark:bg-zinc-900/50 rounded-t-2xl">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-sans text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              Spark Conversational AI
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Gemini 2.5 Flash
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Contextual Reasoning & Honesty Engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMessages(messages.slice(0, 1))}
            className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
            title="Clear chat history"
          >
            Clear
          </button>

          {/* Maximize / Minimize Button */}
          {onToggleMaximize ? (
            <button
              onClick={onToggleMaximize}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
              title={isMaximized ? 'Minimize Chat' : 'Maximize Chat Fullscreen'}
            >
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          ) : isMaximized ? (
            <Link
              href="/"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
              title="Return to Dashboard"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/chat"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
              title="Open Fullscreen Chat Route (/chat)"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 ${
                msg.sender === 'user'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-700/60 rounded-br-none'
                  : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-bl-none'
              }`}
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-1.5 mb-2">
                <span className="font-mono text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  {msg.sender === 'user' ? (
                    <>
                      <User className="h-3 w-3 text-zinc-400" /> You
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Spark
                    </>
                  )}
                </span>
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500" suppressHydrationWarning>{msg.timestamp}</span>
              </div>

              {/* Formatted Message Text with Bolded Words */}
              <div className="space-y-1">
                {renderFormattedText(msg.text)}
              </div>

              {/* Attached Evidence Card */}
              {msg.evidenceCard && (
                <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 p-2.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800/60 pb-1 mb-1.5">
                    <span className="uppercase text-[10px] text-zinc-500">
                      ROOM EVIDENCE: {msg.evidenceCard.room}
                    </span>
                    <span
                      className={`px-1.5 rounded text-[10px] font-bold ${
                        msg.evidenceCard.riskLevel === 'SAFE'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {msg.evidenceCard.riskLevel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-zinc-700 dark:text-zinc-300">
                    <div>
                      Temp: <strong className="text-zinc-900 dark:text-white">{msg.evidenceCard.tempValue}</strong> ({msg.evidenceCard.tempDiff})
                    </div>
                    <div>
                      Gas: <strong className="text-zinc-900 dark:text-white">{msg.evidenceCard.gasValue}</strong> ({msg.evidenceCard.gasDiff})
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-none bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 text-xs text-zinc-600 dark:text-zinc-400 flex items-center space-x-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500 dark:text-emerald-400" />
              <span>Spark is analyzing sensor evidence & reasoning with Gemini...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Prompts */}
      <div className="flex items-center space-x-1.5 overflow-x-auto px-4 py-2 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800/60 no-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="flex-shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-[11px] text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-900/80 rounded-b-2xl flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask Spark about conditions in ${selectedRoomName}...`}
          className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold transition hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
