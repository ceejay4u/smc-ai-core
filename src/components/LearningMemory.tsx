import React, { useState } from "react";
import { 
  History, 
  Trash2, 
  RotateCcw, 
  Award, 
  AlertOctagon, 
  UserCheck, 
  Activity, 
  BookOpen, 
  BrainCircuit,
  Maximize2,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { JournaledTrade, LiquiditySweptType, StructureShiftType, SessionZoneType } from "../types";

interface LearningMemoryProps {
  trades: JournaledTrade[];
  onAddTrade: (trade: JournaledTrade) => void;
  onClearTradeLog: () => void;
  onSeedLogs: () => void;
}

export default function LearningMemory({ trades, onAddTrade, onClearTradeLog, onSeedLogs }: LearningMemoryProps) {
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: string;
    successFactors: string[];
    suggestedRules: string[];
  } | null>(null);
  const [errorText, setErrorText] = useState<string>("");
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Manual input state form
  const [newTrade, setNewTrade] = useState<Omit<JournaledTrade, "id">>({
    date: new Date().toISOString().split("T")[0],
    symbol: "XAUUSD",
    timeframe: "15M",
    direction: "Buy",
    setupScore: 85,
    riskPct: 1,
    rrRatio: 3.0,
    status: "Win",
    pips: 45,
    liquiditySwept: "Sell-Side",
    structureShift: "CHoCH (Change of Character)",
    sessionType: "New York"
  });

  // Calculate critical trade stats
  const stats = (() => {
    if (trades.length === 0) return { winRate: 0, profitFactor: 0, avgRR: 0, totalPips: 0, winCount: 0, lossCount: 0 };
    
    const wins = trades.filter((t) => t.status === "Win");
    const losses = trades.filter((t) => t.status === "Loss");
    
    // Winrate
    const winRate = (wins.length / trades.length) * 100;
    
    // Average RR
    const totalRR = trades.reduce((acc, curr) => acc + curr.rrRatio, 0);
    const avgRR = totalRR / trades.length;

    // Accumulate pips
    const totalPips = trades.reduce((acc, curr) => {
      return curr.status === "Win" ? acc + curr.pips : acc - Math.abs(curr.pips);
    }, 0);

    // Dynamic Profit Factor calculation: (Sum of Wins * RiskPct) / (Sum of Losses * RiskPct)
    const winProfit = wins.reduce((acc, curr) => acc + (curr.riskPct * curr.rrRatio), 0);
    const lossCost = losses.reduce((acc, curr) => acc + curr.riskPct, 0);
    const profitFactor = lossCost === 0 ? winProfit : winProfit / lossCost;

    return {
      winRate: Math.round(winRate),
      avgRR: parseFloat(avgRR.toFixed(1)),
      totalPips,
      winCount: wins.length,
      lossCount: losses.length,
      profitFactor: parseFloat(profitFactor.toFixed(2))
    };
  })();

  const triggerHistoryAudit = async () => {
    if (trades.length === 0) {
      setErrorText("No trade logs available to audit. Click 'Seed High-Prob Logs' first!");
      return;
    }
    
    setIsAuditing(true);
    setAnalysisResult(null);
    setErrorText("");

    try {
      const resp = await fetch("/api/gemini/analyze-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades })
      });

      if (!resp.ok) throw new Error("AI storage connector offline.");
      const data = await resp.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setErrorText(err.message || "Auditing previous outcomes failed.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTrade({
      ...newTrade,
      id: "manual_" + Math.random().toString(36).substr(2, 9)
    });
  };

  return (
    <div className="bg-[#11131a] border border-gray-850 rounded-xl p-5 shadow-2xl" id="learning-memory-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-gray-200 tracking-wider font-mono">
            ENGINE 7: LEARNING METRIC LABS & AI ADVISOR
          </h3>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onSeedLogs}
            className="px-2.5 py-1.5 bg-[#171b29] hover:bg-[#20263a] text-xs font-mono font-medium rounded text-gray-300 hover:text-white transition-all border border-[#2b334d]"
          >
            Seed Sample Logs
          </button>
          <button
            onClick={onClearTradeLog}
            className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-xs font-mono font-medium rounded text-red-400 hover:text-red-300 transition-all border border-red-900/40 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Statistics readout bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5 text-center">
        <div className="bg-[#0a0c12] p-3 rounded-lg border border-gray-850">
          <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest">TOTAL JOURNALED</span>
          <span className="text-lg font-mono font-extrabold text-gray-200">{trades.length} trades</span>
        </div>

        <div className="bg-[#0a0c12] p-3 rounded-lg border border-gray-850">
          <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest">WINRATE INDEX</span>
          <span className={`text-lg font-mono font-extrabold ${stats.winRate >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {stats.winRate}% (W: {stats.winCount} / L: {stats.lossCount})
          </span>
        </div>

        <div className="bg-[#0a0c12] p-3 rounded-lg border border-gray-850">
          <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest">PROFIT FACTOR</span>
          <span className={`text-lg font-mono font-extrabold ${stats.profitFactor >= 2.0 ? 'text-emerald-400' : stats.profitFactor >= 1.0 ? 'text-amber-400' : 'text-red-400'}`}>
            {stats.profitFactor} PF
          </span>
        </div>

        <div className="bg-[#0a0c12] p-3 rounded-lg border border-gray-850">
          <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest">AVERAGE R:R LEVEL</span>
          <span className="text-lg font-mono font-extrabold text-[#38bdf8]">{stats.avgRR}R</span>
        </div>

        <div className="bg-[#0a0c12] p-3 rounded-lg border border-gray-850 col-span-2 lg:col-span-1">
          <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest">NET PIP SCORE</span>
          <span className={`text-lg font-mono font-extrabold ${stats.totalPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.totalPips >= 0 ? `+${stats.totalPips}` : stats.totalPips} pips
          </span>
        </div>
      </div>

      {/* Main grids: left manual journal input, middle trade list, right AI feedback */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Left: Interactive Logs Journal Stream */}
        <div className="xl:col-span-7 space-y-4">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Outcome Memory Stack ({trades.length} records)
          </span>

          <div className="bg-[#08090d] border border-gray-850 rounded-lg overflow-y-auto max-h-[290px]">
            {trades.length === 0 ? (
              <div className="text-center p-8 text-gray-500 font-mono text-xs">
                Database stack is empty. Inject sample prop firm logs above or journal a setup!
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-[#0f111a] border-b border-gray-800 text-gray-400 select-none text-[10px] uppercase">
                    <th className="p-3">Session</th>
                    <th className="p-3">Setup</th>
                    <th className="p-3">Direction</th>
                    <th className="p-3">Risk %</th>
                    <th className="p-3">R:R Target</th>
                    <th className="p-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {trades.map((trade) => (
                    <React.Fragment key={trade.id}>
                      <tr 
                        onClick={() => setExpandedTradeId(expandedTradeId === trade.id ? null : trade.id)}
                        className="hover:bg-[#12141f]/40 text-gray-300 cursor-pointer transition-all"
                      >
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-[#1f2334] text-purple-300 text-[9px] font-mono tracking-tighter">
                            {trade.sessionType}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold flex items-center gap-1">
                            {trade.symbol} • {trade.timeframe}
                            <span className="text-[8px] text-purple-400 font-normal">[Click to Audit]</span>
                          </div>
                          <div className="text-[9px] text-gray-500 mt-0.5 max-w-[140px] truncate leading-none">
                            {trade.liquiditySwept !== "None" ? `Swept ${trade.liquiditySwept}` : "No Sweep Purge"}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`font-semibold ${trade.direction === "Buy" ? "text-emerald-400" : "text-red-400"}`}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="p-3 text-gray-350">{trade.riskPct}%</td>
                        <td className="p-3 text-[#38bdf8] font-bold">{trade.rrRatio}:1</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.status === "Win" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                              : "bg-red-500/10 text-red-400 border border-red-500/15"
                          }`}>
                            {trade.status === "Win" ? `WIN (+${trade.pips}p)` : `LOSS (-${trade.pips}p)`}
                          </span>
                        </td>
                      </tr>
                      {expandedTradeId === trade.id && (
                        <tr className="bg-[#11131c]/60 text-[10px] text-gray-400">
                          <td colSpan={6} className="p-3.5 border-t border-[#1e2338]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                              <div>
                                <span className="text-zinc-500 block text-[9px] font-black uppercase tracking-wider">Setup Conditions</span>
                                <span className="text-zinc-300 font-bold">{trade.liquiditySwept !== "None" ? `Swept ${trade.liquiditySwept}` : "No Liquidity Sweep"} paired with {trade.structureShift !== "None" ? trade.structureShift : "No Structure Shift"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] font-black uppercase tracking-wider">Confidence Calibration</span>
                                <span className="text-zinc-300 font-bold">{trade.setupScore || 85}% Statistical Alignment Score</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] font-black uppercase tracking-wider">Spread Conditions</span>
                                <span className="text-zinc-300">{trade.spreadConditions || "1.2 pips (Standard Premium Boundary)"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] font-black uppercase tracking-wider">Risk Decision State</span>
                                <span className="text-zinc-300">
                                  Leverage scaled to <strong className="text-orange-400">{trade.riskPct}%</strong> based on {trade.setupScore && trade.setupScore < 65 ? "Conservative buffer guidelines" : "Standard institutional allocation rules"}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] font-black uppercase tracking-wider font-bold">Trading Psychology Firewall</span>
                                <span className={`font-semibold uppercase tracking-wider ${
                                  trade.emotionalState === "Extreme Lockout" 
                                    ? "text-red-400" 
                                    : trade.emotionalState === "Elevated" 
                                      ? "text-amber-400" 
                                      : "text-emerald-400"
                                }`}>
                                  {trade.emotionalState || "Stable"} State Conformance Verified
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[9px] font-black uppercase tracking-wider font-bold">Execution Timing</span>
                                <span className="text-zinc-300 font-normal italic">{trade.executionTiming || "Standard Retest"}</span>
                              </div>
                              <div className="col-span-1 md:col-span-2">
                                <span className="text-zinc-500 block text-[9px] font-black uppercase tracking-wider">Persistent Entry Reasoning & Action Profile</span>
                                <p className="text-zinc-200 bg-black/45 p-2 rounded border border-gray-950 mt-1 italic font-mono leading-normal">
                                  {trade.entryReasoning || "Manual confirmed entry trigger on standard structural displacement retest inside Discount Fair Value Gap."}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick add form */}
          <form onSubmit={handleManualAdd} className="bg-[#0c0d12] p-3 rounded-lg border border-gray-850 font-mono text-xs text-gray-300 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[8px] text-gray-500 mb-1 leading-none uppercase">Type</label>
              <select 
                value={newTrade.sessionType} 
                onChange={(e) => setNewTrade({...newTrade, sessionType: e.target.value as SessionZoneType})}
                className="w-full bg-[#121520] border border-gray-800 p-1 rounded font-mono text-xs focus:outline-none"
              >
                <option value="London (Kill Zone)">London KZ</option>
                <option value="New York">New York AM</option>
                <option value="Asia">Asia Range</option>
              </select>
            </div>
            <div>
              <label className="block text-[8px] text-gray-500 mb-1 leading-none uppercase">Risk/Reward</label>
              <input 
                type="number" 
                step="0.1" 
                value={newTrade.rrRatio} 
                onChange={(e) => setNewTrade({...newTrade, rrRatio: Number(e.target.value)})}
                className="w-full bg-[#121520] border border-gray-800 p-1 rounded font-mono text-xs focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-[8px] text-gray-500 mb-1 leading-none id uppercase">Outcome</label>
              <select 
                value={newTrade.status} 
                onChange={(e) => setNewTrade({...newTrade, status: e.target.value as any, pips: e.target.value === "Win" ? 45 : 15})}
                className="w-full bg-[#121520] border border-gray-800 p-1 rounded font-mono text-xs focus:outline-none"
              >
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-1 rounded text-xs transition-all font-mono"
              >
                + Add Record
              </button>
            </div>
          </form>
        </div>

        {/* Right: AI Memory Audit Advisor */}
        <div className="xl:col-span-5 flex flex-col justify-between bg-[#0a0c12] border border-gray-850 rounded-xl p-4 min-h-[300px] relative overflow-hidden">
          
          {/* Audio overlay */}
          {isAuditing && (
            <div className="absolute inset-0 bg-[#0c0d12]/95 rounded-xl z-20 flex flex-col items-center justify-center p-6 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <div className="text-center space-y-1">
                <div className="text-indigo-400 text-xs font-mono uppercase tracking-widest font-bold">
                  Auditing Outcomes Database...
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  Isolating session anomalies • Generating dynamic rules
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 flex-1">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-850 pb-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              AI Intelligence Tuning Loop
            </span>

            {errorText && (
              <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded font-mono">
                {errorText}
              </div>
            )}

            {!analysisResult && !isAuditing ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <BookOpen className="w-8 h-8 text-gray-600 animate-pulse" />
                <div>
                  <span className="text-xs font-mono text-gray-400 font-semibold block uppercase">
                    AI INTELLIGENCE COLD
                  </span>
                  <p className="text-[11px] text-gray-500 max-w-xs mt-1">
                    Studies trade logs to find your optimal sessions and suggests direct filters to bypass losing streaks.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Text explanation */}
                <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1.5">Statistical Diagnosis</span>
                  <p className="text-[11px] text-gray-300 font-mono leading-relaxed bg-[#11131c] p-2.5 rounded border border-gray-850">
                    {analysisResult?.analysis}
                  </p>
                </div>

                {/* Successful Traits */}
                <div>
                  <span className="text-[8px] font-mono text-indigo-400 uppercase block tracking-widest font-bold mb-1">
                    ✓ HIGHEST RR PATTERN TRAITS:
                  </span>
                  <ul className="space-y-1 font-mono text-[10px] text-gray-400">
                    {analysisResult?.successFactors?.map((sf, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-emerald-500">•</span>
                        <span>{sf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Direct system safety filtering rules */}
                <div>
                  <span className="text-[8px] font-mono text-red-400 uppercase block tracking-widest font-bold mb-1">
                    ⚠️ PROPOSED FILTER RULES (PROTECT CAPITAL):
                  </span>
                  <ul className="space-y-1 font-mono text-[10px] text-amber-300">
                    {analysisResult?.suggestedRules?.map((rule, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-red-500">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-850">
            <button
              onClick={triggerHistoryAudit}
              disabled={isAuditing || trades.length === 0}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <BrainCircuit className="w-4 h-4" />
              RUN AI INTELLIGENCE LOOP
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
