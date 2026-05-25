import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ShieldAlert,
  Activity,
  Cpu,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  Sliders,
  Database,
  RefreshCw,
  Terminal,
  Search,
  Filter,
  BarChart4,
  ArrowRightLeft,
  Smartphone,
  CheckSquare,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Types corresponding to unified state management
export type UnifiedRiskState = "NOMINAL" | "COOLDOWN" | "HARD_SHUTDOWN" | "FATIGUE_HOLD";
export type UnifiedReadinessState = "AUTHORIZED" | "HOLD" | "DENIED_CONTRADICTORY" | "DENIED_SPREAD" | "DENIED_FATIGUE";
export type UnifiedVolatilityType = "Stable" | "Unstable" | "High-Impact News Spike";

export interface ExecutionLog {
  id: string;
  timestamp: string;
  category: "INFO" | "WARNING" | "EXECUTION" | "RISK" | "SYSTEM" | "CRITICAL";
  message: string;
  engine: string;
}

export interface ReviewSnapshot {
  id: string;
  timestamp: string;
  direction: "Buy" | "Sell";
  instrument: string;
  confidence: number;
  expectedSlippage: number;
  latency: number;
  whatAISaw: string;
  whyAllowed: string;
  confidenceDelta: string;
  riskFactors: string[];
  invalidationRisks: string[];
}

