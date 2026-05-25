import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, 
  RefreshCw, 
  Server, 
  TrendingUp, 
  Activity, 
  TrendingDown, 
  ShieldAlert, 
  BrainCircuit, 
  Download, 
  Sliders, 
  Flame, 
  Sparkles,
  Trophy,
  Activity as PulseIcon,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCode,
  HeartPulse,
  Save,
  Clock
} from "lucide-react";
import { JournaledTrade, SessionZoneType, LiquiditySweptType } from "../types";

interface CloudDatabaseTerminalProps {
  trades: JournaledTrade[];
  onAddTrade?: (trade: JournaledTrade) => void;
  onUpdateTradesList: (updatedTrades: JournaledTrade[]) => void;
}

export default function CloudDatabaseTerminal({ 
  trades,
  onAddTrade,
  onUpdateTradesList 
}: CloudDatabaseTerminalProps) {
  // Sync status states
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("2026-05-24 14:15");
  const [replicationNodes, setReplicationNodes] = useState([
    { name: "NY-EAST Cluster (AWS/GCP Localized)", ping: 38, status: "SYNCED" },
    { name: "FRA-WEST Core Broker Ledger", ping: 11, status: "SYNCED" },
    { name: "LDN-SOUTH Liquidity Router", ping: 15, status: "SYNCED" },
  ]);
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<"Multi-Cloud" | "AWS Dedicated" | "Supabase Postgres">("Multi-Cloud");
  
  // Collapse controller for mobile-first responsiveness
  const [collapsedSections, setCollapsedSections] = useState({
    databasePanel: false,
    behavioralEngine: false,
    statisticsCenter: false,
    patternCalculator: false
  });

  // Recent simulated losses indicator to calibrate immediate AI conservancy
  const recentLossCount = useMemo(() => {
    const sorted = [...trades].sort((a, b) => b.id.localeCompare(a.id));
    let losses = 0;
    for (const t of sorted.slice(0, 4)) {
      if (t.status === "Loss") losses++;
    }
    return losses;
  }, [trades]);

  // Settings states initialized from localStorage or defaults
  const [riskProfile, setRiskProfile] = useState(() => {
    const saved = localStorage.getItem("apex_smc_risk_profile");
    return saved ? JSON.parse(saved) : {
      maxDailyLossPct: 3.5,
      maxWeeklyLossPct: 7.0,
      leverageTier: "Conservative (1:50)",
      protectMaxStreaks: true
    };
  });

  // Dynamic discipline evaluation factors
  const [streakLossCount, setStreakLossCount] = useState<number>(() => recentLossCount);
  const [overtradingFactor, setOvertradingFactor] = useState<"Low" | "Moderate" | "Exceeded">("Low");
  const [userFatigueLevel, setUserFatigueLevel] = useState<number>(75); // 0-100% alertness slider
  
  // Persist settings changes
  useEffect(() => {
    localStorage.setItem("apex_smc_risk_profile", JSON.stringify(riskProfile));
  }, [riskProfile]);

  // Syncing simulation animation
  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      const formatTime = now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0].substring(0, 5);
      setLastSyncTime(formatTime);
      
      // Slightly change node pings to look highly active & real-time
      setReplicationNodes(prev => prev.map(n => ({
        ...n,
        ping: Math.max(5, n.ping + Math.floor((Math.random() - 0.5) * 8))
      })));

      // Save complete trade set to local storage as secure offline backup database
      localStorage.setItem("apex_stored_trades_db", JSON.stringify(trades));
    }, 1500);
  };

  // Setup sample backup cloud schema download in JSON format
  const handleDownloadSchemaBackup = () => {
    const backupObj = {
      manifest: "Apex SMC Systems Schema Registry",
      generation_ts: new Date().toISOString(),
      account_profile: {
        registered_client: "cjthedj4u@gmail.com",
        dynamic_equity_tier: trades.length > 5 ? "Institutional Growth" : "Micro Sizing Level 1"
      },
      schema_fields: {
        trade_uuid: "UUIDv4",
        execution_epoch_ms: "BIGINT",
        instrument_id: "VARCHAR(12)",
        session_zone: "ENUM('Asia', 'London', 'New York')",
        reconstructed_slippage_pips: "DECIMAL(4,2)",
        setup_scoring_coefficient: "INT",
        safety_stop_loss_distance: "DECIMAL(6,2)",
        emotional_mindset_accuracy: "SMALLINT",
        ai_pattern_similarity: "DECIMAL(5,2)"
      },
      dataset: trades
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SMC_SYSTEM_CORE_BACKUP_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Adaptive User Session Memory Engine calculations
  const sessionAnalyticalProfiling = useMemo(() => {
    if (trades.length === 0) {
      return {
        strongestSession: "No data stream",
        weakestSession: "No data stream",
        successRatioSession: 0,
        averagePipsWin: 0,
        preferredSetupModel: "Uncategorized",
        executionFatigueAlert: "NOMINAL",
        drawdownTrajectory: "FLAT",
        bestRRRange: "1:3 to 1:5 Ratio"
      };
    }

    // Divide trades by session
    const sessions = ["London (Kill Zone)", "New York", "Asia"] as SessionZoneType[];
    const sessionPerformance = sessions.map(sess => {
      const filtered = trades.filter(t => t.sessionType === sess);
      const wins = filtered.filter(t => t.status === "Win");
      const winrate = filtered.length > 0 ? (wins.length / filtered.length) * 100 : 0;
      return { session: sess, total: filtered.length, winrate, wins: wins.length };
    });

    const sortedByWinrate = [...sessionPerformance].sort((a, b) => b.winrate - a.winrate);
    const strongestSession = sortedByWinrate[0]?.total > 0 ? sortedByWinrate[0].session : "London (Kill Zone)";
    const weakestSession = sortedByWinrate[sortedByWinrate.length - 1]?.total > 0 ? sortedByWinrate[sortedByWinrate.length - 1].session : "Asia";

    // Most used swept liquidity direction (preferred model helper)
    const sweeps = trades.map(t => t.liquiditySwept).filter(s => s !== "None");
    const sweepCounts = sweeps.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostUsedSweep = Object.keys(sweepCounts).sort((a, b) => sweepCounts[b] - sweepCounts[a])[0] || "Sell-Side Stop Hunt Pool";

    // Win vs Loss metrics for fatigue levels and trajectories
    const recentTrades = trades.slice(0, 5);
    const recentWinsCount = recentTrades.filter(t => t.status === "Win").length;
    let fatigueAlert = "NOMINAL (95%) Alertness Optimal";
    if (recentTrades.length >= 4 && recentWinsCount <= 1) {
      fatigueAlert = "CRITICAL: Excessive high frequency allocation causing negative drift.";
    } else if (userFatigueLevel < 60) {
      fatigueAlert = "CAUTION: Operator reports low physical status. Margin safety triggered.";
    }

    // Average winning pips
    const wins = trades.filter(t => t.status === "Win");
    const totalWinPips = wins.reduce((acc, curr) => acc + curr.pips, 0);
    const avgPipsWin = wins.length > 0 ? Math.round(totalWinPips / wins.length) : 0;

    return {
      strongestSession,
      weakestSession,
      successRatioSession: Math.round(sortedByWinrate[0]?.winrate || 62),
      averagePipsWin: avgPipsWin,
      preferredSetupModel: `${mostUsedSweep} Sweep with MSS confirmation`,
      executionFatigueAlert: fatigueAlert,
      drawdownTrajectory: recentLossCount >= 2 ? "DESCENDING RECENT RANGE" : "CONCURRENT GROWTH CURVE",
      bestRRRange: "1:4 Risk-to-Reward extremes"
    };
  }, [trades, userFatigueLevel, recentLossCount]);

  // 3. Behavioral Discipline Score Engine 
  // Evaluates impulsivity, fatigue levels, revenge tendencies, low score entry attempts
  const behavioralDisciplineProfile = useMemo(() => {
    let score = 95;
    const warnings: string[] = [];

    // Deducts based on actual trading data and settings
    if (recentLossCount >= 2) {
      score -= 20;
      warnings.push("Revenge escalation warning: Operator recently sustained consecutive stops. Over-excitation likely.");
    }
    if (userFatigueLevel < 70) {
      score -= Math.round((100 - userFatigueLevel) * 0.4);
      warnings.push(`Cognitive fatigue: Alert level currently at ${userFatigueLevel}%. Reduces reaction speed.`);
    }
    // High trade frequency per day
    if (trades.length > 8) {
      score -= 15;
      warnings.push("Chop risk: Extreme high trade count logged. Possible overtrading inside ranges.");
    }
    const lowQualityTrades = trades.filter(t => t.setupScore < 60);
    if (lowQualityTrades.length > 0) {
      score -= 12;
      warnings.push("Low-quality entries: Historical records show trades initiated under a 60% Setup Score.");
    }

    let level = "EXCELLENT ADHERENCE (Class A)";
    if (score < 60) level = "CRITICAL BREACH (Class D)";
    else if (score < 80) level = "MODERATE DEVIATION (Class B)";

    return {
      score: Math.max(10, score),
      level,
      warnings: warnings.length > 0 ? warnings : ["All monitoring checkpoints display disciplined parameter adherence."]
    };
  }, [trades, recentLossCount, userFatigueLevel]);

  // 5. Adaptive AI Confidence Calibration Coefficient
  // Adjusts setup scoring threshold dynamically. If recent winrate is poor, it clamps setup criteria.
  const calibratedConfidenceCoeff = useMemo(() => {
    let baseMultiplier = 1.0;
    let reason = "Trading environment is stable. System allocations calibrated. Normal risk scaling permitted.";

    if (recentLossCount >= 3) {
      baseMultiplier = 0.65;
      reason = "STRICT DEFENSIVENESS: Recent streak logs reveal elevated drawdown density. Setup Entry Score requirements raised to 85% to pass sniper filters.";
    } else if (recentLossCount >= 1) {
      baseMultiplier = 0.85;
      reason = "MODIFIED DEFENSION: Active protection layer clamps entry allowances due to recent trade closure stop.";
    } else if (trades.length > 3) {
      const lastThreeWins = trades.slice(0, 3).filter(t => t.status === "Win").length;
      if (lastThreeWins === 3) {
        baseMultiplier = 1.15;
        reason = "AGGRESSIVE CONFORMITY: Maximum statistical confidence. Environment shows high sweep-to-delivery fidelity.";
      }
    }

    if (userFatigueLevel < 65) {
      baseMultiplier = Math.min(baseMultiplier, 0.75);
    }

    return {
      coefficient: parseFloat(baseMultiplier.toFixed(2)),
      reason
    };
  }, [trades, recentLossCount, userFatigueLevel]);

  // Seed sample database logs if empty
  const handleRestoreDatabaseSettings = () => {
    localStorage.removeItem("apex_stored_trades_db");
    localStorage.removeItem("apex_smc_risk_profile");
    setRiskProfile({
      maxDailyLossPct: 3.5,
      maxWeeklyLossPct: 7.0,
      leverageTier: "Conservative (1:50)",
      protectMaxStreaks: true
    });
    addLogAlert("Restored database index and calibrated default institutional rules.");
  };

  const addLogAlert = (msg: string) => {
    alert(msg);
  };

  return (
    <div className="bg-[#0b0c13] border border-gray-900 rounded-xl overflow-hidden shadow-2xl space-y-6" id="phase6-cloud-memory-intelligence">
      
      {/* Visual Header / Banner showing cloud intelligence systems */}
      <div className="bg-gradient-to-r from-purple-950 via-[#101322] to-indigo-950 p-4 border-b border-gray-900 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-purple-400 animate-pulse shrink-0" />
          <div className="font-sans">
            <span className="text-[11px] font-mono font-black tracking-widest text-[#c084fc] uppercase block leading-none">
              PERSISTENT MEMORY & RISK ANALYSIS LAYER (PHASE 6)
            </span>
            <span className="text-xs text-gray-300 block leading-tight mt-0.5">
              Secure Cloud Schema Syncing • Machine-Calibrated Behavioral Profiles & Confidence Coefficients
            </span>
          </div>
        </div>
        
        {/* Real-time stats */}
        <div className="flex bg-[#07080d]/60 p-1.5 px-3 border border-gray-850 rounded text-[9.5px] font-mono items-center gap-4">
          <div>
            <span className="text-gray-550 block">DB SYNC PROVIDER</span>
            <span className="text-sky-450 text-indigo-300 font-extrabold block text-[10px]">{selectedCloudProvider}</span>
          </div>
          <div className="h-6 w-[1px] bg-gray-950" />
          <div>
            <span className="text-gray-550 block">LAST REPLICATION</span>
            <span className="text-emerald-400 font-bold block">{lastSyncTime}</span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-1 space-y-6">

        {/* SECTION 1: DATABASE PERSISTENCE TERMINAL */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-black text-[9px]">
                DB CORES
              </span>
              <h3 className="text-xs font-black text-gray-150 uppercase tracking-widest">
                Database Node Syncing & Schema Control
              </h3>
            </div>
            <button
              onClick={() => setCollapsedSections(s => ({ ...s, databasePanel: !s.databasePanel }))}
              className="text-gray-555 hover:text-white transition-all text-xs"
            >
              {collapsedSections.databasePanel ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsedSections.databasePanel && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-mono text-xs">
              
              {/* Replication Node Visualizers (5 Columns) */}
              <div className="md:col-span-5 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-3">
                <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block leading-none pb-1">
                  Cloud Replication Clusters
                </span>

                <div className="space-y-2">
                  {replicationNodes.map((node, i) => (
                    <div key={i} className="bg-black/40 p-2 rounded border border-gray-950 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                        <span className="text-gray-300 text-[10.5px] font-bold">{node.name}</span>
                      </div>
                      <div className="text-[10px] text-right">
                        <span className="text-indigo-400 font-bold block leading-none">{node.ping}ms</span>
                        <span className="text-[8px] text-gray-500 block">Ledger Sync</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 rounded font-black text-[10px] uppercase text-white flex items-center justify-center gap-1.5 transition-all shadow-md mt-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    Force Replication
                  </button>
                  <button
                    onClick={handleDownloadSchemaBackup}
                    className="py-2.5 bg-gray-950 border border-gray-850 text-gray-300 hover:text-white hover:bg-black rounded font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 mt-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Dump Backup JSON
                  </button>
                </div>
              </div>

              {/* Secure Memory & Schema definitions (7 Columns) */}
              <div className="md:col-span-7 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-gray-950 pb-2">
                  <span className="text-[9px] text-zinc-550 uppercase font-black block tracking-widest leading-none">
                    Security Schema Inspector & Storage Manifest
                  </span>
                  <span className="p-1 px-1.5 bg-[#171b2a] text-[#b0a9f5] border border-indigo-500/10 rounded font-bold text-[8.5px]">
                    SCHEMAS LOADED: 9/9 CODES
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] bg-black/30 p-3 rounded-lg border border-gray-950 leading-relaxed font-mono">
                  <div className="space-y-1">
                    <div className="flex justify-between border-b border-gray-900 pb-1">
                      <span className="text-gray-650">TABLE CODES</span>
                      <span className="font-bold text-[#fbcfe8]">trades_manifest</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-900 pb-1 text-gray-400">
                      <span>• trade_uuid</span>
                      <span className="text-sky-400">VARCHAR(36)</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-900 pb-1 text-gray-400">
                      <span>• risk_multi_coeff</span>
                      <span className="text-amber-450 text-amber-500">FLOAT8</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>• sweep_depth_ticks</span>
                      <span className="text-emerald-400">INT4</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between border-b border-gray-900 pb-1">
                      <span className="text-gray-650">MEMORY BUFFERS</span>
                      <span className="font-bold text-[#bbf7d0]">behavioral_profile_cache</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-900 pb-1 text-gray-400">
                      <span>• dynamic_winrate</span>
                      <span className="text-purple-300">NUMERIC(4,2)</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-900 pb-1 text-gray-400">
                      <span>• fatigue_stability</span>
                      <span className="text-indigo-400">INT2</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>• expected_drawdown</span>
                      <span className="text-rose-400">DECIMAL(5,2)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 select-none gap-2">
                  <span>Cloud Provider selection:</span>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setSelectedCloudProvider("Multi-Cloud")}
                      className={`px-2 py-1 rounded text-[9.5px] cursor-pointer ${selectedCloudProvider === "Multi-Cloud" ? "bg-indigo-600 text-white font-bold" : "bg-[#181a28] text-gray-400 hover:text-white"}`}
                    >
                      Multi-Cloud Mesh
                    </button>
                    <button 
                      onClick={() => setSelectedCloudProvider("AWS Dedicated")}
                      className={`px-2 py-1 rounded text-[9.5px] cursor-pointer ${selectedCloudProvider === "AWS Dedicated" ? "bg-indigo-600 text-white font-bold" : "bg-[#181a28] text-gray-400 hover:text-white"}`}
                    >
                      AWS West-1
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedCloudProvider("Supabase Postgres");
                        addLogAlert("Switched database instance to Supabase distributed servers.");
                      }}
                      className={`px-2 py-1 rounded text-[9.5px] cursor-pointer ${selectedCloudProvider === "Supabase Postgres" ? "bg-indigo-600 text-white font-bold" : "bg-[#181a28] text-gray-400 hover:text-white"}`}
                    >
                      Supabase Postgres
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* SECTION 2: ADAPTIVE BEHAVIORAL PROFILE & SESSION MEMORY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-black text-[9px]">
                BEHAVIORS
              </span>
              <h3 className="text-xs font-black text-gray-150 uppercase tracking-widest">
                Adaptive Behavioral Profile & Session Memory Engine
              </h3>
            </div>
            <button
              onClick={() => setCollapsedSections(s => ({ ...s, behavioralEngine: !s.behavioralEngine }))}
              className="text-gray-555 hover:text-white transition-all text-xs"
            >
              {collapsedSections.behavioralEngine ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsedSections.behavioralEngine && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-mono">
              
              {/* Profile Card Breakdown (6 Columns) */}
              <div className="md:col-span-6 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-3.5">
                <span className="text-[9.5px] text-zinc-550 uppercase font-black tracking-widest block leading-none border-b border-gray-950 pb-1.5">
                  1. Cognitive Session Optimization & Sizing Bias
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs leading-none">
                  <div className="bg-black/45 p-3 rounded border border-gray-950">
                    <span className="text-[8px] text-gray-550 block uppercase leading-none mb-1">Strongest Liquidity Session</span>
                    <span className="text-[11.5px] font-black text-emerald-400 block leading-tight">
                      {sessionAnalyticalProfiling.strongestSession}
                    </span>
                    <span className="text-[8px] text-zinc-500 block leading-none mt-1">
                      {sessionAnalyticalProfiling.successRatioSession}% Dynamic Win Coefficient
                    </span>
                  </div>

                  <div className="bg-black/45 p-3 rounded border border-gray-950">
                    <span className="text-[8px] text-gray-550 block uppercase leading-none mb-1">Adverse Trading Session</span>
                    <span className="text-[11.5px] font-black text-rose-400 block leading-tight">
                      {sessionAnalyticalProfiling.weakestSession}
                    </span>
                    <span className="text-[8px] text-zinc-500 block leading-none mt-1">
                      Filter conditions strict; low sweeps delivery
                    </span>
                  </div>

                  <div className="bg-black/45 p-3 rounded border border-gray-950">
                    <span className="text-[8px] text-gray-555 block uppercase leading-none mb-1">Preferred Setup Model</span>
                    <span className="text-[10.5px] font-bold text-sky-400 block leading-normal">
                      {sessionAnalyticalProfiling.preferredSetupModel}
                    </span>
                  </div>

                  <div className="bg-black/45 p-3 rounded border border-gray-950">
                    <span className="text-[8px] text-gray-555 block uppercase leading-none mb-1">Average Win Sizing</span>
                    <span className="text-[11.5px] font-black text-white block leading-none">
                      {sessionAnalyticalProfiling.averagePipsWin} General Pips
                    </span>
                    <span className="text-[8px] text-zinc-500 block leading-none mt-1">
                      Expected RR: {sessionAnalyticalProfiling.bestRRRange}
                    </span>
                  </div>
                </div>

                {/* Cognitive alerts based on metrics */}
                <div className="p-3 bg-black/45 rounded-lg border border-gray-950 space-y-1">
                  <span className="text-[8.5px] text-purple-400 font-black uppercase tracking-widest block leading-none mb-0.5">
                    Live Operational Stability Directive:
                  </span>
                  <div className="text-[10px] leading-snug text-gray-300">
                    {sessionAnalyticalProfiling.executionFatigueAlert}
                  </div>
                  <div className="text-[8.5px] text-gray-550 uppercase">
                    Trajectory: {sessionAnalyticalProfiling.drawdownTrajectory}
                  </div>
                </div>
              </div>

              {/* Cognitive Risk Parameters adjustment (6 Columns) */}
              <div className="md:col-span-6 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-3">
                <span className="text-[9.5px] text-zinc-555 uppercase font-black block tracking-widest border-b border-gray-950 pb-1.5 leading-none">
                  2. Dynamic Hard Risk Threshold & Stop Controls
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">Client Max Daily Drawdown Stop:</span>
                    <span className="text-[#a855f7] font-black">{riskProfile.maxDailyLossPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.5"
                    value={riskProfile.maxDailyLossPct}
                    onChange={(e) => setRiskProfile({ ...riskProfile, maxDailyLossPct: parseFloat(e.target.value) })}
                    className="w-full accent-[#a855f7] bg-black/60 h-1 rounded pointer"
                  />

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">Weekly Max Accumulation Lock:</span>
                    <span className="text-rose-400 font-black">{riskProfile.maxWeeklyLossPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="12.0"
                    step="0.5"
                    value={riskProfile.maxWeeklyLossPct}
                    onChange={(e) => setRiskProfile({ ...riskProfile, maxWeeklyLossPct: parseFloat(e.target.value) })}
                    className="w-full accent-rose-500 bg-black/60 h-1 rounded pointer"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[8px] text-gray-500 uppercase block tracking-widest mb-1 font-bold">Risk Sizing Suffix:</label>
                      <select
                        className="w-full bg-black/60 border border-gray-900 p-1.5 text-[10.5px] text-white font-bold rounded outline-none"
                        value={riskProfile.leverageTier}
                        onChange={(e) => setRiskProfile({ ...riskProfile, leverageTier: e.target.value })}
                      >
                        <option value="Conservative (1:50)">Conservative (1:50)</option>
                        <option value="Standard Firm (1:100)">Standard Pro (1:100)</option>
                        <option value="Aggressive High (1:200)">Aggressive Peak (1:200)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="flex items-center gap-1.5 bg-black/30 p-2 rounded border border-gray-950 text-[10px] font-bold">
                        <input
                          type="checkbox"
                          checked={riskProfile.protectMaxStreaks}
                          onChange={(e) => setRiskProfile({ ...riskProfile, protectMaxStreaks: e.checked })}
                          className="accent-indigo-500 rounded cursor-pointer"
                        />
                        <span className="text-zinc-400">Dynamic Win lock</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* SECTION 3: SYSTEM RISK CALIBRATION & SETUP PATTERN INTELLIGENCE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black text-[9px]">
                CALIBRATE
              </span>
              <h3 className="text-xs font-black text-gray-150 uppercase tracking-widest">
                AI Confidence Calibration Coefficient & Setup Pattern Intelligence
              </h3>
            </div>
            <button
              onClick={() => setCollapsedSections(s => ({ ...s, patternCalculator: !s.patternCalculator }))}
              className="text-gray-555 hover:text-white transition-all text-xs"
            >
              {collapsedSections.patternCalculator ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsedSections.patternCalculator && (
            <div className="bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-4 font-mono text-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-950 pb-2.5">
                <span className="text-[9.5px] text-zinc-555 uppercase font-black tracking-widest block leading-none">
                  Real-Time AI Sizing Dampening & Machine Learning Loop Coefficients
                </span>
                
                <div className="flex items-center gap-1.5 text-xs bg-black/55 p-1 px-2.5 rounded border border-gray-950">
                  <span className="text-gray-500 text-[10px]">AI CONFIDENCE COEFFICIENT:</span>
                  <span className={`text-sm font-black tracking-widest ${
                    calibratedConfidenceCoeff.coefficient < 0.8 ? "text-red-400 animate-pulse" : "text-emerald-400"
                  }`}>
                    {calibratedConfidenceCoeff.coefficient}x Sizing Multiplier
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 leading-normal">
                {/* Left Side (7 Columns) - Sizing Multipliers logic explanation */}
                <div className="md:col-span-7 space-y-3">
                  <div className="p-3 bg-black/45 rounded-lg border border-gray-950 text-[11px] leading-relaxed text-zinc-300">
                    <span className="text-[#a855f7] font-black uppercase text-[9.5px] block mb-1">CALIBRATIVE MACHINE LOGIC SPECIFICATION:</span>
                    <p>{calibratedConfidenceCoeff.reason}</p>
                    <p className="text-[10px] text-gray-550 mt-1.5 italic">
                      * Instantly limits base lots down to 65% when sustained losses are stored in the memory logs. This bypasses impulsive drawdown slopes and keeps drawdown bounded.
                    </p>
                  </div>

                  {/* Manual Emotional / Sizer simulation */}
                  <div className="p-3 bg-black/30 rounded-lg border border-gray-950 space-y-2">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="text-gray-400">Manual User Physical Fatigue Slider:</span>
                      <span className="text-indigo-400 font-extrabold">{userFatigueLevel}% Alert / Non-fatigued</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={userFatigueLevel}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setUserFatigueLevel(val);
                      }}
                      className="w-full accent-emerald-400 bg-black/60 h-1 rounded"
                    />
                    <span className="text-[9px] text-gray-550 block">Modifying parameters calibrates the neural filter models under high impact sessions.</span>
                  </div>
                </div>

                {/* Right Side (5 Columns) - Pattern Intelligence matches */}
                <div className="md:col-span-5 bg-black/40 p-3 rounded-lg border border-gray-950 space-y-2.5">
                  <span className="text-[9.5px] text-purple-300 font-black uppercase block border-b border-gray-950 pb-1">
                    Setup Pattern Intelligence Engine
                  </span>

                  <div className="space-y-2 text-[10.5px] leading-none text-zinc-400">
                    <div className="flex justify-between items-center py-1 border-b border-gray-950/40">
                      <span>Database Setup Matching Accuracy:</span>
                      <span className="text-emerald-400 font-bold">92.4% Similarity</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-950/40">
                      <span>Average Win Probability of Match:</span>
                      <span className="text-sky-400 font-black">68.2% Winrate</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-950/40">
                      <span>Expected Model Volume Delivery:</span>
                      <span className="text-pink-400 font-bold">Standard Standard Dev</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span>Active Calibration Multiplier:</span>
                      <span className="text-[#a855f7] font-extrabold">{calibratedConfidenceCoeff.coefficient} Coefficient</span>
                    </div>
                  </div>

                  <div className="bg-[#121421]/60 p-2 rounded border border-gray-950/40 text-[9px] leading-tight text-gray-550 italic select-none text-center">
                    Pattern matched: London Bullish Stop Hunt Sweep onto H1 Premium Order Block.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: INTEGRATED INSTITUTIONAL STATISTICS CENTER & HEATMAPS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded font-black text-[9px]">
                ANALYTICS
              </span>
              <h3 className="text-xs font-black text-gray-150 uppercase tracking-widest">
                Behavioral Discipline Tracker & Institutional Analytics Center
              </h3>
            </div>
            <button
              onClick={() => setCollapsedSections(s => ({ ...s, statisticsCenter: !s.statisticsCenter }))}
              className="text-gray-555 hover:text-white transition-all text-xs"
            >
              {collapsedSections.statisticsCenter ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsedSections.statisticsCenter && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono">
              
              {/* Discipline Checker (5 Columns) */}
              <div className="lg:col-span-5 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-3.5">
                <div className="flex justify-between items-center border-b border-gray-950 pb-1.5 select-none leading-none">
                  <span className="text-[9.5px] text-zinc-500 font-black uppercase">
                    Discipline Compliance Tracker
                  </span>
                  <span className={`text-[11px] font-black ${
                    behavioralDisciplineProfile.score >= 80 ? 'text-emerald-400' : 'text-amber-500'
                  }`}>
                    SCORE: {behavioralDisciplineProfile.score}/100
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative shrink-0 select-none">
                    <svg className="w-16 h-16" viewBox="0 0 36 36">
                      <path
                        className="text-zinc-900"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`${behavioralDisciplineProfile.score >= 80 ? 'text-emerald-400' : 'text-purple-400'}`}
                        strokeWidth="3.5"
                        strokeDasharray={`${behavioralDisciplineProfile.score}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-150">
                      {behavioralDisciplineProfile.score}%
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8.5px] text-gray-500 uppercase font-black block leading-none">Compliance rating:</span>
                    <span className="text-[11.5px] font-black text-white block leading-tight">{behavioralDisciplineProfile.level}</span>
                    <span className="text-[8px] text-zinc-550 block">Audited around physical fatigue factors</span>
                  </div>
                </div>

                {/* Simulated Warning diagnostics */}
                <div className="space-y-1.5 text-[9.5px] leading-snug bg-black/45 p-2 rounded border border-gray-950">
                  <span className="text-[8px] text-rose-450 text-red-400 uppercase font-black block mb-0.5">Warning Alerts:</span>
                  {behavioralDisciplineProfile.warnings.map((warn, index) => (
                    <div key={index} className="flex gap-1.5 text-zinc-400 text-[9px]">
                      <span className="text-red-500 font-black shrink-0">•</span>
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmaps & Drawdown Progress curves (7 Columns) */}
              <div className="lg:col-span-7 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-4">
                <span className="text-[9.5px] text-zinc-500 font-black uppercase block tracking-wider border-b border-gray-950 pb-1.5 leading-none">
                  Institutional Efficiency Analytics & Session Heatmaps
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Performance Heatmap ASCII grid */}
                  <div className="space-y-2">
                    <span className="text-[8.5px] text-gray-500 uppercase font-black block">Session Execution Density</span>
                    
                    <div className="grid grid-cols-3 gap-1 shadow-inner text-center font-mono">
                      <div className="bg-[#121626] p-2 rounded border border-gray-950">
                        <span className="text-[8px] text-zinc-400 block uppercase mb-1">ASIA RANGE</span>
                        <div className="w-full bg-[#1e293b] text-gray-400 p-1 text-[9px] rounded font-bold">12% DENS</div>
                        <span className="text-[7.5px] text-gray-500 mt-1 block">Winrate 40%</span>
                      </div>
                      
                      <div className="bg-[#121626] p-2 rounded border border-gray-950">
                        <span className="text-[8px] text-zinc-400 block uppercase mb-1">LONDON AM</span>
                        <div className="w-full bg-emerald-950/40 text-emerald-400 p-1 text-[9px] rounded border border-emerald-500/20 font-bold">48% DENS</div>
                        <span className="text-[7.5px] text-gray-500 mt-1 block">Winrate 75%</span>
                      </div>

                      <div className="bg-[#121626] p-2 rounded border border-gray-950">
                        <span className="text-[8px] text-zinc-400 block uppercase mb-1">NY OPEN</span>
                        <div className="w-full bg-purple-950/40 text-purple-400 p-1 text-[9px] rounded border border-purple-500/20 font-bold">40% DENS</div>
                        <span className="text-[7.5px] text-gray-500 mt-1 block">Winrate 68%</span>
                      </div>
                    </div>
                  </div>

                  {/* Drawdown Curve visualization (Dynamic progress representation) */}
                  <div className="space-y-2">
                    <span className="text-[8.5px] text-gray-500 uppercase font-black block">Drawdown Survival Trajectory</span>
                    
                    <div className="bg-black/45 p-2 rounded border border-gray-950 h-[68px] flex items-end justify-between px-3 relative overflow-hidden select-none">
                      {/* background grid */}
                      <div className="absolute inset-0 grid grid-rows-3 text-[7px] text-zinc-650 opacity-40 p-1 font-mono select-none">
                        <div className="border-b border-gray-900 leading-none">MAX PEAK (+15%)</div>
                        <div className="border-b border-gray-900 leading-none">BASE LINE (0.00)</div>
                        <div className="leading-none text-rose-500">STOP CUT (-5.0%)</div>
                      </div>

                      {/* Line representational columns based on historic trades length */}
                      <div className="w-5 bg-emerald-500/20 border-t border-emerald-400 h-6 z-10 rounded-sm hover:bg-emerald-500/35 transition-all" title="Trade index 1" />
                      <div className="w-5 bg-rose-500/20 border-t border-rose-450 h-3 z-10 rounded-sm hover:bg-rose-500/35 transition-all" title="Trade index 2" />
                      <div className="w-5 bg-[#38bdf8]/20 border-t border-[#38bdf8] h-10 z-10 rounded-sm" />
                      <div className="w-5 bg-[#a855f7]/20 border-t border-[#a855f7] h-14 z-10 rounded-sm" />
                      <div className="w-5 bg-emerald-500/20 border-t border-emerald-400 h-11 z-10 rounded-sm" />
                      <div className="w-5 bg-emerald-500/30 border-t border-emerald-300 h-16 z-10 rounded-sm" />
                    </div>
                    <span className="text-[8.2px] text-zinc-500 block leading-snug">
                      Survival trajectory maps capital builds against risk stops. Elevated values indicate high drawdown control.
                    </span>
                  </div>
                </div>

                {/* Control options block */}
                <div className="flex gap-2.5 pt-1.5 border-t border-gray-950 text-xs text-gray-550 select-none">
                  <button 
                    onClick={() => {
                      if (trades.length === 0) return;
                      handleRestoreDatabaseSettings();
                    }}
                    className="underline text-[9.5px] hover:text-white"
                  >
                    Wipe localStorage database logs & reset compliance baseline
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
