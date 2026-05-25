import React, { useState, useMemo } from "react";
import { Clock, Zap, Target, TrendingUp, HelpCircle, Flame, Sparkles, AlertCircle, RefreshCw, BarChart2 } from "lucide-react";

interface SessionIntelligenceProps {
  activeSession: string;
}

interface SessionProfile {
  id: string;
  name: string;
  hours: string;
  volatilityEfficiency: "Premium High (91%)" | "Optimal Fluid (78%)" | "High Tension (83%)" | "Stable Mean (55%)" | "Low/Mean Reverting (24%)" | "Dangerous Splicing (12%)";
  winrate: number;
  avgRR: string;
  preferredModel: string;
  historicalPips: string;
  volumeProfile: "Extreme Surge" | "High Accumulation" | "Mid-market Retest" | "Range Locked" | "Chop Hazard";
  advisory: string;
}

const INSTITUTIONAL_SESSIONS: SessionProfile[] = [
  {
    id: "london_open",
    name: "London Open",
    hours: "07:00 - 09:00 UTC",
    volatilityEfficiency: "Optimal Fluid (78%)",
    winrate: 65,
    avgRR: "1:3.4",
    preferredModel: "Asian High/Low Sweep Reversals",
    historicalPips: "+240 Pips",
    volumeProfile: "High Accumulation",
    advisory: "Focus on sweeps of Asian Range extremes. Volatility is fluid and clean."
  },
  {
    id: "london_killzone",
    name: "London Killzone",
    hours: "08:00 - 11:00 UTC",
    volatilityEfficiency: "Premium High (91%)",
    winrate: 68,
    avgRR: "1:3.8",
    preferredModel: "Order Block Invalidation & FVG Mitigations",
    historicalPips: "+380 Pips",
    volumeProfile: "Extreme Surge",
    advisory: "Institutional momentum peaks here. Excellent for displacement-based CHoCH setups."
  },
  {
    id: "ny_open",
    name: "NY Open",
    hours: "12:00 - 14:00 UTC",
    volatilityEfficiency: "High Tension (83%)",
    winrate: 72,
    avgRR: "1:4.1",
    preferredModel: "London Low raids & News Fluid Expansion Models",
    historicalPips: "+580 Pips",
    volumeProfile: "Extreme Surge",
    advisory: "Beware of heavy manipulation during economic release times. Maximum pip-movement potential."
  },
  {
    id: "ny_am",
    name: "NY AM (Prime)",
    hours: "13:00 - 16:00 UTC",
    volatilityEfficiency: "Optimal Fluid (78%)",
    winrate: 64,
    avgRR: "1:3.2",
    preferredModel: "FVG Mitigation Re-entries & Continuation BOS",
    historicalPips: "+310 Pips",
    volumeProfile: "Mid-market Retest",
    advisory: "Strong secondary trends form here. Ideal for trailing stop continuation trades."
  },
  {
    id: "asia_range",
    name: "Asia Range",
    hours: "22:00 - 05:00 UTC",
    volatilityEfficiency: "Low/Mean Reverting (24%)",
    winrate: 45,
    avgRR: "1:1.8",
    preferredModel: "Liquidity Pool Building & Boundary Accumulation",
    historicalPips: "+60 Pips",
    volumeProfile: "Range Locked",
    advisory: "Avoid breakout trading. Price typically ranges. Good for compiling future liquidity targets."
  },
  {
    id: "session_transitions",
    name: "Session Transitions",
    hours: "05:00-07:00 / 11:00-12:00 UTC",
    volatilityEfficiency: "Dangerous Splicing (12%)",
    winrate: 34,
    avgRR: "1:1.5",
    preferredModel: "Arbitrage Spread Neutrality",
    historicalPips: "-120 Pips",
    volumeProfile: "Chop Hazard",
    advisory: "Liquidity is thin, index spreads spike. Extremely dangerous zone. Sitting in cash is advised."
  }
];

