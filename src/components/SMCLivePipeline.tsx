import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  Zap, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Database,
  Volume2,
  AlertTriangle,
  Info,
  DollarSign,
  Check,
  Flame,
  Compass
} from "lucide-react";
import { Engine8Candle, MarketStateType, SwingPoint, StructureBreak, SafetyProtectionState, JournaledTrade, LiquiditySweptType, StructureShiftType, SessionZoneType } from "../types";

interface SMCLivePipelineProps {
  onInjectSetup: (config: {
    liquiditySwept: any;
    structureShift: any;
    fairValueGapMatched: any;
    sessionType: any;
    direction: "Buy" | "Sell";
    notes: string;
    multiplierScore: number;
    timeframe: string;
  }) => void;
  onJournalLiveTrade: (trade: JournaledTrade) => void;
  onTelemetryUpdate?: (telemetry: {
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
  }) => void;
}

// Pre-seeded base candles to start with for 15M, 30M, and 1H timeframes
const initialCandleSets: Record<"15M" | "30M" | "1H", Omit<Engine8Candle, "timeframe">[]> = {
  "15M": [
    { timestamp: "09:00", open: 2315.5, high: 2318.0, low: 2313.2, close: 2314.0, volume: 1250 },
    { timestamp: "09:15", open: 2314.0, high: 2316.5, low: 2311.0, close: 2312.2, volume: 1420 },
    { timestamp: "09:30", open: 2312.2, high: 2313.8, low: 2309.5, close: 2311.0, volume: 1100 },
    { timestamp: "09:45", open: 2311.0, high: 2315.0, low: 2308.2, close: 2314.5, volume: 1580 },
    // Asian Low Sweep Candidate
    { timestamp: "10:00", open: 2314.5, high: 2315.2, low: 2304.5, close: 2313.8, volume: 3100 }, // Long wick down (SSL Hunt)
    { timestamp: "10:15", open: 2313.8, high: 2322.0, low: 2313.0, close: 2321.4, volume: 2450 }, // Strong displacement up
    { timestamp: "10:30", open: 2321.4, high: 2326.8, low: 2320.5, close: 2325.0, volume: 2100 }, // MSS Confirmation
    { timestamp: "10:45", open: 2325.0, high: 2325.5, low: 2317.2, close: 2318.5, volume: 1850 }, // Retest FVG
    { timestamp: "11:00", open: 2318.5, high: 2328.0, low: 2318.0, close: 2327.2, volume: 1980 },
    { timestamp: "11:15", open: 2327.2, high: 2331.0, low: 2326.5, close: 2330.2, volume: 2200 }
  ],
  "30M": [
    { timestamp: "08:30", open: 2310.2, high: 2314.0, low: 2309.2, close: 2312.5, volume: 2500 },
    { timestamp: "09:00", open: 2312.5, high: 2316.0, low: 2308.0, close: 2314.8, volume: 2800 },
    { timestamp: "09:30", open: 2314.8, high: 2315.5, low: 2302.2, close: 2313.5, volume: 4200 }, // Stop Hunt Sell-Side
    { timestamp: "10:00", open: 2313.5, high: 2325.8, low: 2312.8, close: 2324.0, volume: 3900 }, // Break up
    { timestamp: "10:30", open: 2324.0, high: 2325.0, low: 2318.5, close: 2319.2, volume: 2900 },
    { timestamp: "11:00", open: 2319.2, high: 2332.0, low: 2319.0, close: 2330.5, volume: 3400 }
  ],
  "1H": [
    { timestamp: "07:00", open: 2308.0, high: 2314.2, low: 2307.5, close: 2312.0, volume: 4500 },
    { timestamp: "08:00", open: 2312.0, high: 2318.5, low: 2310.5, close: 2314.5, volume: 5100 },
    { timestamp: "09:00", open: 2314.5, high: 2315.2, low: 2301.8, close: 2313.2, volume: 9200 }, // Purge key low
    { timestamp: "10:00", open: 2313.2, high: 2328.5, low: 2312.5, close: 2326.8, volume: 8100 }, // Impulsive expansion
    { timestamp: "11:00", open: 2326.8, high: 2332.0, low: 2323.5, close: 2329.5, volume: 6705 }
  ]
};

