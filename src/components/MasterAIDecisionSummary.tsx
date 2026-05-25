import React from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Cpu, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  Zap,
  Percent,
  Info,
  Layers,
  Sparkles
} from "lucide-react";
import { MarketStateType } from "../types";

export interface TelemetryData {
  marketState: MarketStateType;
  livePrice: number;
  confidenceScore: number;
  bias: "Bullish" | "Bearish" | "Neutral";
  activeSession: string;
  executionStatus: "AUTHORIZED" | "BLOCKED" | "NO_TRADE";
  reasonSummary: string;
  spreadPips: number;
  cooldownSecondsRemaining: number;
  tradesThisSession: number;
}

interface MasterAIDecisionSummaryProps {
  telemetry: TelemetryData;
}

export default function MasterAIDecisionSummary({ telemetry }: MasterAIDecisionSummaryProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Determine dynamic visual environments based on marketState
  // Trending = Emerald, Ranging = Amber, High Volatility/Volatile/Expanding = Crimson, Low Liquidity = Indigo
  const getThemeColor = () => {
    switch (telemetry.marketState) {
      case "Trending":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          border: "border-emerald-500/30",
          accent: "emerald",
          glow: "shadow-emerald-500/5",
          badge: "bg-emerald-500 text-black",
          gradient: "from-emerald-500/20 via-transparent to-transparent"
        };
      case "Ranging":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/30",
          accent: "amber",
          glow: "shadow-amber-500/5",
          badge: "bg-amber-400 text-black",
          gradient: "from-amber-500/20 via-transparent to-transparent"
        };
      case "Expanding":
      case "Volatile":
        return {
          bg: "bg-rose-500/10",
          text: "text-rose-400",
          border: "border-rose-500/30",
          accent: "rose",
          glow: "shadow-rose-500/5",
          badge: "bg-rose-500 text-black",
          gradient: "from-rose-500/20 via-transparent to-transparent"
        };
      case "Low Liquidity":
        return {
          bg: "bg-indigo-500/10",
          text: "text-indigo-400",
          border: "border-indigo-500/30",
          accent: "indigo",
          glow: "shadow-indigo-500/5",
          badge: "bg-indigo-500 text-white",
          gradient: "from-indigo-500/20 via-transparent to-transparent"
        };
      default:
        return {
          bg: "bg-sky-500/10",
          text: "text-sky-450",
          border: "border-sky-500/20",
          accent: "sky",
          glow: "shadow-sky-500/5",
          badge: "bg-sky-400 text-black",
          gradient: "from-sky-500/20 via-transparent to-transparent"
        };
    }
  };

  const theme = getThemeColor();

  // Weighted breakdown components of AI Score and Penalties
  // Formulas output points adding to or penalizing base confidence score
  const confidenceBreakdown = React.useMemo(() => {
    const isTrending = telemetry.marketState === "Trending";
    const isExpanding = telemetry.marketState === "Expanding";
    const isRange = telemetry.marketState === "Ranging";
    const isLowLiq = telemetry.marketState === "Low Liquidity";

    const htfAlignment = telemetry.bias === "Bullish" ? 15 : telemetry.bias === "Bearish" ? 15 : -10;
    const sweepQuality = telemetry.confidenceScore > 75 ? 20 : telemetry.confidenceScore > 50 ? 10 : -10;
    const sessionTiming = telemetry.activeSession.includes("Kill Zone") || telemetry.activeSession.includes("London") ? 15 : 5;
    const displacementStrength = (isTrending || isExpanding) ? 15 : -10;
    const spreadConditions = telemetry.spreadPips <= 1.2 ? 10 : telemetry.spreadPips <= 1.6 ? 5 : -15;
    const volatilityStability = telemetry.marketState === "Volatile" ? -10 : 10;
    const fvgQuality = telemetry.confidenceScore > 65 ? 10 : -10;
    const riskEnv = telemetry.tradesThisSession >= 2 ? -20 : telemetry.cooldownSecondsRemaining > 0 ? -25 : 5;

    return [
      { name: "HTF Alignment", pts: htfAlignment, max: 15 },
      { name: "Liquidity Sweep Quality", pts: sweepQuality, max: 20 },
      { name: "Session Timing", pts: sessionTiming, max: 15 },
      { name: "Displacement Strength", pts: displacementStrength, max: 15 },
      { name: "Spread Conditions", pts: spreadConditions, max: 10 },
      { name: "Volatility Stability", pts: volatilityStability, max: 10 },
      { name: "FVG Quality", pts: fvgQuality, max: 10 },
      { name: "Risk Environment", pts: riskEnv, max: 5 },
    ];
  }, [telemetry]);

  // Derive execution permission triggers based on state
  const executionTriggers = React.useMemo(() => {
    const records = [];

    // Checked variables to explain why authorized, blocked or in no trade env.
    if (telemetry.marketState === "Ranging") {
      records.push({ type: "risk", msg: "Ranging Market detected (low-momentum compression)", active: true });
    } else {
      records.push({ type: "success", msg: "Market State: High probability structure expansion", active: false });
    }

    if (telemetry.spreadPips > 1.5) {
      records.push({ type: "risk", msg: `Spread stability breach (Current: ${telemetry.spreadPips} pips)`, active: true });
    } else {
      records.push({ type: "success", msg: "Institutional spread bounds certified (< 1.5 pips)", active: false });
    }

    if (telemetry.bias === "Neutral") {
      records.push({ type: "risk", msg: "HTF conflict: Neutral price consolidation phase", active: true });
    } else {
      records.push({ type: "success", msg: `Bias confirmed: HTF ${telemetry.bias} alignment`, active: false });
    }

    if (telemetry.cooldownSecondsRemaining > 0) {
      records.push({ type: "risk", msg: `System Protection Active: ${telemetry.cooldownSecondsRemaining}s cooldown timer`, active: true });
    }

    if (telemetry.tradesThisSession >= 3) {
      records.push({ type: "risk", msg: "Session transaction ceiling locked (overtrading lockout)", active: true });
    }

    if (telemetry.confidenceScore < 60) {
      records.push({ type: "risk", msg: "Weak cumulative displacement / No FVG mitigation confirmed", active: true });
    }

    return records;
  }, [telemetry]);

  return (
    <div 
      id="master-ai-decision-panel" 
      className={`bg-zinc-950/90 border ${theme.border} rounded-xl p-4 sm:p-5 shadow-2xl relative overflow-hidden transition-all duration-300 ${theme.glow}`}
    >
      {/* Background radial gradient representing state adaptive glow */}
      <div className={`absolute top-0 left-0 w-80 h-32 bg-gradient-to-br ${theme.gradient} blur-3xl opacity-35 pointer-events-none transition-all duration-500`} />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-900 pb-3 gap-3 md:gap-6">
        {/* Unit Identity */}
        <div className="flex items-center gap-2.5">
          <div className="p-1 px-1.5 bg-gradient-to-r from-red-600 via-yellow-500 to-indigo-600 rounded text-black font-mono font-black text-[9px] tracking-wider uppercase select-none">
            MASTER CORE
          </div>
          <div>
            <h2 className="text-sm font-black tracking-widest text-zinc-100 font-mono uppercase">
              MASTER AI DECISION SUMMARY
            </h2>
            <p className="text-[10px] text-zinc-500 font-mono">
              Aggregate Intelligence Feed • Live Risk Protection Terminal Engine
            </p>
          </div>
        </div>

        {/* Operational Status indicator */}
        <div className="flex items-center gap-4 text-xs font-mono self-start md:self-auto select-none">
          <div className="text-right">
            <span className="text-[9px] text-zinc-500 block">TICKER PRICE</span>
            <span className="text-white font-black text-xs block">${telemetry.livePrice.toFixed(2)}</span>
          </div>
          <div className="h-6 w-[1px] bg-zinc-800" />
          <div className="text-right">
            <span className="text-[9px] text-zinc-500 block">VOLATILITY STATUS</span>
            <span className={`font-black text-xs block uppercase ${theme.text}`}>
              {telemetry.marketState}
            </span>
          </div>
          <div className="h-6 w-[1px] bg-zinc-800" />
          <button 
            type="button"
            id="btn-toggle-ai-summary"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 px-2 text-[10px] bg-zinc-900 border border-zinc-800 rounded text-zinc-400 hover:text-white transition-all font-bold"
          >
            {isCollapsed ? "[+] EXPAND" : "[-] MINIMIZE"}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Grid of Decision Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4">
        
        {/* MODULE 1: AI CONFIDENCE ENGINE BREAKDOWN (Weightings & Penalties) */}
        <div className="md:col-span-4 bg-black/60 border border-zinc-900 p-3 sm:p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-zinc-400" />
              AI confidence breakdown
            </span>
            <div className={`p-1 px-2.5 rounded font-mono font-black text-xs ${
              telemetry.confidenceScore >= 80 ? 'text-emerald-400 bg-emerald-500/10' : telemetry.confidenceScore >= 60 ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10'
            }`}>
              {telemetry.confidenceScore}/100 Score
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-[10px] font-mono">
            {confidenceBreakdown.map((item, id) => {
              const isPenalty = item.pts < 0;
              return (
                <div key={id} className="flex items-center justify-between p-1 px-1.5 bg-zinc-900/50 rounded hover:bg-zinc-900 transition-all select-none">
                  <span className="text-zinc-500">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={isPenalty ? "text-rose-405 font-bold text-rose-404" : "text-emerald-450 font-bold text-emerald-400"}>
                      {isPenalty ? `${item.pts}` : `+${item.pts}`} pts
                    </span>
                    <span className="text-[8px] text-zinc-650">(max {item.max})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODULE 2: REFINED UPGRADED DECISION INTELLIGENCE */}
        <div className="md:col-span-5 bg-black/60 border border-zinc-900 p-3 sm:p-4 rounded-lg space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 text-yellow-550 text-yellow-400">
              <Sparkles className="w-3.5 h-3.5" />
              SETUP EXTRAS MATRIX
            </span>

            {/* Quality Grade Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-[#0e0f16] p-1.5 rounded border border-gray-955">
                <span className="text-zinc-500 block text-[7.5px] uppercase font-bold">Probability Grade</span>
                <span className={`text-xs font-black ${
                  telemetry.confidenceScore >= 80 ? "text-emerald-400" : telemetry.confidenceScore >= 65 ? "text-yellow-400" : "text-rose-400"
                }`}>
                  {telemetry.confidenceScore >= 80 ? "A+ Premium" : telemetry.confidenceScore >= 65 ? "A- Strong" : telemetry.confidenceScore >= 50 ? "B Speculative" : "C- (AVOID)"}
                </span>
              </div>

              <div className="bg-[#0e0f16] p-1.5 rounded border border-gray-955">
                <span className="text-zinc-500 block text-[7.5px] uppercase font-bold">Expected RR</span>
                <span className="text-xs font-black text-[#38bdf8] block col-span-1">
                  {telemetry.confidenceScore >= 80 ? "1:4.5 Premium" : telemetry.confidenceScore >= 60 ? "1:3.2 Core" : "1:1.5 Reduce"}
                </span>
              </div>

              <div className="bg-[#0e0f16] p-1.5 rounded border border-zinc-900/65 col-span-2">
                <span className="text-zinc-500 block text-[7.5px] uppercase font-bold">Classification</span>
                <span className="text-[9.5px] font-bold text-zinc-200 block truncate">
                  {telemetry.bias === "Bullish" 
                    ? "Discount Liquidity Sweep Accumulation" 
                    : telemetry.bias === "Bearish" 
                      ? "Premium Liquidity Sweep Distribution" 
                      : "Sidelined Volatility Bracket"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono pt-1">
              <div className="flex justify-between items-center border-b border-gray-900 pb-1">
                <span className="text-gray-500 font-bold">CONFIRMATION:</span>
                <span className="text-zinc-100 font-extrabold">{telemetry.confidenceScore >= 80 ? "3 mins ETA" : "12 mins ETA"}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-900 pb-1">
                <span className="text-gray-500 font-bold">QUALITY:</span>
                <span className={`font-black uppercase text-xs ${
                  telemetry.confidenceScore >= 80 ? "text-emerald-400" : telemetry.confidenceScore >= 60 ? "text-yellow-500" : "text-gray-500"
                }`}>
                  {telemetry.confidenceScore >= 80 ? "Grade A+" : telemetry.confidenceScore >= 60 ? "Grade B" : "Standby"}
                </span>
              </div>
            </div>
          </div>

          {/* Capital Preservation Dynamic Alert */}
          {(telemetry.tradesThisSession >= 3 || telemetry.spreadPips > 1.5 || telemetry.cooldownSecondsRemaining > 0 || telemetry.marketState === "Volatile") ? (
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-center animate-pulse">
              <span className="text-[9.5px] font-mono font-black text-amber-500 block uppercase tracking-wider">
                🛡️ Capital Preservation Mode Active
              </span>
              <span className="text-[8px] font-mono text-zinc-400 block mt-0.5">Automated size scaling halved dynamically</span>
            </div>
          ) : (
            <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded text-center">
              <span className="text-[8px] font-mono text-zinc-500 block uppercase">Algorithmic Risk Mode</span>
              <span className="text-[9px] font-mono font-black text-emerald-400 block mt-0.5">STANDARD SCALING ACTIVATED</span>
            </div>
          )}
        </div>

        {/* MODULE 3: DETAILED AGGREGATED METRICS HUD */}
        <div className="md:col-span-3 bg-zinc-900/40 border border-zinc-900/60 p-3 sm:p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 block mb-2">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            Decision Intelligence
          </span>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono flex-1 mb-2">
            <div className="bg-black/30 p-2 rounded border border-zinc-900 flex flex-col justify-center">
              <span className="text-[8px] text-zinc-500 uppercase block">BIAS</span>
              <span className={`font-black uppercase text-xs mt-0.5 flex items-center justify-center gap-1 ${
                telemetry.bias === "Bullish" ? "text-emerald-400" : telemetry.bias === "Bearish" ? "text-rose-400" : "text-amber-400"
              }`}>
                {telemetry.bias === "Bullish" ? <TrendingUp className="w-3 h-3" /> : telemetry.bias === "Bearish" ? <TrendingDown className="w-3 h-3" /> : null}
                {telemetry.bias}
              </span>
            </div>
            <div className="bg-black/30 p-2 rounded border border-zinc-900 flex flex-col justify-center">
              <span className="text-[8px] text-zinc-500 uppercase block">ACTIVE SESSION</span>
              <span className="text-zinc-100 font-bold uppercase text-[9px] mt-0.5 truncate tracking-tighter" title={telemetry.activeSession}>
                {telemetry.activeSession}
              </span>
            </div>
          </div>

          <div className="bg-black/50 p-2 rounded border border-zinc-900 text-[10px] font-mono">
            <span className="text-[8px] text-zinc-500 uppercase block leading-none mb-1">REASON SUMMARY</span>
            <p className="text-zinc-300 leading-snug font-normal text-[9px] text-left">
              {telemetry.reasonSummary}
            </p>
          </div>
        </div>

      </div>

      {/* DYNAMIC TRADE LIFECYCLE PIPELINE */}
      <div className="mt-4 pt-4 border-t border-gray-900 font-mono">
        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black block mb-3">
          ✦ AUTOMATED TRADE LIFECYCLE STAGES
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: "Setup Detected", active: telemetry.confidenceScore >= 45 },
            { label: "Waiting Confirmation", active: telemetry.confidenceScore >= 55 },
            { label: "Mitigation Active", active: telemetry.confidenceScore >= 65 },
            { label: "Entry Armed", active: telemetry.executionStatus === "AUTHORIZED" && telemetry.confidenceScore >= 75 },
            { label: "Execution Sent", active: telemetry.tradesThisSession >= 1 },
            { label: "Risk Managed", active: telemetry.tradesThisSession >= 1 && telemetry.confidenceScore >= 65 },
            { label: "Partial TP Hit", active: telemetry.tradesThisSession >= 1 && telemetry.confidenceScore >= 80 },
            { label: "Trade Closed", active: telemetry.cooldownSecondsRemaining > 0 || telemetry.tradesThisSession >= 2 },
          ].map((stage, idx) => (
            <div 
              key={idx} 
              className={`p-2 rounded-lg border text-center font-mono flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                stage.active 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" 
                  : "bg-black/37 border-zinc-900/60 text-zinc-500 opacity-55"
              }`}
            >
              {stage.active && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400 animate-pulse" />
              )}
              <span className="text-[10px] font-black tracking-tighter block truncate">{stage.label}</span>
              <span className="text-[7.5px] font-bold block mt-1.5 uppercase">
                {stage.active ? "ACTIVE" : "STANDBY"}
              </span>
            </div>
          ))}
        </div>
      </div>
      </>)}
    </div>
  );
}