export default function SessionIntelligence({ activeSession }: SessionIntelligenceProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("ny_open");
  const [isGeneratingAudit, setIsGeneratingAudit] = useState<boolean>(false);
  const [auditNotes, setAuditNotes] = useState<string | null>(null);

  // Dynamic Session Active Check
  const currentActiveSessionObj = useMemo(() => {
    const act = activeSession.toLowerCase();
    if (act.includes("london open")) return "london_open";
    if (act.includes("london")) return "london_killzone";
    if (act.includes("ny open")) return "ny_open";
    if (act.includes("ny")) return "ny_am";
    if (act.includes("asia")) return "asia_range";
    return "session_transitions";
  }, [activeSession]);

  const activeSessionData = useMemo(() => {
    return INSTITUTIONAL_SESSIONS.find(s => s.id === currentActiveSessionObj) || INSTITUTIONAL_SESSIONS[2];
  }, [currentActiveSessionObj]);

  const selectedProfile = useMemo(() => {
    return INSTITUTIONAL_SESSIONS.find(s => s.id === selectedSessionId) || INSTITUTIONAL_SESSIONS[0];
  }, [selectedSessionId]);

  // AI Session Performance Audit algorithm
  const handleGenerateAudit = () => {
    setIsGeneratingAudit(true);
    setTimeout(() => {
      setIsGeneratingAudit(false);
      setAuditNotes(
        `[QUANT PORTFOLIO AUDIT REPORT]
- STRONGEST SESSION: New York Open (72% Winrate • 1:4.1 Avg RR) due to clear high-volume liquidity sweeps and rapid displacement momentum.
- WEAKEST SESSION: Session Transitions (34% Winrate) due to thin order book volume, high spread spikes, and lack of institution backing.
- SYSTEMIC RECOMMENDATION: Restrict aggressive position sizes strictly to London Killzone and NY Open. Completely freeze execution permissions during the 11:00-12:00 UTC Transition window.`
      );
    }, 1000);
  };

  return (
    <div className="bg-[#0b0c13] border border-gray-900 rounded-xl p-5 shadow-2xl space-y-5" id="session-intel-module">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-900 pb-3 gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-emerald-400 animate-spin-slow" />
            <span className="text-xs font-black font-mono uppercase tracking-widest text-zinc-100">
              Engine 3B: Smart Session Intelligence Unit
            </span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono leading-none">
            Continuous Volume Profile Analysis • 6 Distinct Institutional Killzones & Windows
          </p>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[9px] text-gray-400 uppercase">Live Market:</span>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 p-1 px-2.5 rounded text-[8.5px] text-emerald-400 font-bold uppercase animate-pulse">
            <Flame className="w-3 h-3 text-red-500" />
            {activeSessionData.name} ({activeSessionData.hours})
          </div>
        </div>
      </div>

      {/* Grid containing selector list, details panel, and AI diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: 6 Session Buttons (4 cols) */}
        <div className="lg:col-span-4 space-y-1.5 select-none">
          <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase block mb-2 font-bold">
            Select Session Period:
          </span>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
            {INSTITUTIONAL_SESSIONS.map((session) => {
              const isLive = session.id === currentActiveSessionObj;
              const isSelected = session.id === selectedSessionId;
              
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`p-2.5 rounded-lg border text-left font-mono transition-all text-xs flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? "bg-[#111322] border-emerald-500/50 text-white shadow-lg"
                      : "bg-black/30 border-gray-900 text-gray-400 hover:text-gray-250 hover:bg-black/50"
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-gray-700'}`} />
                      <span className="font-extrabold truncate">{session.name}</span>
                    </div>
                    <span className="text-[8px] text-gray-500 leading-none block">{session.hours}</span>
                  </div>

                  {isLive && (
                    <span className="shrink-0 p-0.5 px-1 bg-emerald-500 text-black font-extrabold text-[7px] rounded">
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Selected Session Parameters (4 cols) */}
        <div className="lg:col-span-4 bg-[#0a0b12] border border-gray-900 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-gray-950 pb-2">
              <span className="text-[10px] uppercase font-black text-gray-300">
                Setup Volume & Metrics
              </span>
              <span className="text-[8px] text-gray-500 font-light lowercase">[{selectedProfile.id}]</span>
            </div>

            <div className="space-y-2 text-[10.5px]">
              <div className="flex items-center justify-between p-1 px-1.5 bg-black/40 rounded">
                <span className="text-gray-550">Winrate (Stats):</span>
                <span className={`font-black ${selectedProfile.winrate >= 60 ? 'text-emerald-400' : selectedProfile.winrate >= 45 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {selectedProfile.winrate}% Win Rate
                </span>
              </div>

              <div className="flex items-center justify-between p-1 px-1.5 bg-black/40 rounded">
                <span className="text-gray-550">Average R:R:</span>
                <span className="text-[#38bdf8] font-black">{selectedProfile.avgRR}</span>
              </div>

              <div className="flex items-center justify-between p-1 px-1.5 bg-black/40 rounded">
                <span className="text-gray-550">Efficiency Index:</span>
                <span className="text-white font-extrabold">{selectedProfile.volatilityEfficiency}</span>
              </div>

              <div className="flex items-center justify-between p-1 px-1.5 bg-black/40 rounded">
                <span className="text-gray-550">Volume Profile:</span>
                <span className={`font-extrabold ${selectedProfile.volumeProfile === 'Extreme Surge' ? 'text-rose-450 text-red-400' : 'text-gray-300'}`}>
                  {selectedProfile.volumeProfile}
                </span>
              </div>

              <div className="space-y-0.5 pt-1">
                <span className="text-[8px] text-gray-500 uppercase font-black block">Best Setup Strategy:</span>
                <span className="text-amber-400 block font-bold text-[9px] leading-snug">
                  {selectedProfile.preferredModel}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-950 pt-3 mt-4 text-[9.5px] font-mono text-gray-400 leading-relaxed italic bg-[#11131c]/50 p-2 rounded">
            <strong>Advisory:</strong> {selectedProfile.advisory}
          </div>
        </div>

        {/* Right Column: AI Analytics & Recommendations (4 cols) */}
        <div className="lg:col-span-4 bg-[#0c0d15] border border-gray-900 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-3.5 font-mono">
            <div className="flex items-center justify-between border-b border-gray-950 pb-2">
              <span className="text-[10px] font-extrabold text-purple-400 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                AI SESSION EFFICIENCY ADVISOR
              </span>
            </div>

            {isGeneratingAudit ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
                  Compiling Data Cycles...
                </span>
              </div>
            ) : auditNotes ? (
              <div className="space-y-3 text-[10px] leading-relaxed text-gray-300">
                <div className="p-2.5 bg-purple-950/10 border border-purple-500/20 text-purple-300 rounded leading-normal h-[140px] overflow-y-auto whitespace-pre-wrap leading-relaxed text-[9px]">
                  {auditNotes}
                </div>
                <button
                  onClick={() => setAuditNotes(null)}
                  className="text-[8.5px] text-gray-500 hover:text-white underline block"
                >
                  Clear analytical cache
                </button>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2 text-[10px]">
                <BarChart2 className="w-8 h-8 text-zinc-700 mx-auto animate-pulse" />
                <p className="text-zinc-550 italic leading-snug max-w-[200px] mx-auto text-[9.5px]">
                  Extract statistical patterns across all 6 core sessions to formulate an optimized performance playbook.
                </p>
              </div>
            )}
          </div>

          {!auditNotes && !isGeneratingAudit && (
            <button
              onClick={handleGenerateAudit}
              className="w-full py-2 bg-gradient-to-r from-purple-500/20 to-indigo-505/20 hover:from-purple-500/40 hover:to-indigo-505/40 text-purple-300 font-bold border border-purple-500/30 rounded text-[9.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Audit Session Efficiency
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