export default function SMCLivePipeline({ onInjectSetup, onJournalLiveTrade, onTelemetryUpdate }: SMCLivePipelineProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"15M" | "30M" | "1H">("15M");
  const [executionMode, setExecutionMode] = useState<"Manual Confirmation" | "Semi-Auto Strategy">("Manual Confirmation");
  const [isMainPanelCollapsed, setIsMainPanelCollapsed] = useState<boolean>(false);
  const [sessionTransition, setSessionTransition] = useState<"standard_fluid" | "london_decay" | "ny_volatility" | "asia_compression" | "news_instability">("standard_fluid");
  
  // PHASE 17 Core Execution Model & News Freeze Simulation
  const [activeNewsFreeze, setActiveNewsFreeze] = useState<"None" | "CPI" | "NFP" | "FOMC" | "Powell">("None");
  const [newsFreezeTimeRemaining, setNewsFreezeTimeRemaining] = useState<number>(0);
  const [forceAlignmentOverride, setForceAlignmentOverride] = useState<boolean>(false);
  
  // Real-time market states
  const [candles, setCandles] = useState<Engine8Candle[]>([]);
  const [liveTickPrice, setLiveTickPrice] = useState<number>(2330.2);
  const [isFeedStreaming, setIsFeedStreaming] = useState<boolean>(true);
  const [ticksSinceLastClose, setTicksSinceLastClose] = useState<number>(0);
  const maxTicksPerCandle = 6; // Simulation closes candle after 6 ticks

  // Safety & Cooldown Core Status (Engine 13)
  const [safety, setSafety] = useState<SafetyProtectionState & {
    consecutiveLossCount: number;
    emotionalVolatilityLevel: "Stable" | "Elevated" | "Extreme Lockout";
    revengeTradingActive: boolean;
    isOvertradingDetected: boolean;
  }>({
    dailyDrawdown: 1.45, // starts at 1.45%
    weeklyDrawdown: 2.8,
    tradesThisSession: 1,
    isCooldownActive: false,
    cooldownSecondsRemaining: 0,
    isNewsLockoutActive: false,
    currentSpreadPips: 1.2,
    isSystemStopActive: false,
    
    // Upgraded Features
    consecutiveLossCount: 0,
    emotionalVolatilityLevel: "Stable",
    revengeTradingActive: false,
    isOvertradingDetected: false
  });

  // --- PHASE 11 REAL EXECUTION INTELLIGENCE FOUNDATION ---
  const [activeLifecycleStage, setActiveLifecycleStage] = useState<
    "setup detected" | "waiting confirmation" | "armed" | "executed" | "protected" | "partial secured" | "closed" | "reviewed"
  >("waiting confirmation");

  const [activeSimPosition, setActiveSimPosition] = useState<{
    id: string;
    direction: "Buy" | "Sell";
    entryPrice: number;
    currentPrice: number;
    stopLoss: number;
    takeProfit: number;
    lots: number;
    unrealizedPnl: number;
    status: string;
  } | null>(null);

  // --- PHASE 12: ADAPTIVE LEARNING & SELF-CALIBRATION SYSTEM STATES ---
  const [adaptiveConfidenceOffset, setAdaptiveConfidenceOffset] = useState<number>(5);
  const [drawdownScaleBack, setDrawdownScaleBack] = useState<number>(1.0);
  const [volatilityInstabilityScore, setVolatilityInstabilityScore] = useState<number>(18);
  const [spreadDangerIndex, setSpreadDangerIndex] = useState<number>(24);

  // PHASE 13 Autonomic Adaptive Modifiers & Review State
  const [sweepWeightModifier, setSweepWeightModifier] = useState<number>(0);
  const [structureWeightModifier, setStructureWeightModifier] = useState<number>(0);
  const [sessionWeightModifier, setSessionWeightModifier] = useState<number>(0);
  const [lastCompletedTradeVerdict, setLastCompletedTradeVerdict] = useState<{
    id: string;
    setupType: string;
    verdict: string;
    executionQualityScore: number;
    volatilityScore: number;
    structuralAlignmentScore: number;
    mitigationQualityReview: string;
    spreadEfficiencyReview: string;
    sessionCondition: string;
    status: "Win" | "Loss";
  } | null>({
    id: "historical_prep_1",
    setupType: "London Purge Sweep Model",
    verdict: "Premium external sweep validated cleanly. Mitigated deep discount FVG with zero tracking latency.",
    executionQualityScore: 94,
    volatilityScore: 78,
    structuralAlignmentScore: 90,
    mitigationQualityReview: "Direct 78.6% Retest Verified",
    spreadEfficiencyReview: "Ultra Tight 1.1 pips",
    sessionCondition: "Active London Open Killzone",
    status: "Win"
  });

  const [historicalPatternMemory, setHistoricalPatternMemory] = useState<{
    id: string;
    setupType: string;
    structures: string;
    sweepQuality: string;
    displacementStrength: string;
    volatilityState: string;
    spreadConditions: string;
    sessionTiming: string;
    outcomeResult: "Win" | "Loss";
    tradeQuality?: string;
    setupEfficiency?: number;
    spreadInstability?: string;
    recoveryConsistency?: string;
  }[]>([
    { id: "1", setupType: "Asian SSL Hunt", structures: "CHoCH Buy", sweepQuality: "HQ Extreme", displacementStrength: "88%", volatilityState: "Stable", spreadConditions: "1.1 pips", sessionTiming: "London Open", outcomeResult: "Win", tradeQuality: "A+ Premium", setupEfficiency: 92, spreadInstability: "Normal", recoveryConsistency: "High Stable" },
    { id: "2", setupType: "London Range Expand", structures: "BOS Sell", sweepQuality: "Moderate", displacementStrength: "64%", volatilityState: "Expanding", spreadConditions: "1.4 pips", sessionTiming: "New York PM", outcomeResult: "Loss", tradeQuality: "B Core", setupEfficiency: 68, spreadInstability: "Elevated", recoveryConsistency: "Staged Buffer" },
    { id: "3", setupType: "NY Session Stop Run", structures: "MSS Buy", sweepQuality: "HQ Extreme", displacementStrength: "92%", volatilityState: "Stable", spreadConditions: "1.0 pips", sessionTiming: "New York Open", outcomeResult: "Win", tradeQuality: "A Strong", setupEfficiency: 86, spreadInstability: "Normal", recoveryConsistency: "High Stable" },
    { id: "4", setupType: "Asia Session Range High", structures: "None", sweepQuality: "Weak", displacementStrength: "40%", volatilityState: "Low Liquidity", spreadConditions: "1.6 pips", sessionTiming: "Asia mid-session", outcomeResult: "Loss", tradeQuality: "C Speculative", setupEfficiency: 42, spreadInstability: "High Instability", recoveryConsistency: "Compromised" }
  ]);

  // Telemetry alerts
  const [panelLogs, setPanelLogs] = useState<{ time: string; msg: string; category: "system" | "structure" | "safety" | "ai"; severity: "INFO" | "WARN" | "CRITICAL" | "EXECUTION"; engine: string }[]>([
    { time: "12:35", msg: "Feed architecture synchronised with TV webhooks.", category: "system", severity: "INFO", engine: "[ENGINE 8]" },
    { time: "12:36", msg: "Swing analysis reconstructed 3 key extremes.", category: "structure", severity: "INFO", engine: "[AI CORE]" },
    { time: "12:37", msg: "Spread monitoring healthy at 1.2 pips on gold bridge.", category: "safety", severity: "INFO", engine: "[ENGINE 13]" }
  ]);

  const addLog = (msg: string, category: "system" | "structure" | "safety" | "ai", severity?: "INFO" | "WARN" | "CRITICAL" | "EXECUTION", engine?: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0].substring(0, 5);
    
    let inferredEngine = engine || "";
    if (!inferredEngine) {
      if (category === "system") inferredEngine = "[ENGINE 8]";
      else if (category === "structure") inferredEngine = "[ENGINE 9]";
      else if (category === "safety") inferredEngine = "[ENGINE 13]";
      else if (category === "ai") inferredEngine = "[AI CORE]";
    }

    let inferredSeverity = severity || "INFO";
    if (!severity) {
      const upper = msg.toUpperCase();
      if (upper.includes("LOCKOUT") || upper.includes("DENIED") || upper.includes("HALT") || upper.includes("OVERRIDE")) {
        inferredSeverity = "CRITICAL";
      } else if (upper.includes("WARNING") || upper.includes("ALERT") || upper.includes("DANGER") || upper.includes("LIMIT")) {
        inferredSeverity = "WARN";
      } else if (upper.includes("EXECUTED") || upper.includes("POSITION") || upper.includes("INJECT")) {
        inferredSeverity = "EXECUTION";
      }
    }

    // Clean engine designators from raw messages if duplicated
    let cleanMsg = msg;
    if (cleanMsg.startsWith("Engine 8: ")) cleanMsg = cleanMsg.slice(10);
    else if (cleanMsg.startsWith("Engine 9: ")) cleanMsg = cleanMsg.slice(10);
    else if (cleanMsg.startsWith("Engine 10: ")) cleanMsg = cleanMsg.slice(11);
    else if (cleanMsg.startsWith("Engine 11: ")) cleanMsg = cleanMsg.slice(11);
    else if (cleanMsg.startsWith("Engine 12: ")) cleanMsg = cleanMsg.slice(11);
    else if (cleanMsg.startsWith("Engine 13: ")) cleanMsg = cleanMsg.slice(11);

    setPanelLogs((prev) => [{ time: timeStr, msg: cleanMsg, category, severity: inferredSeverity, engine: inferredEngine }, ...prev.slice(0, 24)]);
  };
  
  // --- PHASE 13: AUTONOMIC STRATEGY LEARNING ENGINE ---
  useEffect(() => {
    let sweepBonus = 0;
    let structureBonus = 0;
    let sessionBonus = 0;

    // Filter historical logs to compute running strategy adjustments
    const lookback = historicalPatternMemory.slice(0, 8);
    lookback.forEach(t => {
      const isWin = t.outcomeResult === "Win";
      
      // Sweep-based models evaluation (Objective 7)
      if (t.setupType.toLowerCase().includes("sweep") || t.setupType.toLowerCase().includes("hunt")) {
        if (t.sweepQuality === "HQ Extreme" || t.sweepQuality === "high quality") {
          sweepBonus += isWin ? 4 : -5;
        } else {
          sweepBonus += isWin ? 1 : -7; // severe penalty for failure of weak sweeps
        }
      }

      // Continuation Break structural models evaluation
      if (t.structures.toLowerCase().includes("bos") || t.structures.toLowerCase().includes("shift") || t.structures.toLowerCase().includes("mms")) {
        structureBonus += isWin ? 5 : -4;
      }

      // Timing / Session performance optimization
      if (t.sessionTiming.includes("London") || t.sessionTiming.includes("15M")) {
        sessionBonus += isWin ? 3 : -3;
      } else if (t.sessionTiming.includes("Asia")) {
        sessionBonus += isWin ? 1 : -6; // Asia compressions are suppressed
      }
    });

    setSweepWeightModifier(Math.max(-12, Math.min(12, sweepBonus)));
    setStructureWeightModifier(Math.max(-10, Math.min(12, structureBonus)));
    setSessionWeightModifier(Math.max(-8, Math.min(8, sessionBonus)));

    addLog(`Autonomic Strategy Review: Refined neural modifiers: Sweep(${sweepBonus >= 0 ? "+" : ""}${sweepBonus} pts), CHoCH-BOS(${structureBonus >= 0 ? "+" : ""}${structureBonus} pts), Timings(${sessionBonus >= 0 ? "+" : ""}${sessionBonus} pts). Core models calibrated.`, "ai", "INFO");
  }, [historicalPatternMemory]);

  // Seed initial candles when timeframe changes
  useEffect(() => {
    const list = initialCandleSets[selectedTimeframe].map(c => ({
      ...c,
      timeframe: selectedTimeframe
    }));
    setCandles(list);
    const lastClose = list[list.length - 1].close;
    setLiveTickPrice(lastClose);
    setTicksSinceLastClose(0);
    addLog(`Engine 8: Timeframe loaded ${selectedTimeframe}. Seeded ${list.length} initial bars.`, "system");
  }, [selectedTimeframe]);

  // Real-time Ticker Simulator Loop (Simulates live tick ingestion every 2 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isFeedStreaming && !safety.isSystemStopActive) {
      interval = setInterval(() => {
        setCandles((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          const activeBar = { ...updated[lastIndex] };
          
          // Generate a highly realistic fractional Gold price tick walk (average 0.2 - 2 pips scale)
          const isUp = Math.random() > 0.45; // slight bullish bias
          const tickChange = (Math.random() * 1.4) * (isUp ? 1 : -1);
          const nextPrice = parseFloat((activeBar.close + tickChange).toFixed(2));
          
          // Update dynamic current candle parameters in raw ingestion bounds
          activeBar.close = nextPrice;
          if (nextPrice > activeBar.high) activeBar.high = nextPrice;
          if (nextPrice < activeBar.low) activeBar.low = nextPrice;
          activeBar.volume += Math.round(Math.random() * 200 + 40);

          updated[lastIndex] = activeBar;
          
          // Set live price ticker state
          setLiveTickPrice(nextPrice);

          // Handle tick count towards closure
          const nextTicks = ticksSinceLastClose + 1;
          if (nextTicks >= maxTicksPerCandle) {
            // CONFIRMED CANDLE CLOSE EVENT DETECTED (Strict Requirement)
            const finalBarClose = activeBar.close;
            // Add a new raw candle structure into rolling history
            const nextTimestamp = calculateNextTimestamp(activeBar.timestamp, selectedTimeframe);
            const newBar: Engine8Candle = {
              timeframe: selectedTimeframe,
              timestamp: nextTimestamp,
              open: finalBarClose,
              high: finalBarClose,
              low: finalBarClose,
              close: finalBarClose,
              volume: 0
            };
            
            // Limit array sizes to 16 to protect visual viewports
            const pruned = [...updated, newBar];
            if (pruned.length > 14) pruned.shift();
            
            setTicksSinceLastClose(0);

            // Trigger structure reconstruction, liquidity scans, and state engine analyses on closed candle
            setTimeout(() => {
              reconstructStructureAndSignals(pruned, finalBarClose);
              
              // Controlled Semi-Autonomous Execution (Phase 4 Objective & Phase 17 compliance core)
              if (executionMode === "Semi-Auto Strategy") {
                if (isCoreModelFullyAligned && !safety.isCooldownActive && !safety.isSystemStopActive && safety.emotionalVolatilityLevel !== "Extreme Lockout") {
                  const direction = latestSweep?.type === "Sell-Side" ? "Buy" : "Sell";
                  const pipsRes = Math.random() > 0.42 ? Math.floor(40 + Math.random() * 50) : -15;
                  const tradeStatus = pipsRes > 0 ? "Win" : "Loss";
                  const tradeResult = {
                    id: "semi_auto_" + Date.now(),
                    date: new Date().toISOString().split("T")[0],
                    symbol: "XAUUSD",
                    timeframe: selectedTimeframe,
                    direction: direction as "Buy" | "Sell",
                    setupScore: precisionExecutionIntel.precisionEntryScore,
                    riskPct: finalAdaptiveRisk.riskPercentage,
                    rrRatio: 4.0,
                    status: tradeStatus as "Win" | "Loss",
                    pips: pipsRes,
                    liquiditySwept: (latestSweep ? latestSweep.type : "None") as LiquiditySweptType,
                    structureShift: (structureBreaks.length > 0 ? "BOS (Break of Structure)" : "None") as StructureShiftType,
                    sessionType: (selectedTimeframe === "15M" ? "London (Kill Zone)" : "New York") as SessionZoneType,
                    marketState: marketState,
                    spreadPips: safety.currentSpreadPips,
                    executionTiming: new Date().toTimeString().split(" ")[0].substring(0, 5),
                    spreadConditions: `${safety.currentSpreadPips} pips (Semi-Auto Algorithmic Execution Boundary)`,
                    entryReasoning: `Automated rule-based direct sweep trigger. Confidence calculated at ${precisionExecutionIntel.precisionEntryScore}%. FVG level mitigation retest confirmed.`,
                    emotionalState: "Stable" as const
                  };

                  onJournalLiveTrade(tradeResult);
                  
                  addLog(`[SEMI-AUTO EXECUTION] Core model 100% aligned. Execution fired. Risk: ${tradeResult.riskPct}% (anti-martingale active). Result: ${tradeStatus} (${pipsRes} pips)`, "ai", "EXECUTION");

                  setSafety(s => ({
                    ...s,
                    tradesThisSession: s.tradesThisSession + 1,
                    dailyDrawdown: parseFloat((s.dailyDrawdown + (tradeStatus === "Loss" ? 0.35 : -0.55)).toFixed(2)),
                    consecutiveLossCount: tradeStatus === "Loss" ? s.consecutiveLossCount + 1 : 0,
                    isCooldownActive: true,
                    cooldownSecondsRemaining: 15,
                    revengeTradingActive: tradeStatus === "Loss"
                  }));
                }
              }
            }, 50);

            return pruned;
          } else {
            setTicksSinceLastClose(nextTicks);
            // Dynamic spread tick fluctuations
            let spreadTick = parseFloat((1.0 + Math.random() * 0.4).toFixed(1));
            if (sessionTransition === "ny_volatility") {
              spreadTick = parseFloat((2.0 + Math.random() * 0.4).toFixed(1));
            } else if (sessionTransition === "news_instability") {
              spreadTick = parseFloat((3.2 + Math.random() * 0.5).toFixed(1));
            }
            setSafety(s => ({ ...s, currentSpreadPips: spreadTick }));
            return updated;
          }
        });
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFeedStreaming, ticksSinceLastClose, selectedTimeframe, safety.isSystemStopActive]);

  // Cooldown countdown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (safety.isCooldownActive && safety.cooldownSecondsRemaining > 0) {
      timer = setInterval(() => {
        setSafety(s => {
          if (s.cooldownSecondsRemaining <= 1) {
            addLog("Engine 13: Emergency cooldown period expired. Trading systems re-engaged.", "safety");
            return {
              ...s,
              isCooldownActive: false,
              cooldownSecondsRemaining: 0
            };
          }
          return {
            ...s,
            cooldownSecondsRemaining: s.cooldownSecondsRemaining - 1
          };
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [safety.isCooldownActive, safety.cooldownSecondsRemaining]);

  // PHASE 17 Live News Event Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (activeNewsFreeze !== "None" && newsFreezeTimeRemaining > 0) {
      timer = setInterval(() => {
        setNewsFreezeTimeRemaining(current => {
          if (current <= 1) {
            setActiveNewsFreeze("None");
            setSafety(s => ({ ...s, isNewsLockoutActive: false }));
            addLog("News Event Impact Stabilization Completed. Ingress gates unlocked for standard execution.", "safety", "INFO");
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeNewsFreeze, newsFreezeTimeRemaining]);

  // Helpers to increment timeline label timestamps
  const calculateNextTimestamp = (curStamp: string, tf: "15M" | "30M" | "1H") => {
    const [hStr, mStr] = curStamp.split(":");
    let h = parseInt(hStr);
    let m = parseInt(mStr);
    
    if (tf === "15M") {
      m += 15;
      if (m >= 60) { m = 0; h = (h + 1) % 24; }
    } else if (tf === "30M") {
      m += 30;
      if (m >= 60) { m = 0; h = (h + 1) % 24; }
    } else {
      h = (h + 1) % 24;
    }
    
    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

  // ==========================================
  // MODULES CORES: SWINGS, SWEEPS, STATE & RISK SIZING
  // ==========================================

  // Swing High/Low Detection (Engine 9)
  // Evaluates rolling candle history to detect local extrema patterns
  const swingPoints = useMemo<SwingPoint[]>(() => {
    if (candles.length < 5) return [];
    
    const swings: SwingPoint[] = [];
    
    // Middle candle must exceed surrounding neighbors
    for (let i = 2; i < candles.length - 2; i++) {
      const cPrev2 = candles[i - 2];
      const cPrev1 = candles[i - 1];
      const cur = candles[i];
      const cNext1 = candles[i + 1];
      const cNext2 = candles[i + 2];
      
      // Swing High: Local maximum high
      if (
        cur.high > cPrev1.high && 
        cur.high > cPrev2.high && 
        cur.high > cNext1.high && 
        cur.high > cNext2.high
      ) {
        swings.push({
          index: i,
          type: "High",
          price: cur.high,
          strength: cur.volume > 2200 ? "high quality" : "moderate"
        });
      }
      
      // Swing Low: Local minimum low
      if (
        cur.low < cPrev1.low && 
        cur.low < cPrev2.low && 
        cur.low < cNext1.low && 
        cur.low < cNext2.low
      ) {
        swings.push({
          index: i,
          type: "Low",
          price: cur.low,
          strength: cur.volume > 2200 ? "high quality" : "moderate"
        });
      }
    }
    
    return swings;
  }, [candles]);

  // Market Structure Events (Engine 9 - BOS, MSS, CHoCH)
  const structureBreaks = useMemo<StructureBreak[]>(() => {
    if (candles.length === 0 || swingPoints.length === 0) return [];
    
    const breaks: StructureBreak[] = [];
    
    // Look for closed candles that broke dynamic swing high or low points
    // A break requires a candle's CLOSE to hold beyond the prior swing extreme
    for (let i = 2; i < candles.length; i++) {
      const bar = candles[i];
      
      // Check prior swing high breach for Bullish structures
      const activeHighs = swingPoints.filter(s => s.index < i && s.type === "High");
      if (activeHighs.length > 0) {
        const targetHigh = activeHighs[activeHighs.length - 1];
        if (bar.close > targetHigh.price) {
          // Verify it's not checked already or close to it
          const isCHOCH = activeHighs.length === 1; // Change of character if it's the first shift
          breaks.push({
            type: isCHOCH ? "CHoCH" : "BOS",
            price: targetHigh.price,
            candleIndex: i,
            direction: "Bullish"
          });
        }
      }
      
      // Check prior swing low breach for Bearish structures
      const activeLows = swingPoints.filter(s => s.index < i && s.type === "Low");
      if (activeLows.length > 0) {
        const targetLow = activeLows[activeLows.length - 1];
        if (bar.close < targetLow.price) {
          const isCHOCH = activeLows.length === 1;
          breaks.push({
            type: isCHOCH ? "CHoCH" : "BOS",
            price: targetLow.price,
            candleIndex: i,
            direction: "Bearish"
          });
        }
      }
    }
    
    return breaks;
  }, [candles, swingPoints]);

  // Stop Hunt Sweep Detector (Engine 10)
  // Scans if a candle's wick breached an extreme but closed *within* it (rejection sweep)
  const latestSweep = useMemo<{ type: "Buy-Side" | "Sell-Side"; quality: "weak" | "moderate" | "high quality"; price: number } | null>(() => {
    if (candles.length < 3 || swingPoints.length === 0) return null;
    
    const lastBar = candles[candles.length - 1];
    
    // Look at the last closed or nearly closed bar
    // Buy-Side Liquidity Sweep (BSL): high breached previous swing high but close is below it
    const priorHighs = swingPoints.filter(s => s.index < candles.length - 1 && s.type === "High");
    if (priorHighs.length > 0) {
      const lastHigh = priorHighs[priorHighs.length - 1];
      if (lastBar.high > lastHigh.price && lastBar.close < lastHigh.price) {
        // Long upper wick (wick is > 65% of entire range means true rejection)
        const range = lastBar.high - lastBar.low;
        const bodyTop = Math.max(lastBar.open, lastBar.close);
        const upperWick = lastBar.high - bodyTop;
        
        return {
          type: "Buy-Side",
          quality: (upperWick / range > 0.6) ? "high quality" : "moderate",
          price: lastHigh.price
        };
      }
    }

    // Sell-Side Liquidity Sweep (SSL): low breached previous swing low but close is above it
    const priorLows = swingPoints.filter(s => s.index < candles.length - 1 && s.type === "Low");
    if (priorLows.length > 0) {
      const lastLow = priorLows[priorLows.length - 1];
      if (lastBar.low < lastLow.price && lastBar.close > lastLow.price) {
        const range = lastBar.high - lastBar.low;
        const bodyBottom = Math.min(lastBar.open, lastBar.close);
        const lowerWick = bodyBottom - lastBar.low;
        
        return {
          type: "Sell-Side",
          quality: (lowerWick / range > 0.6) ? "high quality" : "moderate",
          price: lastLow.price
        };
      }
    }

    return null;
  }, [candles, swingPoints]);

  // Market State Engine Classification (Engine 11)
  const marketState = useMemo<MarketStateType>(() => {
    if (candles.length < 4) return "Ranging";
    
    // Evaluate volatility and directional expansion rules
    const ranges = candles.map(c => c.high - c.low);
    const avgRange = ranges.reduce((acc, curr) => acc + curr, 0) / ranges.length;
    const lastBar = candles[candles.length - 1];
    const isLastBarHuge = (lastBar.high - lastBar.low) > (avgRange * 1.5);
    
    // Check if trending (successive higher highs/lows or lower highs/lows)
    let bullishTicks = 0;
    let bearishTicks = 0;
    for (let i = 1; i < candles.length; i++) {
      if (candles[i].close > candles[i - 1].close) bullishTicks++;
      else bearishTicks++;
    }

    if (isLastBarHuge && Math.abs(lastBar.close - lastBar.open) > avgRange) {
      return "Expanding";
    } else if (lastBar.high - lastBar.low > avgRange * 2.2) {
      return "Volatile";
    } else if (bullishTicks >= candles.length * 0.7 || bearishTicks >= candles.length * 0.7) {
      return "Trending";
    } else if (latestSweep) {
      return "Manipulative";
    } else if (avgRange < 1.0) {
      return "Low Liquidity";
    } else {
      return "Ranging";
    }
  }, [candles, latestSweep]);

  // Dynamics recalibrators for instability and spread indices (Objective 1 & 5)
  useEffect(() => {
    let targetVolt = 15;
    if (marketState === "Volatile") targetVolt = 82;
    else if (marketState === "Expanding") targetVolt = 58;
    else if (marketState === "Manipulative") targetVolt = 65;
    else if (marketState === "Ranging") targetVolt = 22;
    
    const interval = setTimeout(() => {
      setVolatilityInstabilityScore(st => {
        const diff = targetVolt - st;
        return Math.round(st + diff * 0.3);
      });
    }, 120);

    return () => clearTimeout(interval);
  }, [marketState]);

  useEffect(() => {
    const spreadVal = safety.currentSpreadPips;
    const targetDanger = Math.min(100, Math.round(((spreadVal - 0.8) / 1.1) * 100));
    setSpreadDangerIndex(Math.max(12, targetDanger));
  }, [safety.currentSpreadPips]);

  // =========================================================================
  // PHASE 14: REAL-TIME MARKET PRESSURE, SMART TIMING & RISK RECOVERY INTEL
  // =========================================================================
  const precisionExecutionIntel = useMemo(() => {
    // --- 1. Real-Time Market Pressure Analyzer (Objective 1) ---
    const lastBar = candles[candles.length - 1];
    let bullishPressure = 50;
    let bearishPressure = 50;
    let liquidityImbalance = 0; // -100 to +100
    let displacementAggression = 45; // 0 to 100
    let candleBodyDominance = 50; // 0 to 100
    let wickRejectionStrength = 15; // 0 to 100
    let momentumExhaustion = 12; // 0 to 100
    let liveExecutionPressure = 50;

    if (lastBar) {
      const range = Math.max(0.1, lastBar.high - lastBar.low);
      const bodySize = Math.abs(lastBar.close - lastBar.open);
      candleBodyDominance = Math.round((bodySize / range) * 100);
      
      const upperWick = lastBar.high - Math.max(lastBar.open, lastBar.close);
      const lowerWick = Math.min(lastBar.open, lastBar.close) - lastBar.low;
      wickRejectionStrength = Math.round((Math.max(upperWick, lowerWick) / range) * 100);

      // Ticks-based momentum walker
      const tickProgress = (ticksSinceLastClose / maxTicksPerCandle); // 0 to 1
      momentumExhaustion = Math.round(tickProgress * 60 + (candleBodyDominance > 75 ? 25 : 10));

      const positionPct = (liveTickPrice - lastBar.low) / range;
      bullishPressure = Math.max(10, Math.min(90, Math.round(positionPct * 80 + 10)));
      bearishPressure = 100 - bullishPressure;

      // Displacement Aggression
      if (marketState === "Expanding") {
        displacementAggression = 82;
      } else if (marketState === "Volatile") {
        displacementAggression = 91;
      } else if (marketState === "Trending") {
        displacementAggression = 70;
      } else if (marketState === "Manipulative") {
        displacementAggression = 60;
      } else {
        displacementAggression = 30;
      }

      liquidityImbalance = Math.max(-100, Math.min(100, Math.round((bullishPressure - bearishPressure) * 1.3)));
      liveExecutionPressure = Math.max(10, Math.min(95, Math.round(
        (bullishPressure * 0.5) + (displacementAggression * 0.2) + (50 + liquidityImbalance * 0.25)
      )));
    }

    // --- 2. Smart Trade Timing Engine (Objective 2) & Liquidity Trap Detection (Objective 6) ---
    let smartTimingStatus: "STABILIZING" | "EXECUTION_READY" | "SPIKE_DELAYED" | "TRAP_SENSING" | "COOLDOWN" = "STABILIZING";
    let smartTimingMessage = "Awaiting candle structure confirmation.";
    const activeTraps: string[] = [];

    if (safety.currentSpreadPips > 1.4) {
      activeTraps.push("Spread Expansion Trap Active");
    }
    if (marketState === "Manipulative") {
      activeTraps.push("Engineered Stop Hunt Inbound");
    }
    if (marketState === "Low Liquidity") {
      activeTraps.push("Low-Volume Consolidation Trap");
    }
    if (latestSweep && structureBreaks.length === 0) {
      activeTraps.push("Failed Sweep Continuation Fakeouts");
    }
    if (marketState === "Volatile" && ticksSinceLastClose < 3) {
      activeTraps.push("Fake BOS Displacement Trap");
    }

    if (safety.isCooldownActive) {
      smartTimingStatus = "COOLDOWN";
      smartTimingMessage = `Protective cooling cycle active. ${safety.cooldownSecondsRemaining}s remain.`;
    } else if (safety.currentSpreadPips > 1.5 || marketState === "Volatile") {
      smartTimingStatus = "SPIKE_DELAYED";
      smartTimingMessage = "Entry deferred: Volatility spike or spread enlargement detected.";
    } else if (ticksSinceLastClose < 3) {
      smartTimingStatus = "STABILIZING";
      smartTimingMessage = "Volatile tick walk in progress. Waiting for candle body stabilization.";
    } else if (activeTraps.length >= 2) {
      smartTimingStatus = "TRAP_SENSING";
      smartTimingMessage = "Sensing multi-factor traps. Validation criteria tightened.";
    } else {
      smartTimingStatus = "EXECUTION_READY";
      smartTimingMessage = "Execution boundaries optimized. High probability execution timing.";
    }

    // --- 3. Precision Entry Scoring (Objective 3) ---
    let score = 45;
    const scoreOffsets: { label: string; offset: number; value: string }[] = [];

    // HTF Alignment
    if (selectedTimeframe === "15M" || selectedTimeframe === "30M") {
      score += 15;
      scoreOffsets.push({ label: "HTF Flow Alignment", offset: 15, value: "Optimal M15/M30" });
    } else {
      score += 5;
      scoreOffsets.push({ label: "HTF Flow Alignment", offset: 5, value: "Moderate H1" });
    }

    // Sweep Quality
    if (latestSweep) {
      const sweepBonus = latestSweep.quality === "high quality" ? 25 : 15;
      score += sweepBonus;
      scoreOffsets.push({ label: "Sweep Liquidity", offset: sweepBonus, value: `${latestSweep.quality.toUpperCase()} ${latestSweep.type}` });
    } else {
      scoreOffsets.push({ label: "Sweep Liquidity", offset: 0, value: "No Liquid Sweeps" });
    }

    // Displacement Quality
    if (displacementAggression > 70) {
      score += 15;
      scoreOffsets.push({ label: "Displacement Aggression", offset: 15, value: "HQ Institutional" });
    } else if (displacementAggression > 40) {
      score += 5;
      scoreOffsets.push({ label: "Displacement Aggression", offset: 5, value: "Moderate Orderflow" });
    } else {
      score -= 10;
      scoreOffsets.push({ label: "Displacement Aggression", offset: -10, value: "Low Impulse" });
    }

    // Volatility Stability
    if (volatilityInstabilityScore < 30) {
      score += 10;
      scoreOffsets.push({ label: "Volatility Stability", offset: 10, value: "Stable Flow" });
    } else if (volatilityInstabilityScore > 65) {
      score -= 15;
      scoreOffsets.push({ label: "Volatility Stability", offset: -15, value: "Unstable Spikes" });
    }

    // Spread Quality
    const spreadVal = safety.currentSpreadPips;
    if (spreadVal <= 1.1) {
      score += 15;
      scoreOffsets.push({ label: "Spread Cost", offset: 15, value: `${spreadVal.toFixed(1)} pips` });
    } else if (spreadVal <= 1.3) {
      score += 5;
      scoreOffsets.push({ label: "Spread Cost", offset: 5, value: `${spreadVal.toFixed(1)} pips` });
    } else {
      score -= 20;
      scoreOffsets.push({ label: "Spread Cost", offset: -20, value: `${spreadVal.toFixed(1)} pips` });
    }

    // Timing Precision
    if (smartTimingStatus === "EXECUTION_READY") {
      score += 10;
      scoreOffsets.push({ label: "Execution Precision", offset: 10, value: "Optimized Window" });
    } else {
      score -= 15;
      scoreOffsets.push({ label: "Execution Precision", offset: -15, value: "Imprecise Expansion" });
    }

    // Session Timing
    if (selectedTimeframe === "15M") {
      score += 10;
      scoreOffsets.push({ label: "Session Timing", offset: 10, value: "Killzone Active" });
    }

    // Mitigation Validation
    if (structureBreaks.length > 0) {
      score += 10;
      scoreOffsets.push({ label: "Structure Mitigation", offset: 10, value: "BOS/CHoCH Mitigated" });
    }

    // --- 5. Adaptive Drawdown Recovery Logic (Objective 5) ---
    let recoveryStage: "Optimized Dynamic" | "Defensive Calibration Stabilized" | "Strict Defensive Lockdown" | "Gradual Aggregate Recovery" = "Optimized Dynamic";
    let recoveryDescription = "Standard liquidity continuation parameters active.";

    if (safety.dailyDrawdown >= 2.0 || safety.consecutiveLossCount >= 2) {
      recoveryStage = "Strict Defensive Lockdown";
      recoveryDescription = "Survival Limit Triggered: Sizing locked to 0%. Re-validation criteria extreme.";
      score -= 25;
    } else if (safety.dailyDrawdown > 1.4 || safety.consecutiveLossCount === 1) {
      recoveryStage = "Defensive Calibration Stabilized";
      recoveryDescription = "Under Recovery Pressure: Scaling lot aggression down, entry score floor at 75%.";
      score -= 12;
    } else if (lastCompletedTradeVerdict?.status === "Win" && safety.consecutiveLossCount === 0 && drawdownScaleBack < 1.0) {
      recoveryStage = "Gradual Aggregate Recovery";
      recoveryDescription = "Profitable drift established. Aggression restored in 15% aggregate increments.";
    }

    const precisionEntryScore = Math.max(10, Math.min(100, score));

    // --- 4. Execution Quality Ranking (Objective 4) ---
    let executionRanking: "Elite Precision" | "Institutional Grade" | "Moderate Quality" | "Defensive Setup" | "Unsafe Execution" = "Defensive Setup";
    let rankingColor = "text-amber-500 border-amber-900 bg-amber-950/20";
    let badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";

    if (precisionEntryScore >= 90) {
      executionRanking = "Elite Precision";
      rankingColor = "text-purple-400 border-purple-900 bg-purple-950/25";
      badgeColor = "bg-purple-950/40 text-purple-300 border border-purple-900/45 animate-pulse";
    } else if (precisionEntryScore >= 75) {
      executionRanking = "Institutional Grade";
      rankingColor = "text-emerald-400 border-emerald-950 bg-emerald-950/20";
      badgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
    } else if (precisionEntryScore >= 55) {
      executionRanking = "Moderate Quality";
      rankingColor = "text-sky-400 border-sky-950 bg-sky-950/20";
      badgeColor = "bg-sky-500/10 text-sky-400 border border-sky-500/30";
    } else if (precisionEntryScore >= 35) {
      executionRanking = "Defensive Setup";
      rankingColor = "text-amber-500 border-amber-900 bg-amber-950/10";
      badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    } else {
      executionRanking = "Unsafe Execution";
      rankingColor = "text-red-500 border-red-950 bg-red-950/30";
      badgeColor = "bg-red-500/15 text-red-400 border border-red-500/35 font-bold animate-pulse";
    }

    const biasLabel = latestSweep 
      ? (latestSweep.type === "Sell-Side" ? "Bullish (Sweep Retest)" : "Bearish (Sweep Retest)")
      : (structureBreaks.length > 0 ? (structureBreaks[structureBreaks.length - 1].direction === "Bullish" ? "Bullish Orderflow" : "Bearish Orderflow") : "Neutral H1 Flow");

    return {
      bullishPressure,
      bearishPressure,
      liquidityImbalance,
      displacementAggression,
      candleBodyDominance,
      wickRejectionStrength,
      momentumExhaustion,
      liveExecutionPressure,
      smartTimingStatus,
      smartTimingMessage,
      activeTraps,
      isTrapDetected: activeTraps.length > 0,
      precisionEntryScore,
      executionRanking,
      rankingColor,
      badgeColor,
      scoreOffsets,
      recoveryStage,
      recoveryDescription,
      biasLabel
    };
  }, [candles, liveTickPrice, ticksSinceLastClose, marketState, latestSweep, structureBreaks, safety, drawdownScaleBack, lastCompletedTradeVerdict]);

  // Active Score formulation on closed candles
  const currentConfidenceScore = useMemo<number>(() => {
    let baseScore = 40 + adaptiveConfidenceOffset;
    
    if (latestSweep) {
      baseScore += (latestSweep.quality === "high quality" ? 30 : 20) + sweepWeightModifier;
    }
    
    if (structureBreaks.length > 0) {
      baseScore += 20 + structureWeightModifier;
    }
    
    if (marketState === "Expanding" || marketState === "Trending") {
      baseScore += 10;
    }

    if (selectedTimeframe === "15M" || selectedTimeframe === "30M") {
      baseScore += 5 + sessionWeightModifier;
    }

    // --- OBJECTIVE 5: ADAPTIVE CONFIDENCE DECAY LOGIC ---
    if (marketState === "Volatile" || marketState === "Manipulative") {
      baseScore -= 20; // Unstable volatility decay
    } else if (marketState === "Low Liquidity") {
      baseScore -= 10; // Low volume hazard
    } else if (marketState === "Ranging") {
      baseScore -= 5;
    }

    if (safety.currentSpreadPips > 1.4) {
      baseScore -= 15; // Spread explosion penalty
    }

    if (structureBreaks.length === 0) {
      baseScore -= 10; // Inconsistent structural behavior penalty
    }

    if (safety.consecutiveLossCount > 0) {
      baseScore -= (safety.consecutiveLossCount * 12); // Consecutive invalidations penalty
    }

    if (selectedTimeframe === "1M" || selectedTimeframe === "5M") {
      baseScore -= 15; // Conflicting/noise HTF bias penalty
    }
    
    // 5. Emotional / consecutive losses confidence degradation penalties
    if (safety.emotionalVolatilityLevel === "Elevated") {
      baseScore -= 15;
    } else if (safety.emotionalVolatilityLevel === "Extreme Lockout") {
      baseScore -= 35;
    }
    if (safety.revengeTradingActive) {
      baseScore -= 10;
    }

    // 7. Session Transition Intelligence adaptations
    if (sessionTransition === "london_decay") {
      baseScore -= 15;
    } else if (sessionTransition === "asia_compression") {
      baseScore -= 20;
    } else if (sessionTransition === "news_instability") {
      baseScore -= 30;
    }
    
    return Math.max(10, Math.min(100, baseScore));
  }, [
    latestSweep, 
    structureBreaks, 
    marketState, 
    selectedTimeframe,
    safety.emotionalVolatilityLevel, 
    safety.revengeTradingActive, 
    safety.currentSpreadPips,
    safety.consecutiveLossCount,
    sessionTransition, 
    adaptiveConfidenceOffset,
    sweepWeightModifier,
    structureWeightModifier,
    sessionWeightModifier
  ]);

  // Dynamic visual adaptations theme per detected market state
  const stateColorTheme = useMemo(() => {
    switch(marketState) {
      case "Trending":
      case "Expanding":
        return {
          glow: "border-emerald-500/25 shadow-emerald-950/20 bg-emerald-950/2 bg-opacity-10",
          text: "text-emerald-450 text-emerald-400",
          bar: "bg-emerald-500/10",
          dot: "bg-emerald-500",
          border: "border-emerald-500/20",
          accent: "emerald",
          rgb: "rgb(16, 185, 129)"
        };
      case "Volatile":
      case "Manipulative":
        return {
          glow: "border-rose-500/25 shadow-rose-950/20 bg-rose-950/2 bg-opacity-10",
          text: "text-rose-400",
          bar: "bg-rose-500/10",
          dot: "bg-rose-500",
          border: "border-rose-500/20",
          accent: "rose",
          rgb: "rgb(244, 63, 94)"
        };
      case "Ranging":
        return {
          glow: "border-amber-500/25 shadow-amber-950/20 bg-amber-950/2 bg-opacity-10",
          text: "text-amber-400",
          bar: "bg-amber-500/10",
          dot: "bg-amber-500",
          border: "border-amber-500/20",
          accent: "amber",
          rgb: "rgb(245, 158, 11)"
        };
      case "Low Liquidity":
      default:
        return {
          glow: "border-indigo-500/25 shadow-indigo-950/20 bg-indigo-950/2 bg-opacity-10",
          text: "text-indigo-400",
          bar: "bg-indigo-500/10",
          dot: "bg-indigo-500",
          border: "border-indigo-500/20",
          accent: "indigo",
          rgb: "rgb(99, 102, 241)"
        };
    }
  }, [marketState]);

  // AI ENVIRONMENT CLASSIFICATION ENGINE (Phase 13 Environment Classification Upgrade)
  const environmentClassifier = useMemo(() => {
    let dominantLabel = "Compression";
    let dominantColor = "text-amber-400";
    let dominantExplanation = "Market contracted in tight range. Wait for breakout.";
    let dominantConf = 75;

    const isUnsafe = safety.emotionalVolatilityLevel === "Extreme Lockout" || safety.dailyDrawdown > 2.0 || safety.isSystemStopActive;
    const isNews = safety.currentSpreadPips > 1.5;
    const isVolatile = marketState === "Volatile";
    const isManipulative = marketState === "Manipulative" || (latestSweep !== null && marketState === "Volatile");
    const isSweep = latestSweep !== null;
    const isContinuation = structureBreaks.length > 0;
    const isTrending = marketState === "Trending" || marketState === "Expanding";

    if (isUnsafe) {
      dominantLabel = "Unsafe Trading Environment";
      dominantColor = "text-red-500 font-extrabold animate-pulse";
      dominantExplanation = "Psychology lockout or peak drawdown breached. ALL execution blocked.";
      dominantConf = 100;
    } else if (isNews) {
      dominantLabel = "News Instability";
      dominantColor = "text-orange-500 animate-pulse";
      dominantExplanation = "High-frequency news block. Execution spreads widened beyond stable thresholds.";
      dominantConf = 92;
    } else if (isManipulative) {
      dominantLabel = "Volatile Manipulation";
      dominantColor = "text-rose-400 font-semibold";
      dominantExplanation = "Liquidity grab in progress. High risk of slippage and stop-run hunts.";
      dominantConf = 88;
    } else if (isSweep) {
      dominantLabel = "Liquidity Sweep Conditions";
      dominantColor = "text-emerald-400 font-bold";
      dominantExplanation = "External sweep completed. Premium orderflow mitigation in progress.";
      dominantConf = 95;
    } else if (isContinuation) {
      dominantLabel = "Institutional Continuation Environment";
      dominantColor = "text-sky-400 font-semibold";
      dominantExplanation = "Market Structure Shift has locked. Momentum favoring active order blocks.";
      dominantConf = 86;
    } else if (isTrending) {
      dominantLabel = "Trending Expansion";
      dominantColor = "text-emerald-500 font-semibold";
      dominantExplanation = "Expansion vectors aligned. Trend following execution models fully approved.";
      dominantConf = 84;
    } else {
      dominantLabel = "Compression";
      dominantColor = "text-amber-500";
      dominantExplanation = "Low volume consolidation. Range boundaries intact.";
      dominantConf = 78;
    }

    // Build the 7 states scores for visualization list
    const states = [
      { label: "Unsafe Trading Environment", conf: isUnsafe ? 100 : 10, color: "text-red-500" },
      { label: "News Instability", conf: isNews ? 95 : (isUnsafe ? 20 : 15), color: "text-orange-500" },
      { label: "Volatile Manipulation", conf: isManipulative ? 90 : (isVolatile ? 75 : 20), color: "text-rose-400" },
      { label: "Liquidity Sweep Conditions", conf: isSweep ? 95 : 12, color: "text-emerald-400" },
      { label: "Institutional Continuation Environment", conf: isContinuation ? 88 : 15, color: "text-sky-450" },
      { label: "Trending Expansion", conf: isTrending ? 85 : 22, color: "text-emerald-500" },
      { label: "Compression", conf: (!isTrending && !isSweep && !isContinuation && !isVolatile && !isNews) ? 80 : 30, color: "text-amber-500" }
    ];

    states.sort((a, b) => b.conf - a.conf);

    return {
      states,
      dominant: {
        label: dominantLabel,
        conf: dominantConf,
        color: dominantColor,
        explanation: dominantExplanation
      }
    };
  }, [candles, safety, marketState, latestSweep, structureBreaks]);

  // PROBABILITY FUSION LAYER (Objective 2)
  const probabilityFusion = useMemo(() => {
    const hasHTF = currentConfidenceScore >= 55;
    const hasSweep = latestSweep !== null;
    const hasDisp = structureBreaks.length > 0 || currentConfidenceScore >= 65;
    const inKillzone = selectedTimeframe === "15M" || selectedTimeframe === "30M";
    const goodVolatility = marketState !== "Volatile" && marketState !== "Low Liquidity";
    const optimalSpread = safety.currentSpreadPips <= 1.4;
    const goodMitigation = currentConfidenceScore >= 60;

    const htfScore = hasHTF ? 15 : 0;
    const sweepScore = hasSweep ? (latestSweep?.quality === "high quality" ? 20 : 15) : 0;
    const dispScore = hasDisp ? 15 : 0;
    const sessionScore = inKillzone ? 15 : 5;
    const volScore = goodVolatility ? 10 : 3;
    const spreadScore = optimalSpread ? 10 : 2;
    const mitScore = goodMitigation ? 10 : 0;

    const domState = environmentClassifier.dominant;
    let envScore = 5;
    if (domState.label.includes("Accumulation") || domState.label.includes("Distribution")) {
      envScore = 5;
    } else if (domState.label === "Trending" || domState.label === "Expansion") {
      envScore = 4;
    } else {
      envScore = 1;
    }

    // Historical similarity matching (Objective 7)
    let similarityPct = 40;
    let modelName = "General Mitigation Zone";
    if (latestSweep?.type === "Sell-Side") {
      similarityPct = selectedTimeframe === "15M" ? 87 : 78;
      modelName = "historical London Open Sweep Reversal Model";
    } else if (latestSweep?.type === "Buy-Side") {
      similarityPct = selectedTimeframe === "15M" ? 91 : 82;
      modelName = "historical NY session range extreme sweep model";
    } else if (structureBreaks.length > 0) {
      similarityPct = 74;
      modelName = "historical BOS continuation model";
    }
    const replayScore = Math.round(similarityPct / 20);

    const totalScore = htfScore + sweepScore + dispScore + sessionScore + volScore + spreadScore + mitScore + envScore + replayScore;

    let grade: "A+ Premium" | "A Strong" | "B Core" | "C Speculative" | "AVOID" = "AVOID";
    let readiness = "STANDBY";
    let color = "text-gray-400";

    if (totalScore >= 85) {
      grade = "A+ Premium";
      readiness = "FULLY ARMED (IMMEDIATE)";
      color = "text-emerald-400";
    } else if (totalScore >= 70) {
      grade = "A Strong";
      readiness = "READY (MITIGATION PENDING)";
      color = "text-emerald-450 text-emerald-400";
    } else if (totalScore >= 55) {
      grade = "B Core";
      readiness = "MODERATE (WAIT)";
      color = "text-amber-400";
    } else if (totalScore >= 40) {
      grade = "C Speculative";
      readiness = "HIGH RISK (REDUCE EXPOSURE)";
      color = "text-orange-400";
    } else {
      grade = "AVOID";
      readiness = "LOCKOUT ACTIVE";
      color = "text-rose-400";
    }

    return {
      probabilityPct: totalScore,
      grade,
      readinessScore: totalScore,
      readinessLabel: readiness,
      color,
      similarityPct,
      modelName
    };
  }, [currentConfidenceScore, latestSweep, structureBreaks, selectedTimeframe, marketState, safety.currentSpreadPips, environmentClassifier]);

  // ADAPTIVE RISK INTELLIGENCE & LONG-TERM SURVIVAL CORE (Phase 13 Adaptive Strategy & Survival Model Upgrade)
  const adaptiveRisk = useMemo(() => {
    let scale = 1.0;
    const reasons: string[] = [];

    // Apply dynamic Phase 12 calibration drawdown scaleback
    if (drawdownScaleBack < 1.0) {
      scale = scale * drawdownScaleBack;
      reasons.push(`Calibration scaleback: x${drawdownScaleBack.toFixed(2)}`);
    }

    // --- OBJECTIVE 6: ENVIRONMENT RISK CONTROLLER ---
    const dominantEnv = environmentClassifier.dominant.label;
    if (dominantEnv === "Unsafe Trading Environment") {
      scale = 0.0;
      reasons.push("Survival Firewall: Lockout active (Unsafe Environment)");
    } else if (dominantEnv === "News Instability") {
      scale = Math.min(scale, 0.15);
      reasons.push("Severe spread slippage risk width");
    } else if (dominantEnv === "Volatile Manipulation") {
      scale = Math.min(scale, 0.35);
      reasons.push("Volatility grab risk-off multiplier");
    } else if (dominantEnv === "Compression") {
      scale = Math.min(scale, 0.50);
      reasons.push("Low-volume range constraint reduction");
    } else if (dominantEnv === "Trending Expansion" || dominantEnv === "Liquidity Sweep Conditions") {
      // Prioritize high-probability setup models, allow standard scale matching drawdown constraints
      scale = Math.min(scale, 1.0);
    }

    // --- OBJECTIVE 8: INSTITUTIONAL SURVIVAL FIREWALL ---
    if (safety.consecutiveLossCount === 1) {
      scale = Math.min(scale, 0.60 * drawdownScaleBack);
      reasons.push("Survival Firewall: Level 1 loss buffer engaged");
    } else if (safety.consecutiveLossCount >= 2) {
      scale = 0.0;
      reasons.push("Survival Firewall: Lockdown (Consecutive invalidations)");
    }

    if (safety.currentSpreadPips > 1.4) {
      scale = Math.min(scale, 0.40 * drawdownScaleBack);
      reasons.push("Spread slippage width");
    } else if (safety.currentSpreadPips > 1.2) {
      scale = Math.min(scale, 0.70 * drawdownScaleBack);
      reasons.push("Slight spread elevation");
    }

    if (safety.isNewsLockoutActive) {
      scale = 0.0;
      reasons.push("Macro publication embargo");
    }

    if (safety.revengeTradingActive) {
      scale = Math.min(scale, 0.30 * drawdownScaleBack);
      reasons.push("Survival Firewall: Revenge pattern suppressed");
    } else if (safety.isOvertradingDetected) {
      scale = 0.0;
      reasons.push("Survival Firewall: Session frequency limit hit");
    }

    if (safety.dailyDrawdown > 1.5) {
      scale = Math.min(scale, 0.35 * drawdownScaleBack);
      reasons.push("Drawdown buffer pressure scale");
    }
    if (safety.dailyDrawdown > 2.0) {
      scale = 0.0;
      reasons.push("Survival Firewall: Drawdown limit breached");
    }

    // Session transitions integration
    if (sessionTransition === "london_decay") {
      scale = Math.min(scale, 0.40 * drawdownScaleBack);
      reasons.push("London close volume decay");
    } else if (sessionTransition === "ny_volatility") {
      scale = Math.min(scale, 0.35 * drawdownScaleBack);
      reasons.push("NY volatility spike buffer");
    } else if (sessionTransition === "asia_compression") {
      scale = 0.0;
      reasons.push("Asian compression range avoidance");
    } else if (sessionTransition === "news_instability") {
      scale = 0.0;
      reasons.push("Macro news risk-freeze");
    }

    const finalPctStr = scale > 0 ? `${(1.0 * scale).toFixed(2)}%` : "FREEZE (0.00%)";

    return {
      scale,
      finalPctStr,
      reasons,
      isCompressed: scale < 1.0
    };
  }, [marketState, environmentClassifier, safety, sessionTransition, drawdownScaleBack]);

  // PRECISION ENTRY TIMING ENGINE (Objective 6)
  const precisionTiming = useMemo(() => {
    if (candles.length === 0) {
      return { rating: "Unsafe", bodyStr: 0, wickPct: 0, wickRej: "None", velocity: "Stable", speed: "None" };
    }
    const last = candles[candles.length - 1];
    const range = last.high - last.low;
    if (range === 0) {
      return { rating: "Unsafe", bodyStr: 0, wickPct: 0, wickRej: "None", velocity: "Stable", speed: "Slow" };
    }
    const body = Math.abs(last.close - last.open);
    const bodyPct = Math.round((body / range) * 100);
    const wickPct = 100 - bodyPct;

    let wickRej: "None" | "Moderate" | "HQ Extreme" = "None";
    if (wickPct > 60) wickRej = "HQ Extreme";
    else if (wickPct > 30) wickRej = "Moderate";

    let velocity = "Stable";
    if (range > 3.8) velocity = "Rapid Acceleration";
    else if (range > 2.2) velocity = "Normal Intake";

    let classification: "Sniper" | "Strong" | "Moderate" | "Unsafe" = "Unsafe";
    if (latestSweep && wickRej === "HQ Extreme" && safety.currentSpreadPips <= 1.4) {
      classification = "Sniper";
    } else if (structureBreaks.length > 0 && bodyPct > 55) {
      classification = "Strong";
    } else if (bodyPct > 35) {
      classification = "Moderate";
    } else {
      classification = "Unsafe";
    }

    return {
      rating: classification,
      bodyStr: bodyPct,
      wickPct,
      wickRej,
      velocity,
      reactionSpeed: latestSweep ? "Ultra-Hot (<0.8s)" : "Standard (1.2s)",
      mitigationEfficiency: currentConfidenceScore >= 75 ? "Deep Discount" : "Shallow/Mid-range"
    };
  }, [candles, latestSweep, currentConfidenceScore, safety.currentSpreadPips, structureBreaks]);

  // MULTI-TIMEFRAME ALIGNMENT MATRIX (Objective 1)
  const mtfAlignment = useMemo(() => {
    const bias = latestSweep 
      ? (latestSweep.type === "Sell-Side" ? "Bullish" : "Bearish")
      : (structureBreaks.length > 0 && structureBreaks[structureBreaks.length - 1].direction === "Bullish" ? "Bullish" : "Bearish");

    const h4Val = marketState === "Trending" || marketState === "Expanding" 
      ? (bias === "Bullish" ? "Bullish Expansion" : "Bearish Expansion")
      : "Range Bound";
    const h4Icon = marketState === "Trending" || marketState === "Expanding" 
      ? (bias === "Bullish" ? "▲" : "▼")
      : "◀▶";
    const h4Color = marketState === "Trending" || marketState === "Expanding"
      ? (bias === "Bullish" ? "text-emerald-400" : "text-rose-400")
      : "text-amber-400";

    const lastBreak = structureBreaks[structureBreaks.length - 1];
    const h1Val = lastBreak 
      ? (lastBreak.direction === "Bullish" ? "Bullish BOS" : "Bearish BOS")
      : (bias === "Bullish" ? "Bullish Axis" : "Bearish Axis");
    const h1Icon = bias === "Bullish" ? "▲" : "▼";
    const h1Color = bias === "Bullish" ? "text-emerald-400" : "text-red-400";

    const m30Val = currentConfidenceScore >= 60 ? "Displacement Locked" : "Consolidation Hunt";
    const m30Icon = currentConfidenceScore >= 60 ? "▲" : "●";
    const m30Color = currentConfidenceScore >= 60 ? "text-emerald-400" : "text-amber-500";

    const m15Val = latestSweep ? `Liquidity sweeps active` : "Awaiting liquidity run";
    const m15Icon = latestSweep ? "▲" : "●";
    const m15Color = latestSweep ? "text-emerald-400" : "text-zinc-650";

    let alignmentStatus: "FULLY ALIGNED" | "PARTIAL ALIGNMENT" | "CONFLICTED STRUCTURE" = "CONFLICTED STRUCTURE";
    if (latestSweep && structureBreaks.length > 0 && (marketState === "Trending" || marketState === "Expanding")) {
      alignmentStatus = "FULLY ALIGNED";
    } else if (latestSweep || structureBreaks.length > 0) {
      alignmentStatus = "PARTIAL ALIGNMENT";
    }

    return {
      h4: { val: h4Val, icon: h4Icon, color: h4Color },
      h1: { val: h1Val, icon: h1Icon, color: h1Color },
      m30: { val: m30Val, icon: m30Icon, color: m30Color },
      m15: { val: m15Val, icon: m15Icon, color: m15Color },
      alignmentStatus
    };
  }, [marketState, latestSweep, structureBreaks, currentConfidenceScore]);

  // Volatility Compression & Expansion Probability analysis limits
  const compressionTelemetry = useMemo(() => {
    if (candles.length < 4) {
      return { status: "Expansion Released", prob: "Low Priority", danger: false, color: "text-emerald-400" };
    }
    const last3Ranges = candles.slice(-3).map(c => c.high - c.low);
    const avgRange = last3Ranges.reduce((a, b) => a + b, 0) / 3;
    
    if (avgRange < 4.5) {
      const dangerBout = marketState === "Low Liquidity" || marketState === "Ranging";
      return {
        status: "Compression Building",
        prob: "High (Explosion Risk)",
        danger: dangerBout,
        color: "text-amber-400"
      };
    } else if (marketState === "Volatile" || marketState === "Expanding") {
      return {
        status: "Expansion Released",
        prob: "Completed",
        danger: true,
        color: "text-emerald-400"
      };
    } else {
      return {
        status: "Manipulation Probability High",
        prob: "Moderate (Fakeout Threat)",
        danger: true,
        color: "text-red-400"
      };
    }
  }, [candles, marketState]);

  // Equal High & Low liquidity hotspots
  const eqlPoints = useMemo(() => {
    const lows = swingPoints.filter(s => s.type === "Low");
    const clusters: number[] = [];
    for (let i = 0; i < lows.length; i++) {
      for (let j = i + 1; j < lows.length; j++) {
        if (Math.abs(lows[i].price - lows[j].price) <= 2.5) {
          clusters.push((lows[i].price + lows[j].price) / 2);
        }
      }
    }
    if (clusters.length === 0 && lows.length > 0) {
      clusters.push(Math.min(...lows.map(l => l.price)));
    }
    return Array.from(new Set(clusters));
  }, [swingPoints]);

  const eqhPoints = useMemo(() => {
    const highs = swingPoints.filter(s => s.type === "High");
    const clusters: number[] = [];
    for (let i = 0; i < highs.length; i++) {
      for (let j = i + 1; j < highs.length; j++) {
        if (Math.abs(highs[i].price - highs[j].price) <= 2.5) {
          clusters.push((highs[i].price + highs[j].price) / 2);
        }
      }
    }
    if (clusters.length === 0 && highs.length > 0) {
      clusters.push(Math.max(...highs.map(h => h.price)));
    }
    return Array.from(new Set(clusters));
  }, [swingPoints]);

  // Institutional Scorer Checklist before Execution triggers
  const checklistItems = useMemo(() => {
    const avgSpread = safety.currentSpreadPips;
    return [
      { id: "htf", name: "HTF Structure Alignment", status: currentConfidenceScore >= 55, desc: "Primary trend structural bias confirmed" },
      { id: "liq", name: "Liquidity Sweep Setup", status: latestSweep !== null, desc: "Liquidity pools swept and absorbed" },
      { id: "disp", name: "Displacement Locked", status: structureBreaks.length > 0 || currentConfidenceScore >= 65, desc: "Impulsive breakout momentum confirmed" },
      { id: "session", name: "Active Session Timing", status: selectedTimeframe === "15M" || selectedTimeframe === "30M", desc: "Executing within high timing killzone" },
      { id: "spread", name: "Spread Slippage Bound", status: avgSpread <= 1.4, desc: `Premium execution spread ${avgSpread} pips < 1.5 Limit` },
      { id: "vol", name: "Volatility Core Neutral", status: marketState !== "Volatile" && marketState !== "Low Liquidity", desc: "Ideal risk neutral volatility bounds" },
      { id: "mit", name: "Mitigation Retest Guard", status: currentConfidenceScore >= 60, desc: "FVG mitigation level retest validated" }
    ];
  }, [currentConfidenceScore, latestSweep, structureBreaks, selectedTimeframe, safety.currentSpreadPips, marketState]);

  // PHASE 17 Core Execution Model Alignment Matrix (The 9 Institutional Checkpoints)
  const is1H_BiasConfirmed = useMemo(() => {
    if (forceAlignmentOverride) return true;
    // 1H directional bias is confirmed when there is a bias from sweeps or structure breaks
    return latestSweep !== null || structureBreaks.length > 0;
  }, [forceAlignmentOverride, latestSweep, structureBreaks]);

  const isLiquiditySweepDetected = useMemo(() => {
    if (forceAlignmentOverride) return true;
    return latestSweep !== null;
  }, [forceAlignmentOverride, latestSweep]);

  const isDisplacementValidated = useMemo(() => {
    if (forceAlignmentOverride) return true;
    return precisionExecutionIntel.displacementAggression >= 55;
  }, [forceAlignmentOverride, precisionExecutionIntel.displacementAggression]);

  const isStructureConfirmed = useMemo(() => {
    if (forceAlignmentOverride) return true;
    return structureBreaks.length > 0;
  }, [forceAlignmentOverride, structureBreaks]);

  const isFVGRetestConfirmed = useMemo(() => {
    if (forceAlignmentOverride) return true;
    // FVG mitigation is validated if confidence score satisfies minimum mitigation retest threshold
    return currentConfidenceScore >= 55;
  }, [forceAlignmentOverride, currentConfidenceScore]);

  const isSpreadAcceptable = useMemo(() => {
    if (forceAlignmentOverride) return true;
    return safety.currentSpreadPips <= 1.4;
  }, [forceAlignmentOverride, safety.currentSpreadPips]);

  const isVolatilityStable = useMemo(() => {
    if (forceAlignmentOverride) return true;
    return volatilityInstabilityScore < 65;
  }, [forceAlignmentOverride, volatilityInstabilityScore]);

  const isMarketSessionActive = useMemo(() => {
    if (forceAlignmentOverride) return true;
    // London or NY active, avoiding dead Asian chop / rollover periods
    return sessionTransition !== "asia_compression";
  }, [forceAlignmentOverride, sessionTransition]);

  const isConfidenceThresholdPassed = useMemo(() => {
    if (forceAlignmentOverride) return true;
    return precisionExecutionIntel.precisionEntryScore >= 70;
  }, [forceAlignmentOverride, precisionExecutionIntel.precisionEntryScore]);

  // Overall Core Model Alignment Validator
  const isCoreModelFullyAligned = useMemo(() => {
    return (
      is1H_BiasConfirmed &&
      isLiquiditySweepDetected &&
      isDisplacementValidated &&
      isStructureConfirmed &&
      isFVGRetestConfirmed &&
      isSpreadAcceptable &&
      isVolatilityStable &&
      isMarketSessionActive &&
      isConfidenceThresholdPassed
    );
  }, [
    is1H_BiasConfirmed,
    isLiquiditySweepDetected,
    isDisplacementValidated,
    isStructureConfirmed,
    isFVGRetestConfirmed,
    isSpreadAcceptable,
    isVolatilityStable,
    isMarketSessionActive,
    isConfidenceThresholdPassed
  ]);

  // PHASE 17 institutional adaptive risk exposure
  const finalAdaptiveRisk = useMemo(() => {
    let baseExposure = 0.8; // 0.8% default risk exposure (within 0.5% - 1.0% envelope)
    const riskFrictionReasons: string[] = [];

    // Reduce risk due to drawdowns (consecutive losses)
    if (safety.consecutiveLossCount > 0) {
      const scaleDown = Math.pow(0.5, safety.consecutiveLossCount);
      baseExposure *= scaleDown;
      riskFrictionReasons.push(`Consecutive loss damper (x${scaleDown.toFixed(2)}) - Anti-Martingale Lockdown`);
    }

    // Reduce risk due to unstable volatility
    if (volatilityInstabilityScore > 50) {
      baseExposure *= 0.6;
      riskFrictionReasons.push("High volatility instability shock (-40%)");
    }

    // Reduce risk due to spread spikes
    if (safety.currentSpreadPips > 1.2) {
      baseExposure *= 0.7;
      riskFrictionReasons.push(`Spread friction of ${safety.currentSpreadPips} pips (-30%)`);
    }

    // Reduce risk due to low confidence score
    if (currentConfidenceScore < 70) {
      baseExposure *= 0.5;
      riskFrictionReasons.push(`Low environment confidence offset (-50%)`);
    }

    // Strictly ensure lot sizes are calibrated and do not compound uncontrollably
    const finalRiskPercentage = parseFloat(Math.max(0.1, Math.min(1.0, baseExposure)).toFixed(2));

    return {
      riskPercentage: finalRiskPercentage,
      reasons: riskFrictionReasons,
      isAntiMartingaleActive: safety.consecutiveLossCount > 0
    };
  }, [safety.consecutiveLossCount, volatilityInstabilityScore, safety.currentSpreadPips, currentConfidenceScore]);

  // --- REAL-TIME PORTFOLIO & EXECUTION LIFECYCLE COORDINATOR ---
  useEffect(() => {
    if (activeSimPosition) {
      // Calculate change of price
      const priceDiff = activeSimPosition.direction === "Buy"
        ? liveTickPrice - activeSimPosition.entryPrice
        : activeSimPosition.entryPrice - liveTickPrice;
      
      const unrealizedPnlVal = parseFloat((priceDiff * 15 * activeSimPosition.lots).toFixed(2));
      
      // Update the position tickers with latest feed
      setActiveSimPosition(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentPrice: liveTickPrice,
          unrealizedPnl: unrealizedPnlVal
        };
      });

      // PHASE 17 Dynamic Target and Invalidation Breaches
      const isTpBreached = activeSimPosition.direction === "Buy"
        ? liveTickPrice >= activeSimPosition.takeProfit
        : liveTickPrice <= activeSimPosition.takeProfit;

      const isSlBreached = activeSimPosition.direction === "Buy"
        ? liveTickPrice <= activeSimPosition.stopLoss
        : liveTickPrice >= activeSimPosition.stopLoss;

      if (isTpBreached) {
        addLog(`Engine 12 Lifecycle: Dynamic Take Profit boundary hit at $${liveTickPrice.toFixed(2)}. Target pool liquidated.`, "safety", "EXECUTION");
        
        const pipsEarned = Math.round(Math.abs(liveTickPrice - activeSimPosition.entryPrice) * 10);
        const resolved: JournaledTrade = {
          id: activeSimPosition.id,
          date: new Date().toISOString().split("T")[0],
          symbol: "XAUUSD",
          timeframe: selectedTimeframe,
          direction: activeSimPosition.direction,
          setupScore: currentConfidenceScore,
          riskPct: activeSimPosition.lots,
          rrRatio: 4.2,
          status: "Win",
          pips: pipsEarned,
          liquiditySwept: latestSweep ? latestSweep.type : "Sell-Side",
          structureShift: structureBreaks.length > 0 ? "BOS (Break of Structure)" : "MSS (Market Structure Shift)",
          sessionType: selectedTimeframe === "15M" ? "London (Kill Zone)" : "New York",
          marketState: marketState,
          spreadPips: safety.currentSpreadPips,
          executionTiming: new Date().toTimeString().split(" ")[0].substring(0, 5),
          spreadConditions: `${safety.currentSpreadPips} pips`,
          entryReasoning: `Automated Lifecycle. Position executed upon sweep align. Trailed to ultimate target of ${pipsEarned} pips in ${selectedTimeframe}.`,
          emotionalState: safety.emotionalVolatilityLevel
        };
        onJournalLiveTrade(resolved);

        // PHASE 12 & 13 Recalibrations: Increase confidence and slowly restore aggression, report verdict
        setAdaptiveConfidenceOffset(prev => Math.min(15, prev + 5));
        setDrawdownScaleBack(prev => Math.min(1.0, prev + 0.15));
        
        const winExScore = Math.min(100, Math.round((currentConfidenceScore + 10) * (structureBreaks.length > 0 ? 1.05 : 0.95)));
        setLastCompletedTradeVerdict({
          id: activeSimPosition.id,
          setupType: latestSweep ? `${latestSweep.type} Sweep Model` : "Structure Shift Continuation",
          verdict: `Premium alignment executed cleanly. Re-secured partial limits and liquidated full target RR in high-probability zone with absolute tracking accuracy.`,
          executionQualityScore: winExScore,
          volatilityScore: volatilityInstabilityScore,
          structuralAlignmentScore: structureBreaks.length > 0 ? 95 : 70,
          mitigationQualityReview: latestSweep ? "Perfect mitigation retest of liquidity pool" : "Standard structural mitigation verified",
          spreadEfficiencyReview: `${safety.currentSpreadPips} pips (Optimal execution limit)`,
          sessionCondition: selectedTimeframe === "15M" ? "London Killzone" : "New York Open",
          status: "Win"
        });

        setHistoricalPatternMemory(prev => [
          {
            id: activeSimPosition.id,
            setupType: latestSweep ? `${latestSweep.type} Sweep` : "Structure Shift Run",
            structures: structureBreaks.length > 0 ? "BOS Shift Locked" : "MSS Confirmation",
            sweepQuality: latestSweep ? latestSweep.quality : "Moderate",
            displacementStrength: "85%",
            volatilityState: marketState,
            spreadConditions: `${safety.currentSpreadPips} pips`,
            sessionTiming: selectedTimeframe === "15M" ? "London KZ" : "New York Open",
            outcomeResult: "Win",
            tradeQuality: "A+ Institutional",
            setupEfficiency: winExScore,
            spreadInstability: safety.currentSpreadPips > 1.3 ? "Elevated" : "Stable",
            recoveryConsistency: "Optimally Calibrated"
          },
          ...prev
        ]);

        setActiveSimPosition(null);
        setActiveLifecycleStage("closed");

        setSafety(s => ({
          ...s,
          tradesThisSession: s.tradesThisSession + 1,
          dailyDrawdown: parseFloat((s.dailyDrawdown - 0.75).toFixed(2)),
          consecutiveLossCount: 0,
          isCooldownActive: true,
          cooldownSecondsRemaining: 20
        }));

        setTimeout(() => {
          setActiveLifecycleStage("reviewed");
        }, 1500);

      } else if (isSlBreached) {
        addLog(`Engine 12 Lifecycle: Protective Stop Loss breached at $${liveTickPrice.toFixed(2)}. Capital protection triggered.`, "safety", "CRITICAL");
        
        const pipsLost = Math.round(Math.abs(liveTickPrice - activeSimPosition.entryPrice) * 10);
        const resolved: JournaledTrade = {
          id: activeSimPosition.id,
          date: new Date().toISOString().split("T")[0],
          symbol: "XAUUSD",
          timeframe: selectedTimeframe,
          direction: activeSimPosition.direction,
          setupScore: currentConfidenceScore,
          riskPct: activeSimPosition.lots,
          rrRatio: 1.0,
          status: "Loss",
          pips: pipsLost,
          liquiditySwept: latestSweep ? latestSweep.type : "None",
          structureShift: "None",
          sessionType: selectedTimeframe === "15M" ? "London (Kill Zone)" : "New York",
          marketState: marketState,
          spreadPips: safety.currentSpreadPips,
          executionTiming: new Date().toTimeString().split(" ")[0].substring(0, 5),
          spreadConditions: `${safety.currentSpreadPips} pips`,
          entryReasoning: `Automated Lifecycle. Stop hit at protective boundary. Restricted within acceptable parameters.`,
          emotionalState: safety.emotionalVolatilityLevel
        };
        onJournalLiveTrade(resolved);

        // PHASE 12 & 13 Recalibrations: Decrease confidence & scale down aggression LOT sizes, generate audit report
        setAdaptiveConfidenceOffset(prev => Math.max(-25, prev - 10));
        setDrawdownScaleBack(prev => Math.max(0.25, prev - 0.35));
        
        const lossExScore = Math.max(10, Math.round(currentConfidenceScore * 0.7));
        setLastCompletedTradeVerdict({
          id: activeSimPosition.id,
          setupType: latestSweep ? `${latestSweep.type} Sweep Model` : "Structure Shift Continuation",
          verdict: `Stop-loss validated. Liquidity buffer penetrated. Environment was classified as ${marketState}. Risk mitigation protocol successfully capped downside exposure to protect capital.`,
          executionQualityScore: lossExScore,
          volatilityScore: volatilityInstabilityScore,
          structuralAlignmentScore: structureBreaks.length > 0 ? 60 : 30,
          mitigationQualityReview: "Order Block invalidation / Sweep run-through",
          spreadEfficiencyReview: `${safety.currentSpreadPips} pips (Neutral exposure)`,
          sessionCondition: selectedTimeframe === "15M" ? "London Killzone" : "New York Open",
          status: "Loss"
        });

        setHistoricalPatternMemory(prev => [
          {
            id: activeSimPosition.id,
            setupType: latestSweep ? `${latestSweep.type} Hunt Fail` : "Stophunt Run-Through",
            structures: "None Registered",
            sweepQuality: latestSweep ? latestSweep.quality : "Weak",
            displacementStrength: "34%",
            volatilityState: marketState,
            spreadConditions: `${safety.currentSpreadPips} pips`,
            sessionTiming: selectedTimeframe === "15M" ? "London KZ" : "New York Open",
            outcomeResult: "Loss",
            tradeQuality: "C Speculative",
            setupEfficiency: lossExScore,
            spreadInstability: safety.currentSpreadPips > 1.3 ? "Severe Instability" : "Stable",
            recoveryConsistency: "Safeguarded Mode Engaged"
          },
          ...prev
        ]);

        setActiveSimPosition(null);
        setActiveLifecycleStage("closed");

        setSafety(s => {
          const nextTrades = s.tradesThisSession + 1;
          const nextLossCount = s.consecutiveLossCount + 1;
          const emotional = nextLossCount >= 2 ? "Extreme Lockout" : (nextLossCount === 1 ? "Elevated" : "Stable");
          return {
            ...s,
            tradesThisSession: nextTrades,
            consecutiveLossCount: nextLossCount,
            emotionalVolatilityLevel: emotional,
            dailyDrawdown: parseFloat((s.dailyDrawdown + 0.35).toFixed(2)),
            isCooldownActive: true,
            cooldownSecondsRemaining: 20,
            revengeTradingActive: true,
            isSystemStopActive: emotional === "Extreme Lockout" ? true : s.isSystemStopActive
          };
        });

        setTimeout(() => {
          setActiveLifecycleStage("reviewed");
        }, 1550);

      } else {
        // PHASE 17 Dynamic Inside-State Protection Progression
        if (priceDiff >= 1.5 && activeLifecycleStage === "executed") {
          setActiveLifecycleStage("protected");
          setActiveSimPosition(prev => {
            if (!prev) return null;
            return {
              ...prev,
              stopLoss: prev.entryPrice // Relocated stop to break-even!
            };
          });
          addLog("Engine 11 Real-Time Risk Protection: Stop-Loss relocated directly to entry price after securing +1.5 pip movement (Break-Even protection locked).", "safety", "INFO");
        } else if (priceDiff >= 2.8 && activeLifecycleStage === "protected") {
          setActiveLifecycleStage("partial secured");
          setActiveSimPosition(prev => {
            if (!prev) return null;
            return {
              ...prev,
              lots: parseFloat((prev.lots * 0.5).toFixed(2)),
              unrealizedPnl: parseFloat((prev.unrealizedPnl * 0.5).toFixed(2))
            };
          });
          addLog("Engine 11 Real-Time Risk Protection: Securing 50% partial profit target. Position scale-down complete.", "safety", "INFO");
        }

        // Trailing Stop Protection logic: trail behind by 1.2 pips as price moves further in profit
        if (priceDiff > 3.2 && (activeLifecycleStage === "partial secured" || activeLifecycleStage === "protected")) {
          const trailingStep = activeSimPosition.direction === "Buy" ? 1.2 : -1.2;
          const nextTrailSL = parseFloat((liveTickPrice - trailingStep).toFixed(2));
          const isSLBetter = activeSimPosition.direction === "Buy"
            ? nextTrailSL > activeSimPosition.stopLoss
            : nextTrailSL < activeSimPosition.stopLoss;

          if (isSLBetter) {
            setActiveSimPosition(prev => {
              if (!prev) return null;
              return {
                ...prev,
                stopLoss: nextTrailSL
              };
            });
            addLog(`Trailing Shield Engaged: Trailed SL up to $${nextTrailSL.toFixed(2)} keeping absolute capital lockdown.`, "safety", "INFO");
          }
        }
      }
    } else {
      // Setup alignment tracking when sidelined
      const isSpreadAcceptable = safety.currentSpreadPips <= 1.4;
      const isVolAcceptable = marketState !== "Volatile" && marketState !== "Low Liquidity";
      const isSessionActive = selectedTimeframe === "15M" || selectedTimeframe === "30M";
      const isConfAcceptable = currentConfidenceScore >= 60;
      
      const matrixCounter = 
        (currentConfidenceScore >= 55 ? 1 : 0) +
        (latestSweep !== null ? 1 : 0) +
        (structureBreaks.length > 0 ? 1 : 0) +
        (isSessionActive ? 1 : 0) +
        (isSpreadAcceptable ? 1 : 0) +
        (isVolAcceptable ? 1 : 0) +
        (isConfAcceptable ? 1 : 0);

      if (matrixCounter === 7) {
        if (activeLifecycleStage !== "armed") {
          setActiveLifecycleStage("armed");
          addLog("Portfolio Engine Integration: Entry checklist 100% satisfied. SYSTEM STATS: ARMED.", "ai", "INFO");
        }
      } else if (latestSweep) {
        if (structureBreaks.length > 0) {
          if (activeLifecycleStage !== "waiting confirmation" && activeLifecycleStage !== "executed") {
            setActiveLifecycleStage("waiting confirmation");
          }
        } else {
          if (activeLifecycleStage !== "setup detected" && activeLifecycleStage !== "executed") {
            setActiveLifecycleStage("setup detected");
          }
        }
      } else {
        if (activeLifecycleStage !== "waiting confirmation" && activeLifecycleStage !== "executed" && activeLifecycleStage !== "protected" && activeLifecycleStage !== "partial secured" && activeLifecycleStage !== "closed" && activeLifecycleStage !== "reviewed") {
          setActiveLifecycleStage("waiting confirmation");
        }
      }
    }
  }, [liveTickPrice, activeSimPosition, safety.currentSpreadPips, marketState, selectedTimeframe, currentConfidenceScore, latestSweep, structureBreaks]);

  // Trigger reconstruction logic & logging
  const reconstructStructureAndSignals = (closedCandles: Engine8Candle[], finalClose: number) => {
    addLog(`Engine 8: Closed candle confirmed at $${finalClose.toFixed(2)}.`, "system");
    
    // Run structure engine checks
    addLog(`Engine 9: Analysing swing shifts. State classed as '${marketState}'.`, "structure");
    
    if (latestSweep) {
      addLog(`Engine 10: INSTITUTIONAL PURGE DETECTED! Swept ${latestSweep.type} extreme. Wick quality: ${latestSweep.quality}.`, "structure");
    }
    
    const lastBreak = structureBreaks[structureBreaks.length - 1];
    if (lastBreak) {
      addLog(`Engine 9: Structural shifts locked. Direct ${lastBreak.type} Break at $${lastBreak.price.toFixed(2)}.`, "structure");
    }

    // Safety checks
    if (safety.tradesThisSession >= 3) {
      addLog("Engine 13 WARNING: Daily trade threshold of 3 reached. Cooldown mode engaged.", "safety");
      setSafety(s => ({ ...s, isCooldownActive: true, cooldownSecondsRemaining: 30 }));
    }
  };

  // ==========================================
  // ACTIONS / CONTROLS INTERACTIVE LAYER
  // ==========================================

  const handleManualInject = () => {
    onInjectSetup({
      liquiditySwept: latestSweep ? latestSweep.type : "None",
      structureShift: structureBreaks.length > 0 
        ? `${structureBreaks[structureBreaks.length - 1].type} (Break of Structure)` as any
        : "None",
      fairValueGapMatched: "Yes (Discount Area)",
      sessionType: selectedTimeframe === "15M" ? "London (Kill Zone)" : "New York",
      direction: latestSweep?.type === "Sell-Side" ? "Buy" : "Sell",
      notes: `Institutional analysis pipeline sweep detected on semi-live Gold feed (${selectedTimeframe} chart). Market is currently in ${marketState} state at $${liveTickPrice}.`,
      multiplierScore: currentConfidenceScore,
      timeframe: selectedTimeframe
    });
    addLog("Engine 12: Injected live setup parameters into dynamic scorer context.", "ai");
  };

  const handleExecuteLiveDirectly = () => {
    // Check Engine 13 hard constraints (Trade Psychology Firewall)
    if (safety.isNewsLockoutActive) {
      addLog("Execution Denied: Active Macro Publication News Freeze is engaged (CPI/NFP/FOMC lockdown). Wait for stabilization countdown.", "safety", "CRITICAL");
      return;
    }
    if (safety.isCooldownActive) {
      addLog("Execution Denied: Cooldown lockout active. Capital safety rule protecting account.", "safety", "CRITICAL");
      return;
    }
    if (safety.isSystemStopActive) {
      addLog("Execution Denied: Emergency system lockdown is active.", "safety", "CRITICAL");
      return;
    }
    if (safety.emotionalVolatilityLevel === "Extreme Lockout") {
      addLog("Execution Denied: Emotional Volatility LOCK active. Reset metrics to resume.", "safety", "CRITICAL");
      return;
    }
    if (safety.isOvertradingDetected) {
      addLog("Execution Denied: Trade Psychology Firewall engaged due to Overtrading Cap (3 trades/session maximum).", "safety", "CRITICAL");
      return;
    }
    if (safety.currentSpreadPips > 1.8) {
      addLog(`Execution Denied: Spread (${safety.currentSpreadPips} pips) exceeds maximum slippage limits!`, "safety", "CRITICAL");
      return;
    }

    // PHASE 17 Institutional Core Model compliance matrix check
    if (!isCoreModelFullyAligned) {
      addLog("Execution Denied: Core Execution Model Alignment Matrix not fully satisfied! (Refer to Checklist in Sidebar or calibration console)", "safety", "CRITICAL");
      return;
    }

    // Adaptive Risk Intelligence Calculations (Phase 17)
    const currentRiskAlloc = finalAdaptiveRisk.riskPercentage;
    if (currentRiskAlloc <= 0.0) {
      addLog("Execution Denied: Adaptive Risk Engine forced safety freeze (Risk scaled to 0%).", "safety", "CRITICAL");
      return;
    }

    const direction = latestSweep?.type === "Sell-Side" ? "Buy" : "Sell";
    
    // Dynamic structure-based SL: Buy SL below sweep low, Sell SL above sweep high (incorporating a small 0.8 pip buffer)
    const stopLossPrice = direction === "Buy"
      ? parseFloat(((latestSweep ? latestSweep.price : liveTickPrice - 3.8) - 0.8).toFixed(2))
      : parseFloat(((latestSweep ? latestSweep.price : liveTickPrice + 3.8) + 0.8).toFixed(2));
      
    // Dynamic Take Profit: Targeting external structures (equal highs/lows pools)
    const takeProfitPrice = direction === "Buy"
      ? parseFloat((eqhPoints.length > 0 ? Math.max(...eqhPoints) : liveTickPrice + 6.2).toFixed(2))
      : parseFloat((eqlPoints.length > 0 ? Math.min(...eqlPoints) : liveTickPrice - 6.2).toFixed(2));

    // Spawn real-time simulated lifecycle position
    setActiveSimPosition({
      id: "live_pos_" + Date.now(),
      direction: direction,
      entryPrice: liveTickPrice,
      currentPrice: liveTickPrice,
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      lots: currentRiskAlloc,
      unrealizedPnl: 0.0,
      status: "Active"
    });

    setActiveLifecycleStage("executed");
    addLog(`[PORTFOLIO DISPATCH] Active positioning engaged in XAUUSD: ${direction} direction @ $${liveTickPrice.toFixed(2)}, sized at ${currentRiskAlloc}% total equity (anti-martingale lot damper active). SL set at structural boundary $${stopLossPrice.toFixed(2)}, TP at target pool $${takeProfitPrice.toFixed(2)}.`, "ai", "EXECUTION");

    if (finalAdaptiveRisk.isAntiMartingaleActive) {
      addLog(`[ANTI-MARTINGALE PROTECTIVE SCALING ACTIVE] Consecutive losses damper calibrated lot size to ${currentRiskAlloc}%`, "safety", "WARN");
    }
  };

  // Reset or manual tick helper
  const handleForceTick = () => {
    if (candles.length === 0) return;
    setTicksSinceLastClose(maxTicksPerCandle - 1); 
    // This will force the next ticker update loop to close the candle instantly
    addLog("Engine 8: Simulated webhook trigger. Accelerating next candle close.", "system");
  };

  // Telemetry updates synchronizer to parent
  useEffect(() => {
    const derivedBias = latestSweep 
      ? (latestSweep.type === "Sell-Side" ? "Bullish" : "Bearish")
      : (structureBreaks.length > 0 && structureBreaks[structureBreaks.length - 1].direction === "Bullish" ? "Bullish" : "Bearish");
      
    const activeSessionStr = selectedTimeframe === "15M" 
      ? "London Open Killzone" 
      : selectedTimeframe === "30M" 
        ? "New York Killzone" 
        : "Asian Consolidation Zone";

    // Blocked if cooldown, system stopped, spread too wide, or trades exceeded
    let status: "AUTHORIZED" | "BLOCKED" | "NO_TRADE" = "AUTHORIZED";
    if (safety.isCooldownActive || safety.isSystemStopActive || safety.tradesThisSession >= 3 || safety.currentSpreadPips > 1.5 || safety.emotionalVolatilityLevel === "Extreme Lockout") {
      status = "BLOCKED";
    } else if (currentConfidenceScore < 60 || marketState === "Ranging" || marketState === "Low Liquidity") {
      status = "NO_TRADE";
    }

    const rec = latestSweep 
      ? `High probability stop hunt sweep detected on ${latestSweep.type}. Wick quality extreme is ${latestSweep.quality}.`
      : `Market state classed as ${marketState}. Sidelined waiting for dynamic extreme purges. Avoid high-drawdown consolidation circles.`;

    onTelemetryUpdate?.({
      marketState,
      livePrice: liveTickPrice,
      confidenceScore: currentConfidenceScore,
      bias: derivedBias as any,
      activeSession: activeSessionStr,
      executionStatus: status,
      reasonSummary: rec,
      spreadPips: safety.currentSpreadPips,
      cooldownSecondsRemaining: safety.cooldownSecondsRemaining,
      tradesThisSession: safety.tradesThisSession
    });
  }, [
    marketState,
    liveTickPrice,
    currentConfidenceScore,
    selectedTimeframe,
    safety,
    latestSweep,
    structureBreaks,
    onTelemetryUpdate
  ]);

  return (
    <div className="bg-[#0b0c13] border-q border border-gray-900 rounded-xl p-5 shadow-2xl relative" id="live-pipeline-panel">
      
      {/* Bloomberg Subheader */}
      <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-sm font-black tracking-widest text-[#e8a32a] font-mono uppercase flex items-center gap-1.5">
            Institutional Terminal Stack 
            <span className="text-[10px] text-gray-500 bg-gray-950 px-1 rounded px-1.5 lowercase font-normal">phase 2</span>
          </h2>
        </div>

        {/* Live clocks & Ticker status */}
        <div className="flex bg-black/40 border border-gray-900 p-1 px-3.5 rounded text-[10px] font-mono gap-4 select-none text-gray-400 items-center">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            London: <span className="text-gray-200 font-bold">OPEN</span>
          </span>
          <span className="h-3 w-[1px] bg-gray-800" />
          <span className="flex items-center gap-1.5 whitespace-nowrap animate-pulse">
            NY Killzone: <span className="text-emerald-400 font-bold">READY</span>
          </span>
          <span className="h-3 w-[1px] bg-gray-800" />
          <button 
            onClick={() => setIsMainPanelCollapsed(!isMainPanelCollapsed)}
            className="text-[9px] font-bold text-[#fbbf24] hover:text-amber-300 transition-all font-mono uppercase bg-[#1a1c29] px-2 py-0.5 rounded cursor-pointer leading-normal flex items-center gap-1 border border-amber-500/10"
          >
            {isMainPanelCollapsed ? "[+] EXPAND PANEL" : "[-] MINIMIZE PANEL"}
          </button>
        </div>
      </div>

      {isMainPanelCollapsed ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 p-4 bg-[#0a0c14]/85 rounded-xl border border-gray-900 mt-2 font-mono text-xs text-gray-300">
          <div className="bg-black/35 p-2.5 rounded border border-gray-950">
            <span className="text-[8px] text-gray-500 block uppercase font-black leading-tight tracking-wider mb-1">XAUUSD Live price</span>
            <span className="text-sm font-extrabold text-[#fbbf24] font-mono tracking-wider">${liveTickPrice.toFixed(2)}</span>
          </div>
          <div className="bg-black/35 p-2.5 rounded border border-gray-950">
            <span className="text-[8px] text-gray-500 block uppercase font-black leading-tight tracking-wider mb-1">Bias Alignment</span>
            <span className={`text-xs font-bold uppercase tracking-wide ${latestSweep?.type === "Sell-Side" ? "text-emerald-450" : latestSweep?.type === "Buy-Side" ? "text-red-400" : "text-gray-400"}`}>
              {latestSweep ? (latestSweep.type === "Sell-Side" ? "▲ STRUCTURAL BUY" : "▼ STRUCTURAL SELL") : "● WAITING ON SWEEP"}
            </span>
          </div>
          <div className="bg-black/35 p-2.5 rounded border border-gray-950">
            <span className="text-[8px] text-gray-500 block uppercase font-black leading-tight tracking-wider mb-1">Statistical Probability</span>
            <span className="text-sm font-extrabold text-[#38bdf8] font-mono">{currentConfidenceScore}% match</span>
          </div>
          <div className="bg-black/35 p-2.5 rounded border border-gray-950">
            <span className="text-[8px] text-gray-500 block uppercase font-black leading-tight tracking-wider mb-1">Risk governance Sizing</span>
            <span className={`text-sm font-extrabold font-mono ${adaptiveRisk.scale === 0 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
              {adaptiveRisk.finalPctStr}
            </span>
          </div>
          <div className="bg-black/35 p-2.5 rounded border border-gray-950">
            <span className="text-[8px] text-gray-500 block uppercase font-black leading-tight tracking-wider mb-1">Psych conformity state</span>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              safety.emotionalVolatilityLevel === "Extreme Lockout"
                ? "text-red-400 animate-pulse"
                : safety.emotionalVolatilityLevel === "Elevated"
                  ? "text-[#fbbf24]"
                  : "text-emerald-400"
            }`}>
              {safety.emotionalVolatilityLevel}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: THE GRAPHICAL LIVE DATA TIMELINE VISUALIZER (Engine 8 / 9 / 10 / 11) */}
        <div className="xl:col-span-8 space-y-4">
          
          <div className="flex items-center justify-between bg-black/30 p-2.5 rounded border border-gray-900">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-450" />
              <span className="text-[11px] font-mono text-gray-300 font-bold uppercase">
                XAUUSD Live Structure Stream ({selectedTimeframe})
              </span>
            </div>

            {/* Ingestion controllers */}
            <div className="flex items-center gap-1.5">
              {(["15M", "30M", "1H"] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    selectedTimeframe === tf 
                      ? "bg-[#fbbf24] text-black" 
                      : "text-gray-400 hover:text-white bg-gray-900"
                  }`}
                >
                  {tf}
                </button>
              ))}

              <div className="h-4 w-[1px] bg-gray-800 mx-1" />

              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono hidden sm:inline">Phase:</span>
              <select
                value={sessionTransition}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setSessionTransition(val);
                  let msg = "";
                  if (val === "standard_fluid") {
                    msg = "Transition System: Resetting parameters to standard fluid-state conditions.";
                  } else if (val === "london_decay") {
                    msg = "Transition Indicator: London Close volume decay modeled. Sizing reduced.";
                  } else if (val === "ny_volatility") {
                    msg = "Transition Indicator: NY Open liquidity spike active. Spread expanded.";
                  } else if (val === "asia_compression") {
                    msg = "Transition Indicator: Asia consolidation compression active.";
                  } else if (val === "news_instability") {
                    msg = "Transition Alert: High-tier macro news release instability flagged.";
                  }
                  addLog(msg, "safety", "WARN");
                }}
                className="bg-[#12141f] border border-gray-800 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-gray-300 outline-none hover:border-gray-750 cursor-pointer"
                title="Select current session transition phase to adapt execution governance"
              >
                <option value="standard_fluid">Standard Open</option>
                <option value="london_decay">London Close Decay (-15% Conf)</option>
                <option value="ny_volatility">NY Volatility Spike</option>
                <option value="asia_compression">Asia Compression (Risk 0.0%)</option>
                <option value="news_instability">News Instability (Spread Lock)</option>
              </select>

              <div className="h-4 w-[1px] bg-gray-800 mx-1" />

              <button
                onClick={() => setIsFeedStreaming(!isFeedStreaming)}
                className={`p-1 px-2.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 ${
                  isFeedStreaming ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-gray-800 text-gray-400"
                }`}
                title={isFeedStreaming ? "Pause live streaming feed" : "Resume live streaming feed"}
              >
                {isFeedStreaming ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                {isFeedStreaming ? "Streaming" : "Paused"}
              </button>

              <button
                onClick={handleForceTick}
                className="p-1 px-2 bg-indigo-900/40 border border-indigo-800/50 hover:border-indigo-600 rounded text-indigo-400 text-[9px] font-mono font-bold flex items-center gap-1"
                title="Force close current candle"
              >
                <Zap className="w-2.5 h-2.5 text-indigo-400" />
                Tick close
              </button>
            </div>
          </div>

          {/* Graphical canvas block representing live candlesticks */}
          <div className={`bg-black/70 border rounded-xl p-3 relative h-[260px] select-none overflow-hidden transition-all duration-500 ${stateColorTheme.border}`}>
            
            {/* Legend indicator layer */}
            <div className="absolute top-2.5 left-3 font-mono text-[8.5px] text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5 text-left max-w-[70%] z-10">
              <div>Ticker: <span className="text-white font-bold">$ {liveTickPrice.toFixed(2)}</span></div>
              <div>State: <span className={`font-bold uppercase ${stateColorTheme.text}`}>{marketState}</span></div>
              <div>Candle Close Progress: <span className="text-sky-400 font-bold">{ticksSinceLastClose} / {maxTicksPerCandle} ticks</span></div>
              <div className="flex items-center gap-1 bg-black/40 px-1 border border-zinc-900 rounded">
                <span className="text-zinc-500">COMPRESSION:</span>
                <span className={`font-black ${compressionTelemetry.color}`}>{compressionTelemetry.status}</span>
                <span className="text-zinc-500 text-[6.5px]">({compressionTelemetry.prob})</span>
              </div>
            </div>

            <div className="absolute top-2.5 right-3 font-mono text-[9px] text-gray-500 text-right z-10">
              <div>Slippage Protection: OK</div>
              <div>Sweep Type: <span className="text-red-400 font-bold">{latestSweep ? `${latestSweep.type} (${latestSweep.quality})` : "None"}</span></div>
            </div>

            {/* Live Chart Rendering container */}
            <div className="w-full h-full pt-8 pb-3">
              {candles.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-600 text-xs font-mono">
                  Loading telemetry feed...
                </div>
              ) : (
                <svg viewBox="0 0 700 210" className="w-full h-full overflow-visible">
                  {/* Linear gradients definitions */}
                  <defs>
                    <linearGradient id="eqlGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="eqhGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Liquidity Heatmap Overlay (Soft background layers) */}
                  {eqlPoints.map((eql, idx) => {
                    const y = 210 - (eql - 2300) * 4;
                    return (
                      <g key={`eql-${idx}`} className="opacity-70">
                        <rect x={35} y={y - 6} width={630} height={12} fill="url(#eqlGlow)" />
                        <line x1={35} y1={y} x2={665} y2={y} stroke="#10b981" strokeWidth={0.6} strokeDasharray="3 3" />
                        <text x={45} y={y - 2} fill="#10b981" fontSize={6} fontFamily="monospace" fontWeight="bold">
                          EQL HEATPOOL: ${eql.toFixed(1)} [SSL ZONE]
                        </text>
                      </g>
                    );
                  })}

                  {eqhPoints.map((eqh, idx) => {
                    const y = 210 - (eqh - 2300) * 4;
                    return (
                      <g key={`eqh-${idx}`} className="opacity-70">
                        <rect x={35} y={y - 6} width={630} height={12} fill="url(#eqhGlow)" />
                        <line x1={35} y1={y} x2={665} y2={y} stroke="#f43f5e" strokeWidth={0.6} strokeDasharray="3 3" />
                        <text x={45} y={y - 2} fill="#f43f5e" fontSize={6} fontFamily="monospace" fontWeight="bold">
                          EQH HEATPOOL: ${eqh.toFixed(1)} [BSL ZONE]
                        </text>
                      </g>
                    );
                  })}

                  {/* Premium / Discount equilibrium line partitioning coordinates */}
                  {(() => {
                    const pricesArray = candles.flatMap(c => [c.low, c.high]);
                    const maxP = pricesArray.length > 0 ? Math.max(...pricesArray) : 2345;
                    const minP = pricesArray.length > 0 ? Math.min(...pricesArray) : 2305;
                    const avgPrice = (maxP + minP) / 2;
                    const eqY = 210 - (avgPrice - 2300) * 4;
                    return (
                      <g className="opacity-50">
                        <line x1={40} y1={eqY} x2={660} y2={eqY} stroke="#fbbf24" strokeWidth={0.8} strokeDasharray="4 2" />
                        <rect x={40} y={eqY - 7} width={90} height={14} fill="#0b0c13" stroke="#fbbf24" strokeWidth={0.5} rx={2} />
                        <text x={45} y={eqY + 3} fill="#fbbf24" fontSize={6.5} fontFamily="monospace" fontWeight="black">
                          50% EQ: ${avgPrice.toFixed(1)}
                        </text>
                        <text x={655} y={eqY - 6} fill="#ff4d4d" fontSize={7} fontFamily="monospace" fontWeight="bold" textAnchor="end">
                          PREMIUM (SELL LIMITS)
                        </text>
                        <text x={655} y={eqY + 11} fill="#00e676" fontSize={7} fontFamily="monospace" fontWeight="bold" textAnchor="end">
                          DISCOUNT (BUY MITIGATION)
                        </text>
                      </g>
                    );
                  })()}

                  {/* Grid lines */}
                  {[2305, 2315, 2325, 2335, 2345].map((level, idx) => (
                    <g key={idx} className="opacity-15">
                      <line x1={0} y1={210 - (level - 2300) * 4} x2={700} y2={210 - (level - 2300) * 4} stroke="#4b5563" strokeWidth={0.8} strokeDasharray="3 3" />
                      <text x={695} y={190 - (level - 2300) * 4} fill="#6b7280" fontSize={8} fontFamily="monospace" textAnchor="end">${level}</text>
                    </g>
                  ))}

                  {/* Render Swings High/Low Indicators (Engine 9) */}
                  {swingPoints.map((sw, idx) => {
                    const xCoord = 40 + sw.index * 50;
                    const yCoord = 210 - (sw.price - 2300) * 4;
                    const color = sw.type === "High" ? "#ff4d4d" : "#00e676";
                    return (
                      <g key={idx}>
                        <circle cx={xCoord} cy={yCoord} r={3.5} fill={color} />
                        <line x1={xCoord} y1={yCoord} x2={xCoord + 15} y2={sw.type === "High" ? yCoord - 12 : yCoord + 12} stroke={color} strokeWidth={0.8} />
                        <text 
                          x={xCoord + 18} 
                          y={sw.type === "High" ? yCoord - 12 : yCoord + 16} 
                          fill={color} 
                          fontSize={7} 
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          SWING {sw.type.toUpperCase()} ({sw.strength === "high quality" ? "HQ" : "LQ"})
                        </text>
                      </g>
                    );
                  })}

                  {/* Render Structure Breaks (Engine 9/11) */}
                  {structureBreaks.map((sb, idx) => {
                    const xCoord = 40 + sb.candleIndex * 50;
                    const yCoord = 210 - (sb.price - 2300) * 4;
                    return (
                      <g key={idx} className="opacity-75">
                        <line x1={xCoord - 20} y1={yCoord} x2={xCoord + 25} y2={yCoord} stroke="#38bdf8" strokeWidth={1} strokeDasharray="2 2" />
                        <text x={xCoord} y={sb.direction === "Bullish" ? yCoord - 5 : yCoord + 10} fill="#38bdf8" fontSize={7} fontFamily="monospace" fontWeight="bold">
                          {sb.type} {sb.direction === "Bullish" ? "▲" : "▼"}
                        </text>
                      </g>
                    );
                  })}

                  {/* Candlesticks loop */}
                  {candles.map((candle, idx) => {
                    const x = 40 + idx * 50;
                    const isGreen = candle.close >= candle.open;
                    
                    const minP = 2300;
                    const scaleY = (p: number) => 210 - (p - minP) * 4;

                    const yHigh = scaleY(candle.high);
                    const yLow = scaleY(candle.low);
                    const yOpen = scaleY(candle.open);
                    const yClose = scaleY(candle.close);
                    
                    const bodyY = isGreen ? yClose : yOpen;
                    const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
                    const color = isGreen ? "#00c853" : "#d50000";

                    // Quantitative Indicators Derived per Candle
                    const isLast = idx === candles.length - 1;
                    const matchingBreak = structureBreaks.find(b => b.candleIndex === idx);
                    const isDisplacement = idx >= 1 && Math.abs(candle.close - candle.open) > 3.8;
                    const hasFVGCreated = idx >= 1 && idx < candles.length - 1 && (
                      (candles[idx - 1].high < candles[idx + 1].low) || 
                      (candles[idx - 1].low > candles[idx + 1].high)
                    );

                    const isBSLSweep = isLast && latestSweep && latestSweep.type === "Buy-Side";
                    const isSSLSweep = isLast && latestSweep && latestSweep.type === "Sell-Side";

                    return (
                      <g key={idx}>
                        {/* Wicks */}
                        <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth={1} />
                        {/* Rect Body */}
                        <rect 
                          x={x - 6} 
                          y={bodyY} 
                          width={12} 
                          height={bodyHeight} 
                          fill={color} 
                          stroke={color} 
                          strokeWidth={0.5} 
                          rx={1.2}
                          className="transition-all hover:brightness-125 cursor-pointer"
                        />

                        {/* Automatic Label Overlays (SMC Theory) */}
                        {matchingBreak && (
                          <g>
                            <line x1={x} y1={matchingBreak.direction === "Bullish" ? yHigh - 12 : yLow + 12} x2={x} y2={matchingBreak.direction === "Bullish" ? yHigh - 4 : yLow + 4} stroke="#fbbf24" strokeWidth={1} />
                            <text x={x} y={matchingBreak.direction === "Bullish" ? yHigh - 15 : yLow + 20} fill="#fbbf24" fontSize={8} fontFamily="monospace" fontWeight="black" textAnchor="middle">
                              {matchingBreak.type}
                            </text>
                          </g>
                        )}

                        {isDisplacement && (
                          <text x={x} y={bodyY + bodyHeight / 2 + 3} fill="#0d0e15" fontSize={6} fontFamily="monospace" fontWeight="black" textAnchor="middle">
                            DISP
                          </text>
                        )}

                        {hasFVGCreated && (
                          <g>
                            <rect x={x - 18} y={Math.min(yOpen, yClose) - 9} width={36} height={6} fill="#8b5cf6" fillOpacity={0.25} rx={0.8} />
                            <text x={x} y={Math.min(yOpen, yClose) - 4} fill="#a78bfa" fontSize={6} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                              FVG
                            </text>
                          </g>
                        )}

                        {isBSLSweep && (
                          <g className="animate-bounce">
                            <text x={x} y={yHigh - 14} fill="#f43f5e" fontSize={7} fontFamily="monospace" fontWeight="extrabold" textAnchor="middle">
                              BSL sweeps ⚡
                            </text>
                          </g>
                        )}

                        {isSSLSweep && (
                          <g className="animate-bounce">
                            <text x={x} y={yLow + 16} fill="#10b981" fontSize={7} fontFamily="monospace" fontWeight="extrabold" textAnchor="middle">
                              SSL sweeps ⚡
                            </text>
                          </g>
                        )}

                        {/* Timestamp helper */}
                        <text x={x} y={205} fill="#4b5563" fontSize={7} fontFamily="monospace" textAnchor="middle">
                          {candle.timestamp}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Sweep detected ticker layout */}
            {latestSweep && (
              <div className="absolute bottom-5 left-3 bg-[#e43] text-black font-mono font-bold text-[9px] p-1 px-2.5 rounded animate-pulse flex items-center gap-1 shadow-lg">
                <AlertTriangle className="w-3 h-3" />
                ALERT: {latestSweep.type} SWEEP IN PROCESS @ ${latestSweep.price.toFixed(2)}
              </div>
            )}
          </div>

          {/* INSTITUTIONAL BENTO SCANNING MATRIX (Objective 1, 3, 5) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Card 1: Multi-Timeframe Alignment Matrix */}
            <div className="bg-[#0e1017] border border-gray-905 border-zinc-900 rounded-xl p-3.5 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-gray-950 pb-1.5">
                <span className="text-[10px] font-black text-gray-300 uppercase flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  Mtf Alignment Matrix
                </span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none ${
                    mtfAlignment.alignmentStatus === "FULLY ALIGNED"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : mtfAlignment.alignmentStatus === "PARTIAL ALIGNMENT"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                  {mtfAlignment.alignmentStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                <div className="bg-black/40 p-1.5 rounded border border-gray-950">
                  <span className="text-[8px] text-gray-550 block">4H BIAS</span>
                  <span className={`font-bold block flex items-center gap-1 ${mtfAlignment.h4.color}`}>
                    <span className="text-[10px]">{mtfAlignment.h4.icon}</span> {mtfAlignment.h4.val}
                  </span>
                </div>
                <div className="bg-black/40 p-1.5 rounded border border-gray-950">
                  <span className="text-[8px] text-gray-550 block">1H STRUCTURE</span>
                  <span className={`font-bold block flex items-center gap-1 ${mtfAlignment.h1.color}`}>
                    <span className="text-[9px]">{mtfAlignment.h1.icon}</span> {mtfAlignment.h1.val}
                  </span>
                </div>
                <div className="bg-black/40 p-1.5 rounded border border-gray-950">
                  <span className="text-[8px] text-gray-550 block">30M CONFIRM</span>
                  <span className={`font-bold block flex items-center gap-1 ${mtfAlignment.m30.color}`}>
                    <span className="text-[9px]">{mtfAlignment.m30.icon}</span> {mtfAlignment.m30.val}
                  </span>
                </div>
                <div className="bg-black/40 p-1.5 rounded border border-gray-950">
                  <span className="text-[8px] text-gray-550 block">15M ENTRY</span>
                  <span className={`font-bold block flex items-center gap-1 ${mtfAlignment.m15.color}`}>
                    <span className="text-[9px]">{mtfAlignment.m15.icon}</span> {mtfAlignment.m15.val}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Environment Classification Engine */}
            <div className="bg-[#0e1017] border border-gray-905 border-zinc-900 rounded-xl p-3.5 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-gray-950 pb-1.5">
                <span className="text-[10px] font-black text-gray-300 uppercase flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  AI Environment Classifier
                </span>
                <span className="text-[8px] text-purple-400 font-extrabold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                  DOMINANT: {environmentClassifier.dominant.conf}%
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 font-bold block">Dominant State:</span>
                  <span className={`font-black uppercase tracking-wider ${environmentClassifier.dominant.color}`}>
                    {environmentClassifier.dominant.label}
                  </span>
                </div>
                {/* Visual confidence bars for secondary states */}
                <div className="space-y-1 pt-0.5">
                  {environmentClassifier.states.slice(1, 4).map((st) => (
                    <div key={st.label} className="space-y-0.5 text-[8.5px]">
                      <div className="flex justify-between text-[8px] text-gray-500 leading-none">
                        <span>{st.label}</span>
                        <span>{st.conf}%</span>
                      </div>
                      <div className="w-full h-1 bg-black/45 rounded-full overflow-hidden border border-gray-950">
                        <div 
                          className="h-full bg-purple-500/60 rounded-full" 
                          style={{ width: `${st.conf}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3: Precision Timing & Volatility Compression */}
            <div className="bg-[#0e1017] border border-gray-905 border-zinc-900 rounded-xl p-3.5 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-gray-950 pb-1.5">
                <span className="text-[10px] font-black text-gray-300 uppercase flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Volatility & Timing
                </span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none ${
                  precisionTiming.rating === "Sniper"
                    ? "bg-emerald-500 text-black animate-pulse font-extrabold"
                    : precisionTiming.rating === "Strong"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : precisionTiming.rating === "Moderate"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {precisionTiming.rating.toUpperCase()}
                </span>
              </div>
              <div className="space-y-1.5 text-[9px]">
                <div className="flex items-center justify-between p-1 bg-black/35 rounded border border-gray-950 font-bold text-[8.5px]">
                  <span className="text-gray-500">Compression State:</span>
                  <span className={`font-extrabold ${compressionTelemetry.color}`}>
                    {compressionTelemetry.status}
                  </span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-gray-500">Candle Body Strength:</span>
                  <span className="text-white font-bold">{precisionTiming.bodyStr}%</span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-gray-500">Wick Rej Ratio:</span>
                  <span className="text-white font-bold">{precisionTiming.wickPct}% ({precisionTiming.wickRej})</span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-gray-500">Mitigation Speed:</span>
                  <span className="text-sky-400 font-extrabold">{precisionTiming.reactionSpeed}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Telemetry Log panel output (Real-time live debugger) */}
          <div className="bg-[#05060a] border border-gray-900 rounded-lg p-3 h-[110px] flex flex-col justify-between">
            <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block mb-1 flex items-center gap-1">
              <Compass className="w-3 h-3 text-indigo-400 rotate-45" /> Live Multi-Engine Telemetry Logs
            </span>
            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none max-h-[70px] pr-1">
              {panelLogs.map((log, idx) => {
                const sevColors = {
                  INFO: "text-zinc-650 text-[8px] border border-zinc-800 bg-zinc-950 px-1 rounded flex items-center justify-center font-bold tracking-tight py-[0.5px]",
                  WARN: "text-amber-500 text-[8px] font-extrabold border border-amber-950 bg-amber-950/20 px-1 rounded flex items-center justify-center tracking-tight py-[0.5px]",
                  CRITICAL: "text-rose-500 text-[8px] font-black border border-rose-950 bg-rose-950/40 px-1 rounded flex items-center justify-center animate-pulse tracking-tight py-[0.5px]",
                  EXECUTION: "text-emerald-450 text-[8px] font-black border border-emerald-950 bg-emerald-950/20 px-1 rounded flex items-center justify-center tracking-tight py-[0.5px]"
                };
                return (
                  <div key={idx} className="font-mono text-[9.5px] py-[1.5px] border-b border-zinc-900/10 last:border-0 flex items-center gap-2 leading-tight tracking-tight hover:bg-zinc-900/10 transition-all rounded">
                    <span className="text-zinc-650 select-none text-[8.5px]">[{log.time}]</span>
                    <span className="text-indigo-400 font-bold select-none text-[9px]">{log.engine}</span>
                    <span className={sevColors[log.severity]}>{log.severity}</span>
                    <span className="text-zinc-300 font-medium select-none text-[9.5px]">{log.msg}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PHASE 12: ADAPTIVE SELF-CALIBRATION & PERFORMANCE STABILIZATION SUITE */}
          <div className="bg-[#11131c] border border-gray-900 rounded-xl p-4 space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-950 pb-2">
              <span className="text-xs font-bold font-mono tracking-wider text-gray-200 uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
                Adaptive Self-Calibration Engine
              </span>
              <span className="text-[8px] font-mono bg-purple-950/45 px-2 py-0.5 rounded border border-purple-900/40 text-purple-300">
                Calibrated Status: ONLINE
              </span>
            </div>

            {/* Main calibrator workspace */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box A: Confidence offset & tuning tools */}
              <div className="space-y-3 bg-black/40 p-3 rounded-xl border border-zinc-900 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Calibration Offset</span>
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded ${
                    adaptiveConfidenceOffset >= 0 
                      ? "bg-emerald-500/15 text-emerald-400" 
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {adaptiveConfidenceOffset >= 0 ? "+" : ""}{adaptiveConfidenceOffset}% Base Boost
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-zinc-500 leading-none">
                    <span>-25% Peak Drawdown Hard Penalty</span>
                    <span>+15% Peak Streak Limit</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full border border-zinc-900 relative">
                    <div 
                      className={`h-full absolute top-0 rounded-full transition-all duration-300 ${
                        adaptiveConfidenceOffset >= 0 ? "bg-emerald-500" : "bg-red-500"
                      }`}
                      style={{ 
                        left: "50%", 
                        width: `${Math.abs((adaptiveConfidenceOffset / 25) * 50)}%`,
                        transform: adaptiveConfidenceOffset < 0 ? "translateX(-100%)" : "none"
                      }}
                    />
                  </div>
                </div>

                {/* Simulated trigger controllers to test adaptation */}
                <div className="pt-2 border-t border-zinc-900 space-y-1.5">
                  <span className="text-[8.5px] text-zinc-400 block font-bold">RECALIBRATE FEEDBACK TUNING LOOP (SIMULATOR)</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                    <button 
                      type="button"
                      onClick={() => {
                        setAdaptiveConfidenceOffset(prev => Math.min(15, prev + 5));
                        setDrawdownScaleBack(prev => Math.min(1.0, prev + 0.15));
                        addLog("[INTELLIGENCE USER TUNING] Validated profitable sequence simulated. Boosting core calibration metrics +5%.", "ai", "INFO");
                      }}
                      className="py-1 px-1.5 bg-emerald-950/25 hover:bg-emerald-900/40 text-emerald-400 rounded border border-emerald-900/30 font-bold transition-all text-center leading-none"
                    >
                      📈 Win Streak
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setAdaptiveConfidenceOffset(prev => Math.max(-25, prev - 10));
                        setDrawdownScaleBack(prev => Math.max(0.25, prev - 0.35));
                        addLog("[INTELLIGENCE USER TUNING] Unstable drawdown/losses simulated. Scaling allocations down -10%.", "safety", "WARN");
                      }}
                      className="py-1 px-1.5 bg-red-950/25 hover:bg-red-900/40 text-red-400 rounded border border-red-900/30 font-bold transition-all text-center leading-none"
                    >
                      📉 Loss Sequence
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setAdaptiveConfidenceOffset(5);
                      setDrawdownScaleBack(1.0);
                      addLog("[INTELLIGENCE USER TUNING] Reset calibration offsets to standard default boundaries.", "system", "INFO");
                    }}
                    className="w-full py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-850 rounded text-[9.5px] transition-all text-center"
                  >
                    Reset Offsets
                  </button>
                </div>
              </div>

              {/* Box B: Continuously Tracked Performance Metrics */}
              <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-zinc-900 font-mono text-[9px]">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Performance Analytics Core (Objective 7)</span>
                
                {(() => {
                  const totalCount = historicalPatternMemory.length;
                  const winCount = historicalPatternMemory.filter(h => h.outcomeResult === "Win").length;
                  const winRate = totalCount > 0 ? Math.round((winCount / totalCount) * 100) : 50;
                  const avgRR = 3.8;
                  const netReturn = parseFloat((historicalPatternMemory.reduce((sum, h) => sum + (h.outcomeResult === "Win" ? 3.8 : -1.0), 0) * 1.0).toFixed(1));
                  const setupEfficiency = Math.round((winRate * avgRR) / 4.5);

                  // Compute stability indicators for Phase 14 Dashboard
                  const environmentStability = Math.max(15, 100 - volatilityInstabilityScore);
                  const spreadStabilityLabel = safety.currentSpreadPips <= 1.1 ? "Optimal" : (safety.currentSpreadPips <= 1.4 ? "Normal" : "Slippage Danger");
                  const spreadStabilityColor = safety.currentSpreadPips <= 1.1 ? "text-emerald-400" : (safety.currentSpreadPips <= 1.4 ? "text-amber-400" : "text-red-400 animate-pulse");

                  return (
                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                        <span className="text-zinc-500">Session Winrate:</span>
                        <span className={`font-bold ${winRate >= 50 ? "text-emerald-400" : "text-amber-400"}`}>{winRate}%</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                        <span className="text-zinc-500">Live RR Averages:</span>
                        <span className="text-white font-bold">{avgRR.toFixed(1)} R (Realistic)</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                        <span className="text-zinc-500">Execution Quality %:</span>
                        <span className="text-purple-400 font-black">{precisionExecutionIntel.precisionEntryScore}% Score</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                        <span className="text-zinc-500">Environment Stability:</span>
                        <span className={`font-bold ${environmentStability > 60 ? "text-emerald-400" : "text-amber-450 text-amber-500"}`}>{environmentStability}%</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                        <span className="text-zinc-500">Spread Instability:</span>
                        <span className={`font-bold ${spreadStabilityColor}`}>{safety.currentSpreadPips.toFixed(1)} pips ({spreadStabilityLabel})</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                        <span className="text-zinc-500">Volatility Threat:</span>
                        <span className={`font-bold ${volatilityInstabilityScore < 40 ? "text-emerald-400" : (volatilityInstabilityScore < 70 ? "text-amber-400" : "text-red-400 font-black animate-pulse")}`}>{volatilityInstabilityScore}% Score</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                        <span className="text-zinc-500">Adaptive Confidence State:</span>
                        <span className="text-sky-400 font-bold">{currentConfidenceScore}% (Offset: {adaptiveConfidenceOffset >= 0 ? "+" : ""}{adaptiveConfidenceOffset}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Recovery Phase State:</span>
                        <span className="text-purple-300 font-black">{precisionExecutionIntel.recoveryStage}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Bottom Row inside card: Session adaptivity & Survival priorities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5 border-t border-gray-950">
              
              {/* Box C: Session Intelligence Ranker (Objective 4) */}
              <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-zinc-900 font-mono text-[9.5px]">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Session Intelligence Ranks</span>
                <div className="space-y-1 text-[8.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-200">🥇 London setups (Killzone)</span>
                    <span className="text-emerald-400 font-bold">74% Target High</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">🥈 NY continuation setups</span>
                    <span className="text-sky-450 text-sky-450">61% Core Standard</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">🥉 Asia compression setups</span>
                    <span className="text-amber-555 text-amber-500">34% Low Avoidance</span>
                  </div>
                </div>
                <p className="text-[7.5px] text-zinc-500 italic leading-snug">
                  *Statistical rule: Asian ranges act as accumulation pools. Avoid direct setups inside Asian compressions.
                </p>
              </div>

              {/* Box D: Survival Priority Logic Space (Objective 6) */}
              {(() => {
                const survivalIndex = Math.max(30, Math.min(100, 100 - Math.round(safety.dailyDrawdown * 15 + safety.consecutiveLossCount * 20 + spreadDangerIndex * 0.1)));
                return (
                  <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-zinc-900 font-mono">
                    <div className="flex justify-between items-center text-[9.5px]">
                      <span className="text-gray-400 uppercase font-bold">Survival Safety Index (SPI)</span>
                      <span className={`font-black ${survivalIndex > 75 ? "text-emerald-400" : "text-red-400 animate-pulse"}`}>
                        {survivalIndex}% SPI
                      </span>
                    </div>

                    <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          survivalIndex > 75 ? "bg-emerald-500" : "bg-red-500"
                        }`}
                        style={{ width: `${survivalIndex}%` }}
                      />
                    </div>

                    <div className="text-[8px] space-y-0.5 text-zinc-400 leading-tight">
                      <div>🛡️ <span className="font-bold uppercase text-zinc-300">Capital First:</span> Lot sizes reduced dynamically.</div>
                      <div>📉 <span className="font-bold uppercase text-zinc-300">Hard stop:</span> System hard-freezes at consecutive loss index limits.</div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* PHASE 13 ADDITIONS: RECURSIVE TRADE REVIEW & AUTONOMOUS MODIFIER GAUGES */}
            <div className="pt-3 border-t border-gray-950 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box E: Continuous Learning Weights Panel (Objective 1, 2, 7) */}
              <div className="bg-black/30 p-3 rounded-xl border border-zinc-900/40 font-mono space-y-2">
                <span className="text-[10px] text-zinc-300 uppercase font-black tracking-wider flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
                  Continuous Learning Weights Panel
                </span>
                <p className="text-[8px] text-zinc-500 leading-tight">
                  Running execution modifiers recalibrated recursively via setup win/loss efficiency parameters:
                </p>

                <div className="space-y-1.5 pt-1 text-[9px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-450">Sweep Quality Modifier:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[8.5px] ${stateColorTheme.text} bg-zinc-900 border border-zinc-800`}>
                      {sweepWeightModifier >= 0 ? "+" : ""}{sweepWeightModifier} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-450">Structure Shift (BOS/CHoCH):</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[8.5px] text-sky-400 bg-zinc-900 border border-zinc-800`}>
                      {structureWeightModifier >= 0 ? "+" : ""}{structureWeightModifier} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-450">Active Killzone Timings:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[8.5px] text-amber-400 bg-zinc-900 border border-zinc-800`}>
                      {sessionWeightModifier >= 0 ? "+" : ""}{sessionWeightModifier} pts
                    </span>
                  </div>
                </div>

                <div className="pt-1 bg-zinc-950/40 rounded p-1.5 border border-zinc-900 text-[8px] text-zinc-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Aggression downgraded {drawdownScaleBack < 1.0 ? "automatically (active drawdown offset)" : "0% (neutral range boundaries)"}.</span>
                </div>
              </div>

              {/* Box F: Recursive Trade Review Intelligence (Objective 3) */}
              <div className="bg-black/30 p-3 rounded-xl border border-zinc-900/40 font-mono space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-300 uppercase font-black tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                    Recursive Trade Scorer (Objective 3)
                  </span>
                  {lastCompletedTradeVerdict && (
                    <span className={`text-[8px] px-1 py-0.2 rounded font-black leading-none uppercase ${
                      lastCompletedTradeVerdict.status === "Win" 
                        ? "bg-emerald-500/15 text-emerald-400" 
                        : "bg-red-500/15 text-red-400"
                    }`}>
                      {lastCompletedTradeVerdict.status} REPORT
                    </span>
                  )}
                </div>

                {lastCompletedTradeVerdict ? (
                  <div className="space-y-1.5">
                    <div className="text-[8px] text-zinc-300 font-bold border-b border-zinc-900/80 pb-1">
                      Setup Classification: <span className="text-zinc-50">{lastCompletedTradeVerdict.setupType}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[8.5px]">
                      <div className="bg-zinc-950/50 p-1 rounded border border-zinc-905">
                        <span className="text-zinc-500 block text-[7px] uppercase">Execution Quality</span>
                        <span className="font-extrabold text-white text-[9px]">{lastCompletedTradeVerdict.executionQualityScore}% Quality</span>
                      </div>
                      <div className="bg-zinc-950/50 p-1 rounded border border-zinc-905">
                        <span className="text-zinc-500 block text-[7px] uppercase">Alignment Index</span>
                        <span className="font-extrabold text-sky-400 text-[9px]">{lastCompletedTradeVerdict.structuralAlignmentScore}% Match</span>
                      </div>
                    </div>

                    <div className="text-[8px] text-zinc-400 bg-black/60 p-1.5 rounded leading-normal border border-zinc-900 italic">
                      &quot;{lastCompletedTradeVerdict.verdict}&quot;
                    </div>

                    <div className="flex justify-between text-[7px] text-zinc-500 uppercase leading-none pt-0.5">
                      <span>Mitigation: {lastCompletedTradeVerdict.mitigationQualityReview}</span>
                      <span>Spread: {lastCompletedTradeVerdict.spreadEfficiencyReview}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[100px] flex items-center justify-center border border-dashed border-zinc-800 rounded bg-zinc-950/10 text-zinc-600 text-[9px] italic">
                    No simulations closed. Secure a direct position above to generate detailed recursive audit telemetry.
                  </div>
                )}
              </div>

            </div>

            {/* ========================================================================= */}
            {/* PHASE 14: INSTITUTIONAL PRECISION EXECUTION & MARKET PRESSURE DASHBOARD */}
            {/* ========================================================================= */}
            <div className="pt-3 border-t border-gray-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-300 uppercase font-black tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  PHASE 14: Execution Precision & Market Pressure (Obj 1, 3, 4)
                </span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black ${precisionExecutionIntel.badgeColor}`}>
                  {precisionExecutionIntel.executionRanking.toUpperCase()}
                </span>
              </div>

              {/* 1. Real-Time Market Pressure Analyzer Indicators (Objective 1) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/45 p-3 rounded-xl border border-zinc-900 font-mono text-[9px]">
                
                {/* Visualizer Row: Bullish vs Bearish Progress Bars */}
                <div className="md:col-span-3 space-y-1.5 pb-2 border-b border-zinc-900">
                  <div className="flex justify-between items-center text-[8.5px]">
                    <span className="text-zinc-400 font-bold uppercase flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" /> Live Execution Pressure Model
                    </span>
                    <span className="text-zinc-300 text-[9px] font-black">
                      Score: <span className="text-emerald-400 text-xs font-black">{precisionExecutionIntel.liveExecutionPressure}</span>/100
                    </span>
                  </div>
                  
                  {/* Real-time pressure gauge */}
                  <div className="w-full h-3 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-900 flex relative">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${precisionExecutionIntel.bullishPressure}%` }}
                    />
                    <div 
                      className="h-full bg-gradient-to-l from-red-500 to-red-400 transition-all duration-300"
                      style={{ width: `${precisionExecutionIntel.bearishPressure}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-2 text-[7px] text-white font-black drop-shadow pointer-events-none leading-none h-full">
                      <span>BULLISH: {precisionExecutionIntel.bullishPressure}%</span>
                      <span>BEARISH: {precisionExecutionIntel.bearishPressure}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[7.5px] text-zinc-500 uppercase leading-none">
                    <span>Imbalance: <strong className={precisionExecutionIntel.liquidityImbalance >= 0 ? "text-emerald-400 text-[8px]" : "text-red-400 text-[8px]"}>{precisionExecutionIntel.liquidityImbalance}% {precisionExecutionIntel.liquidityImbalance >= 0 ? "Buy Side Excess" : "Sell Side Excess"}</strong></span>
                    <span>Bias State: <strong className="text-purple-400 text-[8px]">{precisionExecutionIntel.biasLabel}</strong></span>
                  </div>
                </div>

                {/* Left Column Metric Box A: Force / Dominance Vectors */}
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-500 uppercase font-black block">Orderflow Force</span>
                  <div className="space-y-1 text-[8.5px]">
                    <div className="flex justify-between leading-none">
                      <span className="text-zinc-400 text-[7.5px]">Body Dominance:</span>
                      <span className="text-white font-bold">{precisionExecutionIntel.candleBodyDominance}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${precisionExecutionIntel.candleBodyDominance}%` }} />
                    </div>
                    <div className="flex justify-between leading-none">
                      <span className="text-zinc-400 text-[7.5px]">Wick Rejection:</span>
                      <span className="text-white font-bold">{precisionExecutionIntel.wickRejectionStrength}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-orange-400 transition-all duration-300" style={{ width: `${precisionExecutionIntel.wickRejectionStrength}%` }} />
                    </div>
                  </div>
                </div>

                {/* Middle Column Metric Box B: Aggression & Exhaustion */}
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-500 uppercase font-black block">Velocity Vectors</span>
                  <div className="space-y-1 text-[8.5px]">
                    <div className="flex justify-between leading-none">
                      <span className="text-zinc-400 text-[7.5px]">Displacement Aggr:</span>
                      <span className="text-white font-bold">{precisionExecutionIntel.displacementAggression}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-purple-400 transition-all duration-300" style={{ width: `${precisionExecutionIntel.displacementAggression}%` }} />
                    </div>
                    <div className="flex justify-between leading-none">
                      <span className="text-zinc-400 text-[7.5px]">Momentum Exhaustion:</span>
                      <span className="text-white font-bold">{precisionExecutionIntel.momentumExhaustion}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-sky-450 bg-sky-400 transition-all duration-300" style={{ width: `${precisionExecutionIntel.momentumExhaustion}%` }} />
                    </div>
                  </div>
                </div>

                {/* Right Column Metric Box C: Adaptive Growth Consistency (Objective 8) */}
                <div className="bg-zinc-950/40 p-1.5 rounded-lg border border-zinc-900 space-y-1 select-none">
                  <span className="text-[7px] text-zinc-400 uppercase font-bold block leading-none">Statistical Growth Logic</span>
                  <p className="text-[7.5px] text-zinc-500 leading-tight">
                    Long-term capital preservation over aggressive execution. Zero over-frequency toll.
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[7.5px]">
                    <div className="bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900 text-center">
                      <span className="text-zinc-500 block uppercase text-[6.5px]">Drawdown cap:</span>
                      <span className="text-emerald-400 font-bold">2.0%</span>
                    </div>
                    <div className="bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900 text-center">
                      <span className="text-zinc-500 block uppercase text-[6.5px]">Confidence rule:</span>
                      <span className="text-sky-400 font-bold">Risk Sized</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. Smart Trade Timing Engine & Liquidity Trap Warning Systems (Objective 2 & 6) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                
                {/* Timing Engine status box */}
                <div className="space-y-1.5 p-3 bg-black/45 rounded-xl border border-zinc-900 font-mono text-[9px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-300 uppercase font-black flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      Smart Trade Timing Engine
                    </span>
                    <span className={`text-[7.5px] px-1.5 py-0.2 rounded font-black ${
                      precisionExecutionIntel.smartTimingStatus === "EXECUTION_READY" 
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-500"
                    }`}>
                      {precisionExecutionIntel.smartTimingStatus}
                    </span>
                  </div>
                  <p className="text-[8.5px] text-zinc-300 leading-tight min-h-[18px]">
                    {precisionExecutionIntel.smartTimingMessage}
                  </p>
                  <div className="w-full bg-zinc-950 h-1 rounded border border-zinc-900 overflow-hidden relative">
                    <div 
                      className={`h-full rounded transition-all duration-300 ${
                        precisionExecutionIntel.smartTimingStatus === "EXECUTION_READY" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${(ticksSinceLastClose / maxTicksPerCandle) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[7.5px] text-zinc-500 uppercase leading-none">
                    <span>Stabilization: {ticksSinceLastClose}/{maxTicksPerCandle} ticks</span>
                    <span>Timing weight: x{precisionExecutionIntel.smartTimingStatus === "EXECUTION_READY" ? "1.00" : "0.50"}</span>
                  </div>
                </div>

                {/* Liquidity Trap detection list */}
                <div className="space-y-1.5 p-3 bg-black/45 rounded-xl border border-zinc-900 font-mono relative">
                  <span className="text-[9px] text-zinc-300 uppercase font-black flex items-center gap-1 select-none">
                    <Compass className="w-3.5 h-3.5 text-zinc-400" />
                    Liquidity Trap Detection Sensors
                  </span>
                  
                  {precisionExecutionIntel.isTrapDetected ? (
                    <div className="space-y-1 max-h-[48px] overflow-y-auto scrollbar-none">
                      {precisionExecutionIntel.activeTraps.map((trap, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[8px] text-amber-500 bg-amber-950/15 px-2 py-0.5 rounded border border-amber-950/40">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                          <span className="font-bold flex-1 truncate">{trap}</span>
                          <span className="text-[6px] text-amber-600 uppercase font-black shrink-0">Trap active</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[36px] flex items-center justify-center border border-dashed border-zinc-800 rounded bg-zinc-950/10 text-zinc-600 text-[8px] italic pr-2">
                       No liquidity traps triggered on current tick walk.
                    </div>
                  )}

                  <p className="text-[7.5px] text-zinc-500 italic mt-0.5 leading-none">
                    *Avoid premature entries during manipulation expansion spikes.
                  </p>
                </div>

              </div>

              {/* 3. Precision Entry Scorer Checklist and Recovery Metrics (Objective 3 & 5 & 7) */}
              <div className="bg-black/30 p-3 rounded-xl border border-zinc-900 font-mono space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-zinc-300 uppercase font-black flex items-center gap-1 select-none">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    Precision Entry Scorer Matrix & Adaptive Recovery (Obj 3, 5, 7)
                  </span>
                  <span className="text-[9px] font-black">
                    Accuracy Score: <span className="text-purple-400 font-black text-xs">{precisionExecutionIntel.precisionEntryScore}%</span>
                  </span>
                </div>

                {/* Sub-bar showing offsets list visually */}
                <div className="flex flex-wrap gap-1.5 text-[8px] pt-0.5">
                  {precisionExecutionIntel.scoreOffsets.map((offset, idx) => (
                    <div key={idx} className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900 flex items-center gap-1 text-[7.5px] leading-none">
                      <span className="text-zinc-500">{offset.label}:</span>
                      <span className={offset.offset >= 0 ? "text-emerald-400 font-bold" : "text-rose-450 text-rose-450 text-rose-400 font-bold"}>
                        {offset.offset >= 0 ? "+" : ""}{offset.offset} ({offset.value})
                      </span>
                    </div>
                  ))}
                </div>

                {/* Adaptive Recovery state indicator (Objective 5) */}
                <div className="bg-[#191118] p-2 rounded border border-purple-950/50 space-y-1">
                  <div className="flex justify-between items-center text-[8.5px]">
                    <span className="text-zinc-400 font-bold">Adaptive Recovery Phase (Objective 5):</span>
                    <span className={`px-2 py-0.2 rounded text-[7.5px] font-black ${
                      precisionExecutionIntel.recoveryStage === "Strict Defensive Lockdown" 
                        ? "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse"
                        : precisionExecutionIntel.recoveryStage === "Defensive Calibration Stabilized"
                          ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {precisionExecutionIntel.recoveryStage.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[8px] text-purple-200 leading-tight">
                    {precisionExecutionIntel.recoveryDescription}
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: INSTITUTIONAL RISK DASHBOARD & AUTO PORT DESIGN (Engine 12 / 13) */}
        <div className="xl:col-span-4 space-y-4">
          
          {/* Safety & Survival Card */}
          <div className="bg-[#11131c] border border-gray-900 rounded-xl p-4 space-y-3 shadow-xl relative overflow-hidden">
            {/* Background warning tint when critical */}
            {safety.emotionalVolatilityLevel === "Extreme Lockout" && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-650 animate-pulse" />
            )}

            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
              <span className="text-xs font-bold font-mono tracking-wider text-gray-250 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Engine 13: Emergency Risk Control
              </span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black ${
                safety.emotionalVolatilityLevel === "Extreme Lockout" 
                  ? "bg-red-500/20 text-red-400 border border-red-500/35"
                  : safety.emotionalVolatilityLevel === "Elevated"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/35"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                RISK STATUS: {safety.emotionalVolatilityLevel.toUpperCase()}
              </span>
            </div>

            {/* Risk Compression Mode Notification Badge */}
            {adaptiveRisk.isCompressed && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[9.5px] font-mono text-amber-400 leading-normal flex items-start gap-2 select-none animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold uppercase block text-[8px] tracking-wider text-amber-300">
                    Risk Compression Mode Active
                  </span>
                  <p className="text-[10px] leading-tight text-gray-350">
                    Sizing restricted to <strong className="text-white font-black">{adaptiveRisk.finalPctStr}</strong> due to: <span className="italic">{adaptiveRisk.reasons.join(", ")}</span>.
                  </p>
                </div>
              </div>
            )}

            {/* Interactive Stats parameters of Drawdown */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="bg-black/40 p-2 rounded border border-gray-900">
                <span className="text-[8px] text-gray-500 block uppercase">Daily drawdown</span>
                <span className={`font-bold mt-0.5 block ${safety.dailyDrawdown > 1.5 ? 'text-red-450 text-red-400' : 'text-gray-250'}`}>{safety.dailyDrawdown}%</span>
              </div>
              <div className="bg-black/40 p-2 rounded border border-gray-900">
                <span className="text-[8px] text-gray-500 block uppercase">Weekly risk limits</span>
                <span className="text-gray-200 font-bold mt-0.5 block">{safety.weeklyDrawdown}%</span>
              </div>
            </div>

            {/* Telemetry warnings protection values */}
            <div className="space-y-1 text-[10px] font-mono select-none">
              <div className="flex items-center justify-between p-1 px-2.5 bg-black/15 rounded">
                <span className="text-gray-400">Session Trade Count:</span>
                <span className={`font-bold ${safety.isOvertradingDetected ? 'text-red-400 font-black animate-pulse' : 'text-gray-250'}`}>
                  {safety.tradesThisSession} / 3 max
                </span>
              </div>
              <div className="flex items-center justify-between p-1 px-2.5 bg-black/15 rounded">
                <span className="text-gray-400">Consecutive Losses:</span>
                <span className={`font-bold ${safety.consecutiveLossCount >= 2 ? 'text-red-400 font-extrabold' : safety.consecutiveLossCount === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {safety.consecutiveLossCount} / 2 limit
                </span>
              </div>
              <div className="flex items-center justify-between p-1 px-2.5 bg-black/15 rounded">
                <span className="text-gray-400">Current live spread:</span>
                <span className={`font-bold ${safety.currentSpreadPips <= 1.4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {safety.currentSpreadPips} pips
                </span>
              </div>
              <div className="flex items-center justify-between p-1 px-2.5 bg-black/15 rounded">
                <span className="text-gray-400">Revenge Risk State:</span>
                <span className={`font-bold uppercase ${safety.revengeTradingActive ? 'text-red-400 animate-pulse font-extrabold' : 'text-emerald-400'}`}>
                  {safety.revengeTradingActive ? "CRITICAL ALERT 🚨" : "HEALTHY"}
                </span>
              </div>
            </div>

            {/* Emergency Lock controls */}
            <div className="pt-2 border-t border-gray-900 grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  setSafety(s => {
                    const nextLockState = !s.isSystemStopActive;
                    addLog(`Engine 13: Emergency System Stop ${nextLockState ? "activated" : "cleared"}.`, "safety");
                    return { 
                      ...s, 
                      isSystemStopActive: nextLockState,
                      // reset extreme block if force manual bypass
                      emotionalVolatilityLevel: nextLockState ? s.emotionalVolatilityLevel : "Stable" as any,
                      consecutiveLossCount: nextLockState ? s.consecutiveLossCount : 0
                    };
                  });
                }}
                className={`py-2 px-1 rounded font-mono text-[9px] font-black tracking-wider transition-all uppercase ${
                  safety.isSystemStopActive 
                    ? "bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold" 
                    : "bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30"
                }`}
              >
                {safety.isSystemStopActive ? "⚡ Resume Engine" : "🛑 EMERGENCY HALT"}
              </button>

              <button 
                onClick={() => {
                  setSafety(s => ({
                    ...s,
                    dailyDrawdown: 0.0,
                    tradesThisSession: 0,
                    isCooldownActive: false,
                    cooldownSecondsRemaining: 0,
                    consecutiveLossCount: 0,
                    emotionalVolatilityLevel: "Stable",
                    revengeTradingActive: false,
                    isOvertradingDetected: false,
                    isSystemStopActive: false
                  }));
                  addLog("Engine 13: Capital Protection Metrics reset. Hardlocks released.", "safety");
                }}
                className="py-2 px-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded font-mono text-[9px] font-bold border border-gray-800 transition-all uppercase"
              >
                ♻ Reset metrics
              </button>
            </div>

            {/* Overtrading Warning Alert Banner */}
            {safety.tradesThisSession >= 3 && !safety.isCooldownActive && (
              <div className="p-1 px-2.5 bg-red-950/40 border border-red-900/40 rounded text-[9px] font-mono text-red-400 flex items-center gap-1.5 animate-pulse">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                PSYCHOLOGY FIREWALL BAN ACTIVE: Session trade threshold cap reached.
              </div>
            )}

            {/* Cooldown Timer Alert Badge */}
            {safety.isCooldownActive && (
              <div className="absolute inset-0 bg-black/95 rounded-xl flex flex-col items-center justify-center p-4 z-10 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-yellow-500 animate-bounce" />
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider block">
                    EMERGENCY COOLDOWN ENGAGED
                  </span>
                  <p className="text-[10px] text-gray-400 font-mono">
                    System prevents overtrading behavior after execution logic locks.
                  </p>
                </div>
                <div className="font-mono text-2xl font-black text-white px-3 py-1 bg-yellow-500/20 border border-yellow-500/10 rounded-lg">
                  {safety.cooldownSecondsRemaining} s
                </div>
              </div>
            )}

            {/* Emotional lock view overlay */}
            {safety.emotionalVolatilityLevel === "Extreme Lockout" && (
              <div className="absolute inset-0 bg-red-950/95 rounded-xl flex flex-col items-center justify-center p-4 z-10 text-center space-y-2.5">
                <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-black text-red-500 uppercase tracking-widest block">
                    TEMPORAL RISK HARDLOCK
                  </span>
                  <p className="text-[10px] text-gray-300 font-mono leading-relaxed">
                    Emotional Volatility Protection triggered. Consecutive losses exceed system safety parameters.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSafety(s => ({
                      ...s,
                      consecutiveLossCount: 0,
                      isSystemStopActive: false,
                      emotionalVolatilityLevel: "Stable"
                    }));
                    addLog("Engine 13: Volatility lock manual release bypassed.", "safety");
                  }}
                  className="p-1.5 px-3 bg-red-600 text-white font-mono font-bold text-[9px] rounded hover:bg-red-500 transition-all uppercase"
                >
                  Force Release Lock [!]
                </button>
              </div>
            )}
          </div>

          {/* --- ACTIVE SIMULATED POSITION DASHBOARD --- */}
          {activeSimPosition && (
            <div className={`border rounded-xl p-4 space-y-3 shadow-xl relative overflow-hidden bg-black/85 transition-all ${
              activeSimPosition.unrealizedPnl >= 0 
                ? "border-emerald-500/40 shadow-emerald-950/25" 
                : "border-red-500/40 shadow-red-950/25"
            }`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-tr opacity-10 from-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-ping ${
                    activeSimPosition.unrealizedPnl >= 0 ? "bg-emerald-400" : "bg-red-400"
                  }`} />
                  <span className="text-[10px] font-mono font-black text-gray-200 tracking-wider">
                    XAUUSD ACTIVE TICKET
                  </span>
                </div>
                <span className={`font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  activeSimPosition.direction === "Buy" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                }`}>
                  {activeSimPosition.direction.toUpperCase()} • {activeSimPosition.lots} Lots
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-center font-mono">
                <div className="bg-[#0e1017] p-2 rounded border border-zinc-900">
                  <span className="text-[8px] text-gray-500 block uppercase">Entry price</span>
                  <span className="text-gray-250 font-bold block mt-0.5">${activeSimPosition.entryPrice.toFixed(2)}</span>
                </div>
                <div className="bg-[#0e1017] p-2 rounded border border-zinc-900">
                  <span className="text-[8px] text-gray-500 block uppercase">Float value</span>
                  <span className={`font-black block mt-0.5 text-xs ${
                    activeSimPosition.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {activeSimPosition.unrealizedPnl >= 0 ? "+" : ""}${activeSimPosition.unrealizedPnl.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Dynamic Progress trail slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-mono text-gray-400 leading-none">
                  <span>SL Limits: ${activeSimPosition.stopLoss.toFixed(2)}</span>
                  <span>TP Target: ${activeSimPosition.takeProfit.toFixed(2)}</span>
                </div>
                <div className="w-full h-1 bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden relative">
                  <div 
                    className={`h-full absolute top-0 rounded-full transition-all duration-300 ${
                      activeSimPosition.unrealizedPnl >= 0 ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{ 
                      left: "50%", 
                      width: `${Math.min(50, Math.max(-50, (activeSimPosition.unrealizedPnl / 15) * 100))}%`,
                      transform: activeSimPosition.unrealizedPnl < 0 ? "translateX(-100%)" : "none"
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- TRADE VALIDATION MATRIX & LIFECYCLE CONTROLS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box A: Validation Matrix */}
            <div className="bg-[#11131c] border border-gray-900 rounded-xl p-4 space-y-3.5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                <span className="text-xs font-bold font-mono tracking-wider text-gray-250 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#fbbf24]" />
                  Validation Matrix
                </span>
                <span className="text-[9px] font-mono font-extrabold bg-zinc-950 px-2 py-0.5 border border-zinc-850 rounded text-gray-400">
                  Passed: {checklistItems.filter(i => i.status).length} / 7
                </span>
              </div>

              <div className="space-y-1.5">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-1.5 bg-black/45 rounded border border-gray-950 hover:border-zinc-900/40 transition-all font-mono">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-[11px] h-[11px] rounded-full flex items-center justify-center border transition-all ${
                        item.status 
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" 
                          : "bg-zinc-950 border-zinc-800 text-zinc-650"
                      }`}>
                        {item.status ? <Check className="w-[8px] h-[8px] stroke-[4]" /> : <span className="text-[5px]">•</span>}
                      </div>
                      <span className={`text-[9px] font-bold truncate ${item.status ? "text-zinc-200" : "text-zinc-500"}`}>
                        {item.name}
                      </span>
                    </div>
                    <span className={`text-[7.5px] font-black uppercase px-1 rounded select-none ${
                      item.status ? "bg-emerald-500/10 text-emerald-450" : "bg-zinc-900/60 text-zinc-650"
                    }`}>
                      {item.status ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Box B: Institutional Lifecycle Stepper */}
            <div className="bg-[#11131c] border border-gray-900 rounded-xl p-4 space-y-3 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                <span className="text-xs font-bold font-mono tracking-wider text-gray-250 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#38bdf8]" />
                  Execution Lifecycle
                </span>
                <span className="text-[9px] font-mono font-medium text-gray-400 italic">
                  8-Stage Engine
                </span>
              </div>

              {/* Progress Vertical Line & Stepper Blocks */}
              <div className="relative pl-3.5 space-y-1.5 select-none text-[9.5px] font-mono">
                <div className="absolute left-[5.5px] top-1.5 bottom-1.5 w-[1px] bg-zinc-800" />
                
                {[
                  { id: "setup detected", label: "Setup Detected", color: "text-amber-400", desc: "Extreme liquidity run mapped" },
                  { id: "waiting confirmation", label: "Awaiting Confirmation", color: "text-sky-300", desc: "BOS/CHOCH break sweep verification" },
                  { id: "armed", label: "System Armed", color: "text-[#a855f7]", desc: "Validation matrix 100% aligned" },
                  { id: "executed", label: "Position Live", color: "text-emerald-400", desc: "Contracts active on gold pipeline" },
                  { id: "protected", label: "Breakeven Protected", color: "text-emerald-500", desc: "SL shifted to entry point" },
                  { id: "partial secured", label: "Partials Secured", color: "text-[#22d3ee]", desc: "50% target allocation liquidated" },
                  { id: "closed", label: "Position Closed", color: "text-zinc-400", desc: "Final trailing limits liquidated" },
                  { id: "reviewed", label: "Journal Reviewed", color: "text-purple-400", desc: "Telemetry archived in persistent log" }
                ].map((step, idx) => {
                  const isActive = activeLifecycleStage === step.id;
                  const isFinished = [
                    "setup detected",
                    "waiting confirmation",
                    "armed",
                    "executed",
                    "protected",
                    "partial secured",
                    "closed",
                    "reviewed"
                  ].indexOf(activeLifecycleStage) > idx;

                  return (
                    <div key={step.id} className="relative flex items-start gap-2.5 transition-all">
                      {/* Interactive step indicator dot */}
                      <span className={`absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full border transition-all ${
                        isActive 
                          ? "bg-[#38bdf8] border-sky-455 animate-pulse shadow-md" 
                          : isFinished 
                            ? "bg-emerald-500 border-emerald-600 text-white" 
                            : "bg-[#0b0c13] border-zinc-800"
                      }`} />
                      <div className="min-w-0">
                        <span className={`font-black uppercase tracking-tight ${
                          isActive ? step.color : isFinished ? "text-emerald-400/80" : "text-zinc-650"
                        }`}>
                          {step.label} {isActive && "• ACTIVE"}
                        </span>
                        {isActive && (
                          <p className="text-[8.5px] text-zinc-400 leading-snug break-words">
                            {step.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* AI recommendations pane (Engine 12) */}
          <div className="bg-[#11131c] border border-gray-900 rounded-xl p-4 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
              <span className="text-xs font-bold font-mono tracking-wider text-gray-205 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                Engine 11/12: Probability Fusion Unit
              </span>
            </div>

            {/* Dynamic Segmented Selector for Execution Modes */}
            <div className="space-y-1.5">
              <span className="text-[8.5px] font-mono font-black text-gray-500 uppercase tracking-widest block leading-none">
                Operational Execution Mode:
              </span>
              <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-lg border border-gray-950 font-mono text-[9px]">
                <button
                  type="button"
                  onClick={() => {
                    setExecutionMode("Manual Confirmation");
                    addLog("Execution Engine: Shifted strictly to Manual Confirmation mode.", "system", "INFO");
                  }}
                  className={`py-1.5 rounded transition-all font-bold ${
                    executionMode === "Manual Confirmation"
                      ? "bg-purple-500/15 text-purple-200 border border-purple-500/25"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  MANUAL CONFIRM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExecutionMode("Semi-Auto Strategy");
                    addLog("Execution Engine: Shifted to Controlled Semi-Autonomous Strategy. Searching A+ sweep extremes.", "system", "WARN");
                  }}
                  className={`py-1.5 rounded transition-all font-bold ${
                    executionMode === "Semi-Auto Strategy"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/25 animate-pulse"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  SEMI-AUTO STRAT
                </button>
              </div>
              {executionMode === "Semi-Auto Strategy" && (
                <span className="text-[8px] text-amber-500 font-mono block leading-snug animate-pulse pl-1 italic">
                  * System will auto-execute Instant Positions when checklist is fully aligned.
                </span>
              )}
            </div>

            {/* Probability Fusion Scorecard Block */}
            <div className="bg-black/35 p-3 rounded-lg border border-gray-950 space-y-2.5 font-mono text-xs select-none">
              
              {/* Radial or linear Fusion Arc */}
              <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                <span className="text-[8.5px] text-gray-400 uppercase font-black">Trade Probability:</span>
                <span className={`text-sm font-black tracking-tighter ${probabilityFusion.color}`}>
                  {probabilityFusion.probabilityPct}% ({probabilityFusion.grade})
                </span>
              </div>

              {/* Sub-components list */}
              <div className="space-y-1.5 text-[9px] text-gray-400">
                <div className="flex justify-between items-center bg-[#11131c]/40 p-1 px-1.5 rounded border border-gray-950">
                  <span>Execution Readiness:</span>
                  <span className={`font-black ${
                    probabilityFusion.grade.includes("Avoid") ? "text-red-400" : "text-emerald-400"
                  }`}>{probabilityFusion.readinessLabel}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Hist similarity match:</span>
                  <span className="text-sky-400 font-bold">{probabilityFusion.similarityPct}% Match</span>
                </div>

                <div className="text-[8.5px] leading-tight text-zinc-500 italic bg-black/20 p-1.5 rounded truncate max-w-[2700px]">
                  Model: {probabilityFusion.modelName}
                </div>
              </div>

              {/* Suggestions logic flow based on latest telemetry */}
              <div className="text-[9.5px] leading-relaxed text-gray-300 pt-1 border-t border-gray-900 leading-snug font-sans font-medium">
                {latestSweep ? (
                  <span>
                    💡 <strong>RECOMMENDATION:</strong> High probability sweep of {latestSweep.type} extremes verified. Entry rating in Sniper range. Manual injection or Semi-Auto positioning primed.
                  </span>
                ) : (
                  <span>
                    💡 <strong>RECOMMENDATION:</strong> Sidelined. Environment classed as <span className="text-purple-400 font-bold">{environmentClassifier.dominant.label}</span>. Wait for external swing sweeps prior to allocation.
                  </span>
                )}
              </div>
            </div>

            {/* Quick action controls */}
            <div className="grid grid-cols-1 gap-2 pt-1 font-mono">
              <button
                onClick={handleManualInject}
                className="w-full py-2 bg-[#2d1b4a] hover:bg-[#3d2466] text-purple-300 font-bold text-[10px] rounded border border-[#432d66] transition-all flex items-center justify-center gap-1.5"
                type="button"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Inject Current Pipeline to Formulator
              </button>

              <button
                disabled={safety.isCooldownActive || safety.isSystemStopActive || probabilityFusion.grade === "AVOID"}
                onClick={handleExecuteLiveDirectly}
                className="w-full py-2 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-650 hover:bg-opacity-80 text-black font-black text-[11px] rounded transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/5 uppercase tracking-widest enabled:active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                type="button"
              >
                <Zap className="w-3.5 h-3.5 text-black" />
                Instant Quant Position
              </button>
            </div>
          </div>

        </div>
        </div>
      )}
    </div>
  );
}
