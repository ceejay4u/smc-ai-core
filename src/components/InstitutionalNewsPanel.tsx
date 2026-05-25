import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, ShieldAlert, BadgeInfo, Bell } from "lucide-react";

interface HighImpactEvent {
  id: string;
  title: string;
  impact: "HIGH" | "MEDIUM";
  scheduledInSeconds: number; // dynamically ticks down
  currency: string;
  lockoutActive: boolean;
}

export default function InstitutionalNewsPanel() {
  const [events, setEvents] = useState<HighImpactEvent[]>([
    {
      id: "fomc",
      title: "FOMC Fed Interest Rate Decision",
      impact: "HIGH",
      scheduledInSeconds: 310, // ~5 minutes
      currency: "USD",
      lockoutActive: false
    },
    {
      id: "nfp",
      title: "US Non-Farm Payrolls (NFP) Release",
      impact: "HIGH",
      scheduledInSeconds: 1540, // ~25 minutes
      currency: "USD",
      lockoutActive: false
    },
    {
      id: "cpi",
      title: "Core CPI Inflation m/m",
      impact: "HIGH",
      scheduledInSeconds: 3600, // ~1 hour
      currency: "USD",
      lockoutActive: false
    }
  ]);

  // Dynamic countdown timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      setEvents(prev =>
        prev.map(evt => {
          const nextSec = Math.max(0, evt.scheduledInSeconds - 1);
          // Lockout triggers within 300 seconds (5 mins) of a HIGH impact news event
          const nextLockout = evt.impact === "HIGH" && nextSec <= 300 && nextSec > 0;
          return {
            ...evt,
            scheduledInSeconds: nextSec,
            lockoutActive: nextLockout
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format seconds to high precision countdown
  const formatCountdown = (seconds: number) => {
    if (seconds === 0) return "RELEASED (FREEZE ACTIVE)";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isAnyLockoutActive = events.some(e => e.lockoutActive || e.scheduledInSeconds === 0);

  return (
    <div className="bg-[#0b0c13] border border-gray-900 rounded-xl p-4 sm:p-5 shadow-xl space-y-4" id="institutional-news-rules">
      <div className="flex items-center justify-between border-b border-gray-900 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-black font-mono uppercase tracking-widest text-zinc-100">
            Engine 13B: Institutional News Risk Layer
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black ${
          isAnyLockoutActive ? "bg-rose-500/20 text-rose-450 border border-rose-500/30 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        }`}>
          {isAnyLockoutActive ? "NEWS LOCKOUT ACTIVE" : "SYSTEM STABLE"}
        </span>
      </div>

      {isAnyLockoutActive && (
        <div className="p-3 bg-rose-950/40 border border-rose-900/30 rounded-lg flex items-start gap-2.5 text-[10px] font-mono text-rose-400 leading-normal animate-pulse">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase block tracking-wider mb-0.5">HIGH IMPACT RISK BLOCK IN EFFECT</span>
            Algorithmic protection engaged. Volatility expansion & high-drawdown slippage parameters statistically aligned. Spread threshold expanded to restrict automated executions within +/- 5 minutes of high-tier releases.
          </div>
        </div>
      )}

      {/* List of Scheduled Events with Live Countdowns */}
      <div className="space-y-2">
        {events.map((evt, idx) => {
          const isCritical = evt.scheduledInSeconds <= 300;
          return (
            <div 
              key={evt.id} 
              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono transition-all ${
                evt.scheduledInSeconds === 0
                  ? "bg-red-950/20 border-red-900/40 text-red-400"
                  : isCritical
                    ? "bg-rose-950/10 border-rose-900/30 text-rose-450 scale-[1.01]"
                    : "bg-black/25 border-gray-955 border-gray-900/40 text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1 px-1.5 rounded text-[8px] font-black ${
                  evt.impact === "HIGH" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-yellow-500/10 text-yellow-400"
                }`}>
                  {evt.impact}
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-100 block">{evt.title}</span>
                  <span className="text-[8px] text-zinc-500 block uppercase mt-0.5">Asset Impact: {evt.currency} Pairs & Commodities</span>
                </div>
              </div>

              <div className="text-right self-start sm:self-auto">
                <span className="text-[8px] text-zinc-500 uppercase block tracking-wider">Countdown</span>
                <span className={`text-[11px] font-black ${
                  evt.scheduledInSeconds === 0
                    ? "text-red-505 font-bold animate-ping text-red-500"
                    : isCritical
                      ? "text-rose-400 animate-pulse"
                      : "text-zinc-100"
                }`}>
                  {formatCountdown(evt.scheduledInSeconds)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-2.5 bg-zinc-900/40 rounded border border-zinc-950 flex items-center gap-2 text-[9px] font-mono text-zinc-500">
        <BadgeInfo className="w-3.5 h-3.5 text-[#38bdf8]" />
        <span>Spread Lock alerts trigger automatically 60s before FOMC and NFP releases. Max slippage is capped at 3.5 pips.</span>
      </div>
    </div>
  );
}