export default function ModularRefactorConsole() {
  // Mobile UI performance flag
  const [mobileOptimizationActive, setMobileOptimizationActive] = useState<boolean>(false);
  
  // Component Section Collapsibility
  const [collapsed, setCollapsed] = useState({
    stateManager: false,
    delaySimulator: false,
    patternFilters: false,
    syncValidator: false,
    logsPanel: false,
    reviewPanel: false
  });

  // State Management Layer States
  const [activeSession, setActiveSession] = useState<string>("London AM Killzone");
  const [envClassification, setEnvClassification] = useState<string>("Trending (Bullish Extension)");
  const [riskState, setRiskState] = useState<UnifiedRiskState>("NOMINAL");
  const [spreadPips, setSpreadPips] = useState<number>(1.1);
  const [volatility, setVolatility] = useState<UnifiedVolatilityType>("Stable");
  const [replayConfidence, setReplayConfidence] = useState<"Optimal" | "Depleted" | "Uncalibrated">("Optimal");
  const [operatorStability, setOperatorStability] = useState<string>("Class A (Fully Attentive)");
  const [activePositions, setActivePositions] = useState<string[]>(["Buy Gold @ 2330.15 (Lot: 1.2)", "Sell EURUSD @ 1.0854 (Lot: 0.8)"]);
  const [baseConfidenceScore, setBaseConfidenceScore] = useState<number>(85);

  // Latency & Latency spikes simulator
  const [simulatedLatency, setSimulatedLatency] = useState<number>(24); // ms
  const [simulatedSlippage, setSimulatedSlippage] = useState<number>(0.12); // pips
  const [isSubmitRunning, setIsSubmitRunning] = useState<boolean>(false);
  const [rejectionChanceRate, setRejectionChanceRate] = useState<number>(5); // Default 5% rejection
  const [executionResult, setExecutionResult] = useState<{
    status: "APPROVED" | "REJECTED";
    effectiveLatency: number;
    slippage: number;
    rejectionReason?: string;
    finalLotSize: number;
  } | null>(null);

  // Logs state
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [logs, setLogs] = useState<ExecutionLog[]>([
    { id: "1", timestamp: "14:31:02", category: "INFO", message: "Market Structure Engine initialized independently.", engine: "Structure" },
    { id: "2", timestamp: "14:31:15", category: "SYSTEM", message: "Synchronized cross-state broker feed with FRA-Ledger Node.", engine: "MT5 Connector" },
    { id: "3", timestamp: "14:31:40", category: "RISK", message: "Daily absolute stop boundary calculated at $1,750.", engine: "Risk Engine" },
    { id: "4", timestamp: "14:32:05", category: "WARNING", message: "Premium spread fluctuation recorded (1.1 -> 1.8 pips).", engine: "Volatility Engine" },
    { id: "5", timestamp: "14:32:44", category: "EXECUTION", message: "SMC Strategy validated matching accumulation sweep scenario.", engine: "Execution Engine" }
  ]);

  // Operational snapshots
  const [snapshots, setSnapshots] = useState<ReviewSnapshot[]>([
    {
      id: "rev_01",
      timestamp: "14:26:10",
      direction: "Buy",
      instrument: "XAUUSD",
      confidence: 81,
      expectedSlippage: 0.15,
      latency: 28,
      whatAISaw: "London low pool sweep, M15 candle closing strongly above previous high with significant displacement.",
      whyAllowed: "All 8 signal filtration conditions scored affirmative. Volatility was stable and spread measured within 1.2 bounds.",
      confidenceDelta: "-4% (Shed slightly due to mild afternoon vol decay)",
      riskFactors: ["NY Open News Event coming up in 2 hours", "High density block sitting directly on pivot point"],
      invalidationRisks: ["Close below 2322.40 voids structural displacement", "Unscheduled rate decision remarks"]
    }
  ]);

  // Real-time decay variables & dynamic modifiers
  // 8 Signal requirements checker
  const requirements = useMemo(() => {
    return {
      htfAlignment: envClassification.includes("Trending") || envClassification.includes("Expanding"),
      liquiditySweep: true,
      displacementConfirmed: baseConfidenceScore > 50,
      sessionValid: activeSession.includes("Killzone") || activeSession.includes("London") || activeSession.includes("New York"),
      spreadAcceptable: spreadPips <= 1.5,
      volatilityAcceptable: volatility === "Stable",
      replayConfidenceSufficient: replayConfidence === "Optimal",
      psychologicalStable: operatorStability.includes("Class A") || operatorStability.includes("Stabilized")
    };
  }, [envClassification, baseConfidenceScore, activeSession, spreadPips, volatility, replayConfidence, operatorStability]);

  // Count active requirements satisfied
  const countPassedRequirements = useMemo(() => {
    return Object.values(requirements).filter(Boolean).length;
  }, [requirements]);

  // Unified execution readiness calculator
  const executionReadiness: UnifiedReadinessState = useMemo(() => {
    if (!requirements.psychologicalStable) return "DENIED_FATIGUE";
    if (!requirements.spreadAcceptable) return "DENIED_SPREAD";
    if (countPassedRequirements < 6) return "DENIED_CONTRADICTORY";
    if (countPassedRequirements < 8) return "HOLD";
    return "AUTHORIZED";
  }, [requirements, countPassedRequirements]);

  // Conflict state validator (Engine conflicts detector)
  const engineConflicts = useMemo(() => {
    const conflictsList: string[] = [];
    
    // Conflict 1: Bullish structure but bearish/unstable volatility
    if (envClassification.includes("Trending") && volatility === "High-Impact News Spike") {
      conflictsList.push("Bullish Extension + News Spike (Extreme whipsaw threat detected)");
    }
    // Conflict 2: Valid liquidity sweep but bad spread condition
    if (requirements.liquiditySweep && spreadPips > 1.5) {
      conflictsList.push("Valid Sweep + Diluted Broker Spread (Execution efficiency degraded)");
    }
    // Conflict 3: Excellent setups but late session tiredness
    if (baseConfidenceScore > 75 && operatorStability.includes("Low alertness")) {
      conflictsList.push("Optimal Signals + Sub-optimal Attention (Operator latency delay risk)");
    }

    return conflictsList;
  }, [envClassification, volatility, requirements.liquiditySweep, spreadPips, baseConfidenceScore, operatorStability]);

  // Adaptive Confidence Decay Layer
  // Calculates live decay penalty factor dynamically based on active telemetry states
  const confidenceDecayImpact = useMemo(() => {
    let decayAmt = 0;
    const items: string[] = [];

    if (volatility === "Unstable") {
      decayAmt += 8;
      items.push("Volatility Unstable (-8 pts)");
    } else if (volatility === "High-Impact News Spike") {
      decayAmt += 22;
      items.push("Extreme News Spike (-22 pts)");
    }

    if (spreadPips > 1.5) {
      decayAmt += 12;
      items.push("Spread Widening Alert (-12 pts)");
    }

    if (activeSession.includes("None") || activeSession.includes("Transition")) {
      decayAmt += 15;
      items.push("Outside Killzones (-15 pts)");
    }

    if (baseConfidenceScore < 60) {
      decayAmt += 10;
      items.push("Displacement Weakening (-10 pts)");
    }

    if (replayConfidence === "Depleted") {
      decayAmt += 14;
      items.push("Replay Learning Depleted (-14 pts)");
    }

    if (engineConflicts.length > 0) {
      decayAmt += 15;
      items.push("Active Engine Conflicts Detected (-15 pts)");
    }

    return {
      totalDecayPercentage: decayAmt,
      effectiveScore: Math.max(0, baseConfidenceScore - decayAmt),
      reasons: items
    };
  }, [volatility, spreadPips, activeSession, baseConfidenceScore, replayConfidence, engineConflicts]);

  const addLiveLog = (message: string, category: ExecutionLog["category"], engine: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const newLog: ExecutionLog = {
      id: "log_" + Date.now(),
      timestamp: timeStr,
      category,
      message,
      engine
    };
    setLogs(prev => [newLog, ...prev.slice(0, 40)]);
  };

  // Run execution submission simulator (LATENCY ORDER SIMULATION)
  const executeSimulation = () => {
    if (executionReadiness === "DENIED_CONTRADICTORY" || executionReadiness === "DENIED_SPREAD" || executionReadiness === "DENIED_FATIGUE") {
      addLiveLog("Execution block triggered. Conditions failed filtering parameters.", "CRITICAL", "Psychology Firewall");
      return;
    }

    setIsSubmitRunning(true);
    setExecutionResult(null);
    addLiveLog("Dispatching limit order to FRA-WEST Core Broker Ledger...", "EXECUTION", "MT5 Connector");

    // Realistic non-blocking timeout simulator
    setTimeout(() => {
      // Simulate real latency variation based on active session load
      const finalLatency = Math.round(simulatedLatency + Math.random() * 25);
      const isRejected = Math.random() * 100 < rejectionChanceRate || volatility === "High-Impact News Spike";
      
      const slippageValue = parseFloat((simulatedSlippage + (Math.random() * 0.18)).toFixed(2));
      const finalLot = parseFloat((1.2 * (confidenceDecayImpact.effectiveScore / 100)).toFixed(2));

      if (isRejected) {
        const rejectionReason = volatility === "High-Impact News Spike" 
          ? "Rejected (Price Feed Out-of-bounds due to News spike slippage)" 
          : "Rejected (Off Quotes - Broker Liquidity mismatch)";
        
        setExecutionResult({
          status: "REJECTED",
          effectiveLatency: finalLatency,
          slippage: slippageValue,
          rejectionReason,
          finalLotSize: 0
        });
        
        addLiveLog(`Order failed transmission. Broker returned rejection: ${rejectionReason}`, "CRITICAL", "MT5 Connector");
      } else {
        setExecutionResult({
          status: "APPROVED",
          effectiveLatency: finalLatency,
          slippage: slippageValue,
          finalLotSize: finalLot
        });

        addLiveLog(`Order filled successfully at ${finalLatency}ms. Average Slippage: +${slippageValue} pips. Initialized at ${finalLot} Lots.`, "EXECUTION", "Execution Engine");

        // Write an institutional review snapshot automatically
        const newSnapshot: ReviewSnapshot = {
          id: "rev_" + Date.now(),
          timestamp: new Date().toTimeString().split(" ")[0],
          direction: "Buy",
          instrument: "XAUUSD (GOLD/SPOT)",
          confidence: confidenceDecayImpact.effectiveScore,
          expectedSlippage: slippageValue,
          latency: finalLatency,
          whatAISaw: `High resolution consolidation swept during ${activeSession}. Pattern similarity matching evaluated to 94.4% conformity.`,
          whyAllowed: `Execution checklist criteria passed with ${countPassedRequirements}/8 affirmative confirmations.`,
          confidenceDelta: `-${confidenceDecayImpact.totalDecayPercentage}% Total Calibration decay factors applied dynamically.`,
          riskFactors: engineConflicts.length > 0 ? engineConflicts : ["Nominal overnight margin limits remain current"],
          invalidationRisks: ["Immediate stop hunt void levels active on swing extreme anchors", "Broker spreads widening beyond baseline average"]
        };

        setSnapshots(prev => [newSnapshot, ...prev]);
      }
      setIsSubmitRunning(false);
    }, 1200);
  };

  // Filter logs list based on user selections
  const filteredLogs = useMemo(() => {
    return logs.filter(lg => {
      const matchSearch = lg.message.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          lg.engine.toLowerCase().includes(searchFilter.toLowerCase());
      const matchCategory = categoryFilter === "ALL" || lg.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [logs, searchFilter, categoryFilter]);

  return (
    <div className="bg-[#0b0c13] border border-gray-900 rounded-xl overflow-hidden shadow-2xl space-y-6" id="phase7-modular-stability-workspace">
      
      {/* Banner / Tab Controller with institutional realism */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0d101e] to-purple-950 p-4 border-b border-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
          <div className="font-sans">
            <span className="text-[11px] font-mono font-black tracking-widest text-emerald-400 uppercase block leading-none">
              MODULAR EXECUTION STABILITY ENGINE (PHASE 7)
            </span>
            <span className="text-xs text-gray-300 block leading-tight mt-1">
              Engine Synchronizer • Adaptive Decay Calculator • Latency & Order Rejection Simulator
            </span>
          </div>
        </div>

        {/* CSS Hardware Performance Toggle */}
        <button
          onClick={() => {
            setMobileOptimizationActive(!mobileOptimizationActive);
            addLiveLog(
              mobileOptimizationActive 
                ? "Restored standard graphics and rich visual telemetry rendering." 
                : "Activated performance layer. Disabled decorative SVG grids for enhanced UI speed.", 
              "INFO", 
              "System Core"
            );
          }}
          className={`px-3 py-1.5 rounded text-[10.5px] font-mono font-bold flex items-center gap-1.5 transition-all select-none border ${
            mobileOptimizationActive 
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
              : "bg-gray-950 text-gray-400 border-gray-850 hover:text-white"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          {mobileOptimizationActive ? "Mobile View: OPTIMIZED" : "Smooth Mobile Mode"}
        </button>
      </div>

      <div className="p-5 pt-1 space-y-6 leading-relaxed">
        
        {/* PARAMS ROW: CENTRAL UNIFIED STATE MANAGEMENT LAYER (10 components) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-905 border-gray-900 pb-1.5">
            <div className="flex items-center gap-2 font-mono">
              <span className="p-1 px-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black text-[9px]">
                STATE ENGINE
              </span>
              <h3 className="text-xs font-black text-gray-150 uppercase tracking-widest">
                Unified Institutional State Store
              </h3>
            </div>
            <button
              onClick={() => setCollapsed(s => ({ ...s, stateManager: !s.stateManager }))}
              className="text-gray-555 hover:text-white transition-all text-xs"
            >
              {collapsed.stateManager ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsed.stateManager && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 font-mono text-xs select-none">
              
              {/* 1. Active Session */}
              <div className="bg-[#0a0b12] border border-gray-950 p-2.5 rounded-lg">
                <span className="text-[8px] text-gray-500 block uppercase mb-1">1. Active System Session</span>
                <select
                  className="w-full bg-black/60 border border-gray-900 p-1 text-[11px] text-white font-bold rounded outline-none cursor-pointer"
                  value={activeSession}
                  onChange={(e) => {
                    setActiveSession(e.target.value);
                    addLiveLog(`Session changed to: ${e.target.value}`, "INFO", "Session Engine");
                  }}
                >
                  <option value="London AM Killzone">London AM Killzone</option>
                  <option value="London PM Hunt">London PM Hunt</option>
                  <option value="New York Open AM">New York Open AM</option>
                  <option value="Asia Consolidation">Asia Consolidation</option>
                  <option value="Transition Inactive">Transition Inactive (Decay)</option>
                </select>
              </div>

              {/* 2. Environment Classification */}
              <div className="bg-[#0a0b12] border border-gray-950 p-2.5 rounded-lg">
                <span className="text-[8px] text-gray-500 block uppercase mb-1">2. Environment Class</span>
                <select
                  className="w-full bg-black/60 border border-gray-900 p-1 text-[11px] text-white font-bold rounded outline-none cursor-pointer"
                  value={envClassification}
                  onChange={(e) => {
                    setEnvClassification(e.target.value);
                    addLiveLog(`Market environment class shift: ${e.target.value}`, "WARNING", "Market Structure");
                  }}
                >
                  <option value="Trending (Bullish Extension)">Trending (Bullish)</option>
                  <option value="Trending (Bearish Sweep)">Trending (Bearish)</option>
                  <option value="Ranging (Distribution)">Ranging (Distribution)</option>
                  <option value="Manipulative (Stop Hunt Phase)">Manipulative Hunt</option>
                  <option value="Volatile (Unstable Whipsaws)">Volatile Whipsaws</option>
                </select>
              </div>

              {/* 3. Risk State */}
              <div className="bg-[#0a0b12] border border-gray-950 p-2.5 rounded-lg">
                <span className="text-[8px] text-gray-500 block uppercase mb-1">3. Unified Risk State</span>
                <select
                  className="w-full bg-black/60 border border-gray-900 p-1 text-[11px] text-white font-bold rounded outline-none cursor-pointer"
                  value={riskState}
                  onChange={(e) => {
                    setRiskState(e.target.value as UnifiedRiskState);
                    addLiveLog(`Unified Risk Engine safety updated to ${e.target.value}`, "RISK", "Risk Engine");
                  }}
                >
                  <option value="NOMINAL">NOMINAL (100% cap)</option>
                  <option value="COOLDOWN">COOLDOWN (Delay limit)</option>
                  <option value="HARD_SHUTDOWN">HARD SHUTDOWN (Lock)</option>
                  <option value="FATIGUE_HOLD">FATIGUE HOLD</option>
                </select>
              </div>

              {/* 4. Broker Spread */}
              <div className="bg-[#0a0b12] border border-gray-950 p-2.5 rounded-lg">
                <span className="text-[8px] text-gray-500 block uppercase mb-1">4. Broker Spread (Pips)</span>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className={`text-[11.5px] font-black ${spreadPips > 1.5 ? "text-red-400" : "text-[#38bdf8]"}`}>
                    {spreadPips} pips
                  </span>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={spreadPips}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSpreadPips(val);
                      if (val > 1.5) {
                        addLiveLog(`Broker spread exceeded target limits. Current: ${val} pips.`, "WARNING", "Volatility Engine");
                      }
                    }}
                    className="w-16 accent-[#38bdf8] bg-black pointer"
                  />
                </div>
              </div>

              {/* 5. Volatility Condition */}
              <div className="bg-[#0a0b12] border border-gray-950 p-2.5 rounded-lg">
                <span className="text-[8px] text-gray-555 block uppercase mb-1">5. Volatility Condition</span>
                <select
                  className="w-full bg-black/60 border border-gray-900 p-1 text-[11px] text-white font-bold rounded outline-none cursor-pointer"
                  value={volatility}
                  onChange={(e) => {
                    setVolatility(e.target.value as UnifiedVolatilityType);
                    addLiveLog(`Volatility updated: ${e.target.value}`, "WARNING", "Volatility Engine");
                  }}
                >
                  <option value="Stable">Stable Allocation</option>
                  <option value="Unstable">Unstable Compression</option>
                  <option value="High-Impact News Spike">High-Impact News Spike</option>
                </select>
              </div>

              {/* 6. Replay Confidence */}
              <div className="bg-[#0a0b12] border border-gray-950 p-2.5 rounded-lg">
                <span className="text-[8px] text-gray-555 block uppercase mb-1">6. Replay Learning Score</span>
                <select
                  className="w-full bg-black/60 border border-gray-900 p-1 text-[11px] text-[#34d399] font-bold rounded outline-none cursor-pointer"
                  value={replayConfidence}
                  onChange={(e) => setReplayConfidence(e.target.value as any)}
                >
                  <option value="Optimal">Optimal Pattern Match</option>
                  <option value="Depleted">Depleted (Needs Tuning)</option>
                  <option value="Uncalibrated">Uncalibrated Mode</option>
                </select>
              </div>

              {/* 7. Operator Stability */}
              <div className="bg-[#0a0b12] border border-gray-950 p-2.5 rounded-lg">
                <span className="text-[8px] text-gray-555 block uppercase mb-1">7. Operator Psychological</span>
                <select
                  className="w-full bg-black/60 border border-gray-900 p-1 text-[11px] text-[#a855f7] font-bold rounded outline-none cursor-pointer"
                  value={operatorStability}
                  onChange={(e) => {
                    setOperatorStability(e.target.value);
                    addLiveLog(`Psychology Firewall update: Operator attention set to '${e.target.value}'`, "INFO", "Psychology Firewall");
                  }}
                >
                  <option value="Class A (Fully Attentive)">Class A (Optimal)</option>
                  <option value="Class B (Stabilized Calm)">Class B (Calm)</option>
                  <option value="Low alertness (Slight fatigue)">Low Attention (Fatigue)</option>
                  <option value="Revenge alert (Impulsive)">Revenge / Hyperactive</option>
                </select>
              </div>

              {/* 8. Active Positions Monitor */}
              <div className="bg-[#0a0b12] border border-gray-950 p-2.5 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="text-[8px] text-gray-555 block uppercase leading-none">8. Active MT5 Positions</span>
                  <div className="text-[10px] text-emerald-400 font-bold mt-1 max-h-5 overflow-hidden truncate">
                    {activePositions.length} Positions Open
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActivePositions([]);
                    addLiveLog("Safely purged and closed all open simulation trade allocations to secure equity.", "RISK", "Execution Engine");
                  }}
                  className="text-[8.5px] uppercase font-black tracking-wider text-rose-400 hover:text-rose-350 underline leading-none text-left pt-1"
                >
                  Wipe Positions
                </button>
              </div>

              {/* 9. Base Multiplier Score */}
              <div className="bg-[#0a0b12] border border-gray-950 p-2.5 rounded-lg">
                <span className="text-[8px] text-gray-550 block uppercase mb-1">9. Base Confidence Score</span>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-[11px] text-white font-extrabold">{baseConfidenceScore}%</span>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={baseConfidenceScore}
                    onChange={(e) => setBaseConfidenceScore(parseInt(e.target.value))}
                    className="w-16 accent-emerald-500 bg-black pointer"
                  />
                </div>
              </div>

              {/* 10. Execution Readiness (Live Derived) */}
              <div className="bg-[#0e161c] border border-emerald-950 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[8px] text-emerald-400 block uppercase font-bold leading-none">10. Execution Quality</span>
                <div className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5">
                  {executionReadiness === "AUTHORIZED" && <span className="text-emerald-400">AUTHORIZED</span>}
                  {executionReadiness === "HOLD" && <span className="text-amber-400">HOLD CRITERIA</span>}
                  {executionReadiness === "DENIED_CONTRADICTORY" && <span className="text-pink-400">CONTRADICTORY DENY</span>}
                  {executionReadiness === "DENIED_SPREAD" && <span className="text-red-400">SPREAD VOID</span>}
                  {executionReadiness === "DENIED_FATIGUE" && <span className="text-purple-400">FATIGUE DENY</span>}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* DOUBLE COLUMN: DYNAMIC DECAY vs WORKSTATION LATENCY & ORDER SUBMISSION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 leading-relaxed">
          
          {/* LEFT SIDE (7 Columns) - Adaptive Confidence Decay & Filters Matrix */}
          <div className="lg:col-span-7 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-4 font-mono">
            
            <div className="flex items-center justify-between border-b border-gray-950 pb-2.5 select-none text-xs">
              <span className="text-[10px] text-zinc-445 text-zinc-400 uppercase font-bold tracking-wider block">
                1. Institutional Signal Filters (8 Keys Check)
              </span>
              <div className="flex items-center gap-1 bg-[#141829] p-1 px-2.5 rounded border border-indigo-505 border-indigo-500/15">
                <span className="text-[9.5px] text-zinc-500">Passed Requirements:</span>
                <span className="text-indigo-400 font-extrabold text-[11px]">
                  {countPassedRequirements}/8 Affirmative
                </span>
              </div>
            </div>

            {/* Eight keys Checklist validation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs select-none">
              
              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-gray-955 border-gray-950">
                <span className="text-gray-400">1. Higher-Timeframe Alignment</span>
                {requirements.htfAlignment ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]"><CheckCircle className="w-3.5 h-3.5" /> ALIGNED</span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]"><XCircle className="w-3.5 h-3.5" /> CONFLICT</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-gray-950">
                <span className="text-gray-400">2. M15 Liquidity Sweep Valid</span>
                {requirements.liquiditySweep ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]"><CheckCircle className="w-3.5 h-3.5" /> CONFIRMED</span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]"><XCircle className="w-3.5 h-3.5" /> INSUFFICIENT</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-gray-950">
                <span className="text-gray-400">3. Strong Candle Displacement</span>
                {requirements.displacementConfirmed ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]"><CheckCircle className="w-3.5 h-3.5" /> VERIFIED</span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]"><XCircle className="w-3.5 h-3.5" /> NONE DETECTED</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-gray-950">
                <span className="text-gray-400">4. Session Timing Constraints</span>
                {requirements.sessionValid ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]"><CheckCircle className="w-3.5 h-3.5" /> KILLZONE PASSED</span>
                ) : (
                  <span className="text-yellow-500 font-bold flex items-center gap-1 text-[11px]"><AlertTriangle className="w-3.5 h-3.5" /> WEAK HOUR</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-gray-950">
                <span className="text-gray-400">5. Target Spread Tolerance</span>
                {requirements.spreadAcceptable ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]"><CheckCircle className="w-3.5 h-3.5" /> STABLE SPREAD</span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]"><XCircle className="w-3.5 h-3.5" /> WIDE SPREAD</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-gray-950">
                <span className="text-gray-400">6. Volatility Coherence Stable</span>
                {requirements.volatilityAcceptable ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]"><CheckCircle className="w-3.5 h-3.5" /> PASSED</span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]"><XCircle className="w-3.5 h-3.5" /> NEWS FLOOD</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-gray-950">
                <span className="text-gray-400">7. Replay Learning Coeff</span>
                {requirements.replayConfidenceSufficient ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]"><CheckCircle className="w-3.5 h-3.5" /> OPTIMAL</span>
                ) : (
                  <span className="text-yellow-400 font-bold flex items-center gap-1 text-[11px]"><AlertTriangle className="w-3.5 h-3.5" /> DEFICIT RANGE</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-gray-950">
                <span className="text-gray-400">8. Psychology Attentiveness</span>
                {requirements.psychologicalStable ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]"><CheckCircle className="w-3.5 h-3.5" /> CLASS-A STATUS</span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]"><XCircle className="w-3.5 h-3.5" /> FATIGUED / REVENGE</span>
                )}
              </div>

            </div>

            {/* Confidence Decay Breakdown */}
            <div className="bg-black/40 p-3 rounded-lg border border-gray-950 space-y-2 text-xs">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block leading-none">
                2. Real-Time Adaptive Confidence Decay & Decay Logs
              </span>
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <span className="text-gray-400 block leading-none text-[11px]">Decayed Real-Time Confidence Output:</span>
                  <span className="text-xs text-gray-500 block leading-tight mt-1">
                    Base Rating: {baseConfidenceScore}% • Calculated Decay Factor: <span className="text-rose-400 font-bold">-{confidenceDecayImpact.totalDecayPercentage}%</span>
                  </span>
                </div>
                <div className="bg-black border border-gray-850 p-1 px-3 rounded text-center">
                  <span className={`text-base font-black tracking-widest ${
                    confidenceDecayImpact.effectiveScore >= 75 ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {confidenceDecayImpact.effectiveScore}% Effective Score
                  </span>
                </div>
              </div>

              {/* Display decay triggers */}
              {confidenceDecayImpact.reasons.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1.5 text-[9.5px]">
                  {confidenceDecayImpact.reasons.map((re, idx) => (
                    <span key={idx} className="p-1 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded text-[9px] font-bold">
                      {re}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[9.5px] text-emerald-400 block pt-1 select-none">
                  • System calculations nominal. Under normal asset range parameters, no dynamic decay was initialized.
                </span>
              )}
            </div>

          </div>

          {/* RIGHT SIDE (5 Columns) - Realistic Execution Delay, Latency Spikes & Order Rejections */}
          <div className="lg:col-span-5 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-4 font-mono text-xs">
            
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block border-b border-gray-950 pb-2.5 leading-none">
              Latency, Order Transmission & Rejection Simulator
            </span>

            <div className="space-y-3">
              
              {/* Target Latency Configured */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-gray-400">Target Broker Latency:</span>
                  <span className="text-[#38bdf8] font-bold">{simulatedLatency}ms</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="190"
                  value={simulatedLatency}
                  onChange={(e) => setSimulatedLatency(parseInt(e.target.value))}
                  className="w-full accent-[#38bdf8] bg-black/60 h-1.5 rounded"
                />
              </div>

              {/* Target expected slippage pips */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-gray-400">Baseline Expected Slippage:</span>
                  <span className="text-purple-400 font-bold">{simulatedSlippage} pips</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={simulatedSlippage}
                  onChange={(e) => setSimulatedSlippage(parseFloat(e.target.value))}
                  className="w-full accent-[#a855f7] bg-black/60 h-1.5 rounded"
                />
              </div>

              {/* Broker Rejection rate */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-gray-400">Slippage & Rejection Probability:</span>
                  <span className="text-rose-500 font-bold">{rejectionChanceRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  step="5"
                  value={rejectionChanceRate}
                  onChange={(e) => {
                    setRejectionChanceRate(parseInt(e.target.value));
                    addLiveLog(`Adjusted simulated broker rejection rate to ${e.target.value}% probability zone.`, "WARNING", "MT5 Connector");
                  }}
                  className="w-full accent-rose-500 bg-black/60 h-1.5 rounded"
                />
              </div>

            </div>

            {/* Quick Trigger Button */}
            <button
              onClick={executeSimulation}
              disabled={isSubmitRunning || riskState === "HARD_SHUTDOWN"}
              className={`w-full py-3 rounded-lg font-black text-[11px] uppercase text-white tracking-widest flex items-center justify-center gap-2 transition-all shadow-md ${
                isSubmitRunning 
                  ? "bg-amber-600 cursor-not-allowed" 
                  : riskState === "HARD_SHUTDOWN"
                  ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
              }`}
            >
              <Zap className={`w-4 h-4 ${isSubmitRunning ? "animate-spin" : ""}`} />
              {isSubmitRunning ? "Routing Order (Latency Delay) • • •" : "Initiate Live Execution Order"}
            </button>

            {/* Execution Result Area */}
            {executionResult && (
              <div className={`p-3 rounded-lg border text-xs leading-normal font-mono space-y-1.5 ${
                executionResult.status === "APPROVED" 
                  ? "bg-emerald-950/20 border-emerald-500/25 text-emerald-400" 
                  : "bg-rose-950/20 border-rose-500/25 text-rose-400"
              }`}>
                <div className="flex justify-between items-center border-b border-black/30 pb-1">
                  <span className="font-bold flex items-center gap-1 uppercase tracking-widest text-[9.5px]">
                    {executionResult.status === "APPROVED" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                    Execution Summary
                  </span>
                  <span className="text-[8.5px] uppercase font-bold text-gray-555">SMC Core Ledger</span>
                </div>

                {executionResult.status === "APPROVED" ? (
                  <div className="space-y-1 text-[10.5px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Effective Broker Latency:</span>
                      <span className="text-white font-bold">{executionResult.effectiveLatency}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reconstructed Slippage:</span>
                      <span className="text-white font-bold">+{executionResult.slippage} pips</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Calibrated Sizing Approved:</span>
                      <span className="text-white font-extrabold">{executionResult.finalLotSize} Lots</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-[10.5px]">
                    <div className="flex justify-between">
                      <span className="text-gray-450">Reject Factor:</span>
                      <span className="text-rose-400 font-extrabold">{executionResult.rejectionReason}</span>
                    </div>
                    <span className="text-[8.5px] text-gray-500 italic block mt-0.5">
                      Order canceled under strict institutional latency volatility guidelines.
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* SECTION: ENGINE SYNCHRONIZATION VALIDATOR CONFLICT DETECTOR */}
        <div className="space-y-3 border-t border-gray-950 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded font-black text-[9px]">
                VALIDATOR
              </span>
              <h4 className="text-xs font-black text-gray-200 uppercase tracking-widest">
                Engine Synchronization State Validator
              </h4>
            </div>
            <button
              onClick={() => setCollapsed(s => ({ ...s, syncValidator: !s.syncValidator }))}
              className="text-gray-550 hover:text-white text-xs"
            >
              {collapsed.syncValidator ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsed.syncValidator && (
            <div className="bg-[#0a0b12] border border-gray-950 p-4 rounded-xl leading-normal font-mono text-xs">
              {engineConflicts.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    <AlertTriangle className="w-5 h-5 animate-bounce shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-[11.5px] font-black uppercase tracking-widest">
                        Signal Conflict Detected — Active Protective Lock Injected
                      </span>
                      <p className="text-[10px] text-zinc-300">
                        Multi-Engine core detected incompatible signals across active filters. Real-time confidence score decays instantly until state variables align.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {engineConflicts.map((con, ind) => (
                      <div key={ind} className="bg-black/40 p-2 border border-orange-500/10 rounded flex items-center justify-between text-[10.5px] text-zinc-350">
                        <span className="text-orange-300 font-bold">• {con}</span>
                        <span className="text-[8.5px] text-gray-500">Calibrative decay coefficient activated</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-950/10 border border-emerald-500/15 text-emerald-400 select-none">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold uppercase block tracking-wider">
                      All Synchronized Enginess Aligned (Core Status: Stable)
                    </span>
                    <p className="text-[10px] text-gray-405 text-gray-400">
                      No matching conflict states observed. Volatility scales, spread metrics, and psychology attention are fully harmonized.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION: ADAPTIVE EXECUTION POST-TRADE REVIEW PANEL */}
        <div className="space-y-3 border-t border-gray-950 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-indigo-505 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-black text-[9px]">
                REVIEWS
              </span>
              <h4 className="text-xs font-black text-gray-200 uppercase tracking-widest">
                SMC Post-Execution Architectural Review Panel
              </h4>
            </div>
            <button
              onClick={() => setCollapsed(s => ({ ...s, reviewPanel: !s.reviewPanel }))}
              className="text-gray-550 hover:text-white text-xs"
            >
              {collapsed.reviewPanel ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsed.reviewPanel && (
            <div className="space-y-3 font-mono">
              {snapshots.map((snap) => (
                <div key={snap.id} className="bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-gray-950 pb-2 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 bg-[#1a2135] text-[#818cf8] font-bold rounded text-[8.5px]">
                        ID: {snap.id}
                      </span>
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                        {snap.direction} {snap.instrument} Execution Record
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 text-right font-black">
                      Timestamp: {snap.timestamp}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 bg-black/40 p-3 rounded-lg border border-gray-950">
                      <div>
                        <span className="text-[8px] text-indigo-400 font-extrabold block uppercase tracking-wide leading-none mb-1">
                          1) What the AI Saw / Analyzed:
                        </span>
                        <p className="text-[10.5px] leading-relaxed text-zinc-300">
                          {snap.whatAISaw}
                        </p>
                      </div>

                      <div className="pt-1.5">
                        <span className="text-[8px] text-emerald-400 font-extrabold block uppercase tracking-wide leading-none mb-1">
                          2) Why Execution was Authorized:
                        </span>
                        <p className="text-[10.5px] leading-relaxed text-zinc-300">
                          {snap.whyAllowed}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 bg-black/40 p-3 rounded-lg border border-gray-950">
                      <div>
                        <span className="text-[8px] text-rose-450 text-rose-400 font-extrabold block uppercase tracking-wide leading-none mb-1">
                          3) Active Execution Risk Factors Found:
                        </span>
                        <div className="space-y-0.5">
                          {snap.riskFactors.map((r, i) => (
                            <span key={i} className="text-[10px] text-zinc-400 block">• {r}</span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-950">
                        <span className="text-[8px] text-amber-500 font-extrabold block uppercase tracking-wide leading-none mb-1">
                          4) Hard Structural Invalidation Levels remaining:
                        </span>
                        <div className="space-y-0.5">
                          {snap.invalidationRisks.map((ir, i) => (
                            <span key={i} className="text-[10px] text-zinc-400 block">• {ir}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 7: INSTITUTIONAL COMPREHENSIVE LOGGING FRAMEWORK */}
        <div className="space-y-3 border-t border-gray-950 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded font-black text-[9px]">
                LOGS
              </span>
              <h4 className="text-xs font-black text-gray-200 uppercase tracking-widest">
                Institutional Core System Logging Framework
              </h4>
            </div>
            
            <button
              onClick={() => setCollapsed(s => ({ ...s, logsPanel: !s.logsPanel }))}
              className="text-gray-555 hover:text-white text-xs"
            >
              {collapsed.logsPanel ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsed.logsPanel && (
            <div className="bg-[#040509] border border-gray-950 rounded-xl p-4 leading-normal font-mono space-y-3.5">
              
              {/* Tool filters controller grid */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-black/60 p-2 rounded-lg border border-gray-900 select-none">
                
                {/* Search query input */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search logs by engine/text..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-black/60 border border-gray-850 p-1.5 pl-8 text-xs text-white rounded outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                {/* Level selection controls */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  <span className="text-gray-500 max-sm:hidden text-[10.5px]">Filter Severity:</span>
                  {["ALL", "INFO", "WARNING", "EXECUTION", "RISK", "SYSTEM", "CRITICAL"].map((lev) => (
                    <button
                      key={lev}
                      onClick={() => setCategoryFilter(lev)}
                      className={`px-2 py-1 rounded text-[9.5px] cursor-pointer font-bold ${
                        categoryFilter === lev 
                          ? "bg-indigo-600 text-white" 
                          : "bg-[#10121d] text-gray-400 hover:text-white"
                      }`}
                    >
                      {lev}
                    </button>
                  ))}
                </div>

              </div>

              {/* Console rendering logs array */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs font-mono scrollbar-thin">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((lg) => {
                    const getSeverityColor = (sev: string) => {
                      switch (sev) {
                        case "CRITICAL": return "text-red-400 font-extrabold";
                        case "WARNING": return "text-amber-400 font-bold";
                        case "EXECUTION": return "text-emerald-400 font-bold";
                        case "RISK": return "text-rose-450 text-rose-400";
                        case "SYSTEM": return "text-purple-400";
                        default: return "text-gray-400";
                      }
                    };
                    return (
                      <div key={lg.id} className="py-1 px-2.5 bg-black/30 text-zinc-350 hover:bg-black/55 rounded border border-gray-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-bold text-[10.5px] shrink-0">[{lg.timestamp}]</span>
                          <span className={`text-[10px] shrink-0 min-w-16 uppercase ${getSeverityColor(lg.category)}`}>
                            {lg.category}
                          </span>
                          <span className="text-[10.5px] text-zinc-300 break-words">{lg.message}</span>
                        </div>
                        <span className="text-[9.5px] bg-[#1a1e2a]/40 p-0.5 px-1.5 border border-indigo-500/10 text-indigo-300 rounded uppercase font-bold text-right shrink-0">
                          {lg.engine}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-550 italic py-6 select-none">
                    No institutional core logs found matching the filter selection parameters.
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
