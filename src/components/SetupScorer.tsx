import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  HelpCircle, 
  Settings, 
  AlertTriangle, 
  Cpu, 
  CheckCircle,
  TrendingDown,
  Sparkles,
  DollarSign
} from "lucide-react";
import { 
  SMCTradeSetup, 
  AIGradeResponse,
  LiquiditySweptType,
  StructureShiftType,
  FairValueGapType,
  SessionZoneType
} from "../types";

interface SetupScorerProps {
  setup: SMCTradeSetup;
  onUpdateSetup: (updated: Partial<SMCTradeSetup>) => void;
  onSaveJournal: (setup: SMCTradeSetup, rating: string) => void;
}

export default function SetupScorer({ setup, onUpdateSetup, onSaveJournal }: SetupScorerProps) {
  const [accountBalance, setAccountBalance] = useState<number>(50000);
  const [stopLossPips, setStopLossPips] = useState<number>(20);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<AIGradeResponse | null>(null);
  const [errorText, setErrorText] = useState<string>("");

  // Rule-based core local score calculator (out of 100)
  const calculatedScore = (() => {
    let score = 0;
    // Liquidity Swept counts for up to 30 points
    if (setup.liquiditySwept === "Buy-Side" || setup.liquiditySwept === "Sell-Side") score += 30;
    else if (setup.liquiditySwept === "Equal Highs") score += 15;
    
    // Structure Shift counts for 25 points
    if (setup.structureShift !== "None") score += 25;
    
    // Sessions count for 20 points
    if (setup.sessionType === "London (Kill Zone)") score += 20;
    else if (setup.sessionType === "New York") score += 15;
    else if (setup.sessionType === "Asia") score += 8;

    // Displacement counts for 15 points
    if (setup.displacement) score += 15;

    // FVG counts for 10 points
    if (setup.fairValueGapMatched !== "No") score += 10;

    return Math.min(100, score);
  })();

  // Sync state score when parameters change
  useEffect(() => {
    if (calculatedScore !== setup.multiplierScore) {
      onUpdateSetup({ multiplierScore: calculatedScore });
    }
  }, [calculatedScore]);

  // Sizing Formula: Risk Amount = (Balance * (Risk % / 100))
  // Lot size on XAUUSD Standard Lot = Risk Amount / (Stop Loss Pips * $10 per pip)
  const lotSizing = (() => {
    const riskAmount = accountBalance * (setup.riskPercentage / 100);
    const pipValue = 10; // XAUUSD standard gold pip multiplier
    const rawLotSize = riskAmount / (stopLossPips * pipValue);
    return {
      riskAmount: riskAmount.toFixed(2),
      lots: Math.max(0.01, parseFloat(rawLotSize.toFixed(2))),
      drawdownTrigger: (accountBalance * 0.05).toFixed(2) // 5% max daily drawdown limit
    };
  })();

  const triggerAudit = async () => {
    setIsAnalyzing(true);
    setAiReport(null);
    setErrorText("");

    try {
      const resp = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setup)
      });
      if (!resp.ok) throw new Error("Could not connect to full-stack AI layer.");
      
      const data = await resp.json();
      setAiReport(data);
    } catch (err: any) {
      setErrorText(err.message || "Auditing failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="setup-scorer-panel">
      
      {/* 1. Technical Selector form */}
      <div className="bg-[#11131a] border border-gray-850 p-5 rounded-xl space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
          <Cpu className="w-5 h-5 text-sky-400" />
          <h4 className="text-sm font-semibold text-gray-200 tracking-wider font-mono">
            RULE-BASED SMC FORMULATOR
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              Symbol Focus
            </label>
            <select
              value={setup.symbol}
              onChange={(e) => onUpdateSetup({ symbol: e.target.value })}
              className="w-full bg-[#0a0c12] border border-gray-800 text-gray-200 text-xs py-2 px-3 rounded font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="XAUUSD">XAUUSD (Gold)</option>
              <option value="EURUSD">EURUSD</option>
              <option value="GBPUSD">GBPUSD</option>
              <option value="BTCUSD">BTCUSD (Bitcoin)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              Timeframe Setup
            </label>
            <select
              value={setup.timeframe}
              onChange={(e) => onUpdateSetup({ timeframe: e.target.value })}
              className="w-full bg-[#0a0c12] border border-gray-800 text-gray-200 text-xs py-2 px-3 rounded font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="15M">15 Minutes (Entry)</option>
              <option value="1H">1 Hour (Intraday)</option>
              <option value="4H">4 Hours (HTF Bias)</option>
              <option value="1D">1 Day (Swing Frame)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              Trading Direction
            </label>
            <div className="flex bg-[#0a0c12] p-1 rounded border border-gray-800">
              <button
                onClick={() => onUpdateSetup({ direction: "Buy" })}
                className={`flex-1 py-1 text-xs rounded font-semibold text-center font-mono ${
                  setup.direction === "Buy" 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Buy (Long)
              </button>
              <button
                onClick={() => onUpdateSetup({ direction: "Sell" })}
                className={`flex-1 py-1 text-xs rounded font-semibold text-center font-mono ${
                  setup.direction === "Sell" 
                    ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Sell (Short)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              Prerequisite Sweep
            </label>
            <select
              value={setup.liquiditySwept}
              onChange={(e) => onUpdateSetup({ liquiditySwept: e.target.value as LiquiditySweptType })}
              className="w-full bg-[#0a0c12] border border-gray-800 text-gray-200 text-xs py-2 px-3 rounded font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="None">None (Gambling prior to sweep)</option>
              <option value="Buy-Side">Buy-Side Liquidity (BSL) Swept</option>
              <option value="Sell-Side">Sell-Side Liquidity (SSL) Swept</option>
              <option value="Equal Highs">Equal Highs (EQH) tapped</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              Market Break (BOS/CHoCH)
            </label>
            <select
              value={setup.structureShift}
              onChange={(e) => onUpdateSetup({ structureShift: e.target.value as StructureShiftType })}
              className="w-full bg-[#0a0c12] border border-gray-800 text-gray-200 text-xs py-2 px-3 rounded font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="None">None (No structure shift)</option>
              <option value="BOS (Break of Structure)">Break of Structure (BOS)</option>
              <option value="MSS (Market Structure Shift)">Structure Shift (MSS)</option>
              <option value="CHoCH (Change of Character)">Change of Character (CHoCH)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              Session Zone Timing
            </label>
            <select
              value={setup.sessionType}
              onChange={(e) => onUpdateSetup({ sessionType: e.target.value as SessionZoneType })}
              className="w-full bg-[#0a0c12] border border-gray-800 text-gray-200 text-xs py-2 px-3 rounded font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="None">Outside Kill Zones</option>
              <option value="Asia">Asia Session Range</option>
              <option value="London (Kill Zone)">London Open (Kill Zone)</option>
              <option value="New York">New York Open / AM Session</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
              Fair Value Gap (FVG)
            </label>
            <select
              value={setup.fairValueGapMatched}
              onChange={(e) => onUpdateSetup({ fairValueGapMatched: e.target.value as FairValueGapType })}
              className="w-full bg-[#0a0c12] border border-gray-800 text-gray-200 text-xs py-2 px-3 rounded font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="No">No overlapping FVG</option>
              <option value="Yes (Premium Area)">Yes (Premium Discount quadrant)</option>
              <option value="Yes (Discount Area)">Yes (Discount Entry Area)</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-between bg-[#0a0c12] p-2 rounded border border-gray-850">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              Displacement Thrust
            </span>
            <input
              type="checkbox"
              checked={setup.displacement}
              onChange={(e) => onUpdateSetup({ displacement: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-500 bg-gray-900 border-gray-800 focus:ring-sky-500 accent-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
            Setup Notes & Context
          </label>
          <textarea
            value={setup.notes}
            onChange={(e) => onUpdateSetup({ notes: e.target.value })}
            placeholder="Add structural narrative: HTF bias, premium ratio, multi-session liquitidity goals..."
            rows={2}
            className="w-full bg-[#0a0c12] border border-gray-805 text-gray-200 text-xs py-2 px-3 rounded font-mono focus:outline-none focus:border-sky-500"
          ></textarea>
        </div>

        {/* Local score readout & AI Button */}
        <div className="pt-4 border-t border-gray-800 flex items-center justify-between gap-4">
          <div className="p-2.5 px-3 bg-gray-950 rounded-lg flex items-center gap-3 border border-gray-800">
            <div>
              <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
                Local Rating
              </div>
              <div className="text-xl font-mono font-bold text-gray-100 flex items-baseline">
                {calculatedScore}
                <span className="text-xs text-gray-500">/100</span>
              </div>
            </div>
            <div className={`h-8 w-[2px] ${
              calculatedScore >= 80 ? 'bg-emerald-500' : calculatedScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            <div className="text-[10px] font-mono leading-none">
              {calculatedScore >= 85 ? (
                <span className="text-emerald-400 font-bold uppercase">SMC A+ Setup</span>
              ) : calculatedScore >= 60 ? (
                <span className="text-amber-400 font-bold uppercase">Average Setup (B)</span>
              ) : (
                <span className="text-red-400 font-bold uppercase">High Risk (C/D)</span>
              )}
              <div className="text-[8px] text-gray-500 mt-1">Rule-Base Confirmed</div>
            </div>
          </div>

          <button
            onClick={triggerAudit}
            disabled={isAnalyzing}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-mono text-xs font-bold rounded-lg shadow-lg hover:shadow-emerald-500/10 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            {isAnalyzing ? "AUDITING BIAS..." : "RUN AI SMC AUDIT"}
          </button>
        </div>
      </div>

      {/* 2. Risk Engine & AI Output Result Card */}
      <div className="space-y-4">
        
        {/* Risk Calculator Section */}
        <div className="bg-[#11131a] border border-gray-850 p-4 rounded-xl shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold text-gray-200 tracking-wider font-mono">
              ENGINE 4: ADAPTIVE LOT CALCULATOR (RISK CORE)
            </h4>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] uppercase font-mono tracking-wider text-gray-400 mb-1">
                Fund Capital ($)
              </label>
              <input
                type="number"
                value={accountBalance}
                onChange={(e) => setAccountBalance(Number(e.target.value))}
                className="w-full bg-[#0a0c12] border border-gray-800 text-gray-200 text-xs py-1.5 px-2 rounded font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase font-mono tracking-wider text-gray-400 mb-1">
                Stop Loss (Pips)
              </label>
              <input
                type="number"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(Number(e.target.value))}
                className="w-full bg-[#0a0c12] border border-gray-800 text-gray-200 text-xs py-1.5 px-2 rounded font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase font-mono tracking-wider text-gray-400 mb-1">
                Max Budget %
              </label>
              <input
                type="number"
                step="0.1"
                value={setup.riskPercentage}
                onChange={(e) => onUpdateSetup({ riskPercentage: Number(e.target.value) })}
                className="w-full bg-[#0a0c12] border border-gray-800 text-gray-200 text-xs py-1.5 px-2 rounded font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Sizing result stats */}
          <div className="grid grid-cols-3 gap-2 mt-3 bg-[#0a0b10] p-2.5 rounded border border-gray-850">
            <div className="text-center border-r border-gray-850">
              <span className="text-[8px] font-mono text-gray-500 block">RISK AT STAKE</span>
              <span className="text-xs font-mono font-bold text-red-400">${lotSizing.riskAmount}</span>
            </div>
            <div className="text-center border-r border-gray-850">
              <span className="text-[8px] font-mono text-gray-400 block">OPTIMAL LOT SIZE</span>
              <span className="text-xs font-mono font-black text-emerald-400">{lotSizing.lots} Standard</span>
            </div>
            <div className="text-center">
              <span className="text-[8px] font-mono text-gray-500 block">5% DD TRIGGER</span>
              <span className="text-xs font-mono text-gray-400">${lotSizing.drawdownTrigger}</span>
            </div>
          </div>
        </div>

        {/* AI Report Card */}
        <div className="bg-[#11131a] border border-gray-850 rounded-xl p-5 shadow-2xl relative min-h-[220px] flex flex-col justify-between">
          
          {/* Loading state overlay with institutional instructions */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-[#0c0d12]/95 rounded-xl z-20 flex flex-col items-center justify-center p-6 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <div className="text-center space-y-1">
                <div className="text-emerald-400 text-xs font-mono uppercase tracking-widest font-bold">
                  Evaluating Smart Money Alignment...
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  Skepticizing retail trap zones • Synthesizing session flows
                </div>
              </div>
            </div>
          )}

          {!aiReport && !isAnalyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <Cpu className="w-8 h-8 text-gray-600 animate-pulse" />
              <div>
                <span className="text-xs font-mono text-gray-400 font-semibold block uppercase">
                  AI DECISION LAYER OFF
                </span>
                <p className="text-[11px] text-gray-550 max-w-xs mt-1 leading-relaxed">
                  Trigger an institutional AI SMC Audit above. The generator scans liquidity sweeps and suggests exact safety filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {/* Header result row */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">
                    AI INTELLIGENCE REPORTED
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400">GRADE ASSIGNED:</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                    aiReport?.rating.includes("A") 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : aiReport?.rating === "B" 
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}>
                    {aiReport?.rating}
                  </span>
                </div>
              </div>

              {/* Diagnosis narrative */}
              <div>
                <p className="text-[11px] text-gray-300 font-mono leading-relaxed bg-[#0a0c12] p-2.5 rounded border border-gray-850">
                  {aiReport?.reasoning}
                </p>
              </div>

              {/* Strengths & Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                <div className="space-y-1">
                  <div className="font-mono text-emerald-400 font-bold uppercase tracking-wider text-[9px]">
                    ✓ STRUCTURAL STRENGTHS:
                  </div>
                  <ul className="space-y-1 font-mono text-gray-400">
                    {aiReport?.strengths?.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-emerald-500">•</span>
                        <span className="leading-tight">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-amber-400 font-bold uppercase tracking-wider text-[9px]">
                    ⚠️ EXPOSURE RISK WARNINGS:
                  </div>
                  <ul className="space-y-1 font-mono text-gray-400">
                    {aiReport?.warnings?.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-amber-500">•</span>
                        <span className="leading-tight">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable dynamic filter recommendation */}
              <div className="bg-[#1f2112]/30 border border-amber-500/10 p-2.5 rounded-lg text-[10px] font-mono text-amber-300">
                <strong>💡 OPTIMIZER FILTER RULE:</strong> {aiReport?.suggestedFilters}
              </div>

              {/* Save Trade outcome to Learning Log */}
              <div className="pt-2 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => onSaveJournal(setup, aiReport?.rating || "B")}
                  className="px-3.5 py-1.5 bg-[#17202d] hover:bg-[#202d3e] text-sky-400 text-[10px] font-mono font-bold rounded border border-[#2a3c53] hover:border-sky-500 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Journal Trade Setup
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
