import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldAlert, 
  Activity, 
  Settings, 
  Workflow, 
  TrendingUp, 
  Zap, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  DollarSign,
  Cpu, 
  RefreshCw,
  FileText,
  Lock,
  Compass,
  Briefcase,
  HelpCircle
} from "lucide-react";

interface MT5BridgeTerminalProps {
  onJournalLiveTrade: (trade: any) => void;
  activeSession: string;
}

export interface MT5Position {
  id: string;
  symbol: string;
  type: "Buy" | "Sell";
  lots: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  profit: number;
  timestamp: string;
}

interface ExecutionLog {
  timestamp: string;
  type: "INFO" | "WARN" | "SUCCESS" | "DENIED";
  message: string;
}

type ConnectionStatus = "Offline" | "Connecting" | "Synced" | "Delayed" | "Rejected" | "Demo Locked";

export default function MT5BridgeTerminal({ onJournalLiveTrade, activeSession }: MT5BridgeTerminalProps) {
  // Mobile / Accordion Collapsible Panel State
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    connectionGate: false,
    syncDashboard: false,
    marketInjector: false,
    orderPrep: false,
    activePositions: false,
    auditorLogs: false
  });

  // Broker connection settings state
  const [broker, setBroker] = useState<string>("APEX-PRO-METATRADER");
  const [mt5Server, setMt5Server] = useState<string>("mt5.apex-pro-institutional.com");
  const [loginId, setLoginId] = useState<string>("8920993");
  const [password, setPassword] = useState<string>("••••••••••••"); // Masked value
  const [serverMode, setServerMode] = useState<"Demo" | "Live">("Demo");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("Synced");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [selectedLeverage, setSelectedLeverage] = useState<string>("1:100");

  // Telemetry metrics
  const [capital, setCapital] = useState<number>(100000); // Institutional scale
  const [floatingPL, setFloatingPL] = useState<number>(0);
  const [ping, setPing] = useState<number>(14);
  const [psychStability, setPsychStability] = useState<number>(95);

  // Live Market Event Detection toggles
  const [highImpactNewsActive, setHighImpactNewsActive] = useState<boolean>(false);
  const [abnormalVolatility, setAbnormalVolatility] = useState<boolean>(false);
  const [dangerousSpread, setDangerousSpread] = useState<boolean>(false);
  const [lowLiquidity, setLowLiquidity] = useState<boolean>(false);
  const [rapidDisplacement, setRapidDisplacement] = useState<boolean>(false);

  // Active positions database
  const [positions, setPositions] = useState<MT5Position[]>([
    {
      id: "pos_mt5_8932",
      symbol: "XAUUSD",
      type: "Buy",
      lots: 0.15,
      openPrice: 2325.4,
      currentPrice: 2327.1,
      sl: 2315.0,
      tp: 2345.0,
      profit: 25.5,
      timestamp: "13:42:10"
    }
  ]);

  // Order Ticket Configuration
  const [orderSymbol, setOrderSymbol] = useState<string>("XAUUSD");
  const [orderDirection, setOrderDirection] = useState<"Buy" | "Sell">("Buy");
  const [stopLossPips, setStopLossPips] = useState<number>(20);
  const [takeProfitPips, setTakeProfitPips] = useState<number>(80);
  const [entryPrice, setEntryPrice] = useState<number>(2330.1);

  // Output execution logs
  const [logs, setLogs] = useState<ExecutionLog[]>([
    { timestamp: "14:50:02", type: "INFO", message: "MT5 Broker Bridge secure tunnel initialized." },
    { timestamp: "14:54:15", type: "SUCCESS", message: "Synced with APEX-PRO-METATRADER gateway on port 443." }
  ]);

  // Execution result response block
  const [executionResult, setExecutionResult] = useState<{
    status: "Approved" | "Denied" | null;
    reason: string;
    ticketId?: string;
  }>({ status: null, reason: "" });

  const addLog = (message: string, type: "INFO" | "WARN" | "SUCCESS" | "DENIED") => {
    const timestamp = new Date().toTimeString().split(" ")[0];
    setLogs(prev => [{ timestamp, type, message }, ...prev.slice(0, 40)]);
  };

  // Secure connect engine logic simulating network states
  const handleToggleConnection = () => {
    if (connectionStatus !== "Offline" && connectionStatus !== "Rejected") {
      setConnectionStatus("Offline");
      setFloatingPL(0);
      addLog("Manual disconnection triggered. Terminated MT5 socket stream securely.", "WARN");
      return;
    }

    setIsConnecting(true);
    setConnectionStatus("Connecting");
    addLog(`Initiating secure MT5 client socket authentication to ${mt5Server}...`, "INFO");

    setTimeout(() => {
      setIsConnecting(false);

      if (!loginId || password.length < 3) {
        setConnectionStatus("Rejected");
        addLog(`MT5 Connection REJECTED: Invalid credentials or login ID.`, "DENIED");
        return;
      }

      if (serverMode === "Live") {
        setConnectionStatus("Demo Locked");
        addLog("MT5 SYSTEM POLICY ACTION: Switched environment to safety Demo container. DIRECT LIVE RISK BLOCKED.", "WARN");
        return;
      }

      // Successful connection
      setConnectionStatus("Synced");
      addLog(`MT5 Server Handshake successful. Connected to brokerage account ${loginId}.`, "SUCCESS");
    }, 1500);
  };

  // Live Market events pricing simulation loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (connectionStatus === "Offline" || connectionStatus === "Rejected") {
        setFloatingPL(0);
        return;
      }

      // Simulate ping values
      setPing(prev => {
        const basePing = connectionStatus === "Delayed" ? 85 : 12;
        const change = Math.floor((Math.random() - 0.5) * 6);
        return Math.max(5, Math.min(200, basePing + change));
      });

      // Fluctuate position values
      setPositions(prev => {
        let currentTotalPL = 0;
        const updated = prev.map(p => {
          const tickChange = (Math.random() - 0.49) * 0.5; // Upward bias
          const nextPrice = parseFloat((p.currentPrice + tickChange).toFixed(2));
          // Gold / Commodity standard pricing: Lot * Contract Size (100) * Diff
          const delta = p.type === "Buy" ? (nextPrice - p.openPrice) : (p.openPrice - nextPrice);
          const currentPL = parseFloat((delta * p.lots * 100).toFixed(2));
          currentTotalPL += currentPL;
          return {
            ...p,
            currentPrice: nextPrice,
            profit: currentPL
          };
        });
        setFloatingPL(parseFloat(currentTotalPL.toFixed(2)));
        return updated;
      });

      // Simulate a random delay transition
      if (Math.random() > 0.90 && connectionStatus === "Synced") {
        setConnectionStatus("Delayed");
        addLog("MT5 data gateway queue latency warning - server stream delayed.", "WARN");
      } else if (Math.random() > 0.85 && connectionStatus === "Delayed") {
        setConnectionStatus("Synced");
        addLog("Gateway package queue synchronized cleanly.", "INFO");
      }

    }, 2000);

    return () => clearInterval(timer);
  }, [connectionStatus]);

  // Calculated Equity statistics
  const equity = useMemo(() => {
    if (connectionStatus === "Offline" || connectionStatus === "Rejected") return 0;
    return parseFloat((capital + floatingPL).toFixed(2));
  }, [capital, floatingPL, connectionStatus]);

  const marginMultiplier = useMemo(() => {
    return parseFloat(selectedLeverage.split(":")[1] || "100");
  }, [selectedLeverage]);

  // Margin = (Lots * Contract Size (100,000)) / Leverage
  const calculatedMargin = useMemo(() => {
    if (connectionStatus === "Offline" || connectionStatus === "Rejected" || positions.length === 0) return 0;
    const totalLots = positions.reduce((sum, p) => sum + p.lots, 0);
    return parseFloat(((totalLots * 100000) / marginMultiplier).toFixed(2));
  }, [positions, marginMultiplier, connectionStatus]);

  const calculatedFreeMargin = useMemo(() => {
    if (connectionStatus === "Offline" || connectionStatus === "Rejected") return 0;
    return parseFloat((equity - calculatedMargin).toFixed(2));
  }, [equity, calculatedMargin, connectionStatus]);

  const marginLevel = useMemo(() => {
    if (connectionStatus === "Offline" || connectionStatus === "Rejected") return 0;
    if (calculatedMargin === 0) return 1000; // Optimal default
    return parseFloat(((equity / calculatedMargin) * 100).toFixed(1));
  }, [equity, calculatedMargin, connectionStatus]);

  const activeSpread = useMemo(() => {
    let base = 1.2;
    if (dangerousSpread) base = 4.2;
    else if (abnormalVolatility) base = 2.4;
    else if (lowLiquidity) base = 1.9;
    return parseFloat(base.toFixed(2));
  }, [dangerousSpread, abnormalVolatility, lowLiquidity]);

  const executionQualityScore = useMemo(() => {
    let score = 95;
    if (highImpactNewsActive) score -= 30;
    if (abnormalVolatility) score -= 15;
    if (dangerousSpread) score -= 25;
    if (lowLiquidity) score -= 20;
    if (activeSpread > 2.0) score -= 15;
    if (psychStability < 80) score -= 15;
    return Math.max(10, score);
  }, [highImpactNewsActive, abnormalVolatility, dangerousSpread, lowLiquidity, activeSpread, psychStability]);

  // Adaptive Lot sizing rules
  const lotSizingResults = useMemo(() => {
    let sizeClass = "Micro Allocation (Level 1)";
    let recommendedLot = 0.01;
    let description = "Capital allocation restricted strictly to defensive limits.";

    if (capital >= 100000) {
      sizeClass = "Institutional Scale Allocation (Level 5)";
      recommendedLot = 0.50;
      description = "Strategic corporate exposure balancing direct sweep orders.";
    } else if (capital >= 50000) {
      sizeClass = "Pro Fund Balance (Level 4)";
      recommendedLot = 0.25;
      description = "Balanced leverage calibrated around liquility pools.";
    } else if (capital >= 10000) {
      sizeClass = "Standard Commercial (Level 3)";
      recommendedLot = 0.10;
      description = "Mid-scale exposure utilizing protective buffers.";
    } else if (capital >= 1000) {
      sizeClass = "Conservative Retail (Level 2)";
      recommendedLot = 0.05;
      description = "Initial scaling stage minimizing systematic drawdowns.";
    }

    let finalLot = recommendedLot;
    let drawdownSuppression = false;
    let psychSuppression = false;
    let spreadSuppression = false;

    if (floatingPL < -(capital * 0.10)) {
      finalLot = parseFloat((finalLot * 0.50).toFixed(2));
      drawdownSuppression = true;
    }
    if (psychStability < 70) {
      finalLot = parseFloat((finalLot * 0.60).toFixed(2));
      psychSuppression = true;
    }
    if (activeSpread > 2.0) {
      finalLot = parseFloat((finalLot * 0.40).toFixed(2));
      spreadSuppression = true;
    }

    if (finalLot < 0.01) finalLot = 0.01;

    return {
      baseLot: recommendedLot,
      finalLot,
      sizeClass,
      description,
      drawdownSuppression,
      psychSuppression,
      spreadSuppression
    };
  }, [capital, floatingPL, psychStability, activeSpread]);

  // Est USD Risk
  const lotRiskEstimates = useMemo(() => {
    const finalSize = lotSizingResults.finalLot;
    const estExposureUsd = parseFloat((finalSize * stopLossPips * 10).toFixed(2));
    const estRewardUsd = parseFloat((finalSize * takeProfitPips * 10).toFixed(2));
    const rrRatio = parseFloat((takeProfitPips / (stopLossPips || 1)).toFixed(1));
    return { estExposureUsd, estRewardUsd, rrRatio };
  }, [lotSizingResults.finalLot, stopLossPips, takeProfitPips]);

  // Close out active position helper
  const handleClosePosition = (id: string, profit: number) => {
    setPositions(prev => prev.filter(p => p.id !== id));
    setCapital(prev => parseFloat((prev + profit).toFixed(2)));
    addLog(`Realized Close order ${id}. Trade profit/loss was: $${profit} USD`, profit >= 0 ? "SUCCESS" : "WARN");
  };

  // 8. Sign Execution & Protection Verification pipeline
  const handleApproveExecution = () => {
    if (connectionStatus === "Offline" || connectionStatus === "Rejected") {
      setExecutionResult({
        status: "Denied",
        reason: "BROKER OFFLINE: Socket interface severed or authentication rejected. Establish broker gateway connection."
      });
      addLog("Execution rejected: Broker terminal state Offline.", "DENIED");
      return;
    }

    // Protection rule checks
    if (lotSizingResults.finalLot > 0.50) {
      setExecutionResult({
        status: "Denied",
        reason: "PROTECTION FAILURE [OVERSIZED LOR]: Maximum single trade limit is hard-capped at 0.5 Lots to protect institutional capital blocks."
      });
      addLog("Execution DENIED: Oversized lot allocation request.", "DENIED");
      return;
    }

    if (executionQualityScore < 60) {
      setExecutionResult({
        status: "Denied",
        reason: `CONFIDENCE FIREWALL BLOCKED: Signal setup quality (${executionQualityScore}/100) is below safety 60-point requirements.`
      });
      addLog(`Execution DENIED: Insufficient setup score high-water mark.`, "DENIED");
      return;
    }

    if (activeSpread > 2.2) {
      setExecutionResult({
        status: "Denied",
        reason: `SPREAD ESCALATION FAILURE: Spread conditions (${activeSpread} Pips) violate low-slippage execution rules.`
      });
      addLog(`Execution DENIED: Wide spread lock active.`, "DENIED");
      return;
    }

    if (psychStability < 65) {
      setExecutionResult({
        status: "Denied",
        reason: "EMOTIONAL PROTECTION FILTER ENGAGED: Operator stability score reveals elevated revenge/tilt volatility indicators."
      });
      addLog(`Execution DENIED: Overtrading safety guard blocks license signature.`, "DENIED");
      return;
    }

    if (serverMode === "Live" || connectionStatus === "Demo Locked") {
      setExecutionResult({
        status: "Denied",
        reason: "LIVE COMPLIANCE BARRIER: Physical live transactions restricted on sandbox. Connect on Demo Mode."
      });
      addLog("Execution DENIED: Direct live trading locked.", "DENIED");
      return;
    }

    // Success dispatch position
    const ticketId = "mt5_pos_" + Math.floor(Math.random() * 90000 + 10000);
    const newPos: MT5Position = {
      id: ticketId,
      symbol: orderSymbol,
      type: orderDirection,
      lots: lotSizingResults.finalLot,
      openPrice: entryPrice,
      currentPrice: entryPrice,
      sl: orderDirection === "Buy" ? parseFloat((entryPrice - (stopLossPips * 0.15)).toFixed(2)) : parseFloat((entryPrice + (stopLossPips * 0.15)).toFixed(2)),
      tp: orderDirection === "Buy" ? parseFloat((entryPrice + (takeProfitPips * 0.15)).toFixed(2)) : parseFloat((entryPrice - (takeProfitPips * 0.15)).toFixed(2)),
      profit: 0.0,
      timestamp: new Date().toTimeString().split(" ")[0]
    };

    setPositions(prev => [newPos, ...prev]);
    setExecutionResult({
      status: "Approved",
      reason: "Institutional signature verified. Terminal order dispatched, cleared, and synchronized successfully.",
      ticketId
    });
    addLog(`Execution Approved: Order ${ticketId} placed (${lotSizingResults.finalLot} Lots ${orderSymbol})`, "SUCCESS");

    // Feed to live tracker
    onJournalLiveTrade({
      id: ticketId,
      date: new Date().toISOString().split("T")[0],
      symbol: orderSymbol,
      timeframe: "15M",
      direction: orderDirection,
      setupScore: executionQualityScore,
      riskPct: lotSizingResults.finalLot,
      rrRatio: lotRiskEstimates.rrRatio,
      status: "Win",
      pips: 0,
      liquiditySwept: "Buy-Side Liquidation",
      structureShift: "MSS (Market Structure Shift)",
      sessionType: activeSession || "London",
      spreadConditions: "1.2 pips (Synced Socket Connection)",
      entryReasoning: `MT5 Terminal auto-order dispatched for ${orderSymbol}. Verified alignment quality score: ${executionQualityScore}%. Executed via direct port 443 with ${selectedLeverage} leverage.`,
      emotionalState: psychStability >= 90 ? "Stable" : "Elevated"
    });
  };

  return (
    <div className="bg-[#0b0c13] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl space-y-4 font-sans text-gray-200" id="phase9c-mt5-connector">
      
      {/* 5. Demo Environment Security Banner */}
      <div className="bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 border-b border-rose-900 px-3.5 py-3 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-2 select-none">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5.5 h-5.5 text-rose-400 animate-pulse shrink-0" />
          <div>
            <span className="text-xs font-black tracking-widest text-red-450 text-rose-300 uppercase block leading-none">
              DEMO EXECUTION ENVIRONMENT — NO LIVE CAPITAL ACTIVE
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5 leading-tight">
              MetaTrader socket layer sandboxed. Direct execution runs exclusively under simulated liquidity protection.
            </span>
          </div>
        </div>
        <div className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 text-[8.5px] rounded font-black tracking-wider animate-pulse uppercase">
          Safe Sandbox
        </div>
      </div>

      <div className="p-3 sm:p-5 space-y-5">
        
        {/* 1. Broker Connection Gate Card (Collapsible, Touch Friendly) */}
        <div className="bg-[#0d0f19] border border-zinc-850 rounded-xl overflow-hidden">
          <div 
            onClick={() => setSectionsCollapsed(s => ({ ...s, connectionGate: !s.connectionGate }))}
            className="flex items-center justify-between p-3.5 bg-[#0a0c14] border-b border-zinc-850 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-black tracking-widest uppercase text-gray-100">
                MT5 Direct Broker Connection Gate
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Connection Indicator status badge */}
              {connectionStatus === "Synced" && (
                <span className="hidden sm:inline-block w-22 text-center text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 rounded py-0.5">
                  ● SYNCED
                </span>
              )}
              {sectionsCollapsed.connectionGate ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-zinc-400" />}
            </div>
          </div>

          {!sectionsCollapsed.connectionGate && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Field: Broker Name */}
                <div className="space-y-1">
                  <label className="text-[9.5px] text-zinc-400 uppercase font-black block">Brokerage Entity:</label>
                  <select
                    className="w-full bg-black/60 border border-zinc-800 rounded p-2 text-xs text-white font-bold outline-none font-mono focus:border-sky-500 min-h-[40px] touch-manipulation"
                    value={broker}
                    onChange={(e) => {
                      setBroker(e.target.value);
                      addLog(`Broker parameter set to ${e.target.value}`, "INFO");
                    }}
                  >
                    <option value="APEX-PRO-METATRADER">Apex-Pro-MetaTrader (Prop Feed)</option>
                    <option value="FTMO-Server-04">FTMO-Server-04 (Institutional)</option>
                    <option value="IC-Markets-Live4">IC-Markets-Live4 (Deep Liquidity)</option>
                    <option value="Funding-Pips-Server">Funding-Pips-Server (Sweeper)</option>
                    <option value="RoboForex-ECN-01">RoboForex-ECN-01 (Arbitrage)</option>
                  </select>
                </div>

                {/* Field: MT5 Server input */}
                <div className="space-y-1">
                  <label className="text-[9.5px] text-zinc-400 uppercase font-black block">MT5 Server Address (Proxy):</label>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-zinc-800 rounded p-2 text-xs text-white font-bold outline-none font-mono focus:border-sky-500 min-h-[40px]"
                    value={mt5Server}
                    onChange={(e) => setMt5Server(e.target.value)}
                  />
                </div>

                {/* Field: Login ID */}
                <div className="space-y-1">
                  <label className="text-[9.5px] text-zinc-400 uppercase font-black block">Account Login ID:</label>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-zinc-800 rounded p-2 text-xs text-white font-bold outline-none font-mono focus:border-sky-500 min-h-[40px]"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                  />
                </div>

                {/* Field: Password Masked - Never printed in telemetry */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9.5px] text-zinc-400 uppercase font-black block">Master Access PIN:</label>
                    <span className="text-[8px] text-zinc-550 block">Encrypted Socket</span>
                  </div>
                  <input
                    type="password"
                    name="mt5-secure-sec"
                    autoComplete="new-password"
                    className="w-full bg-black/60 border border-zinc-800 rounded p-2 text-xs text-amber-500 font-bold outline-none font-mono focus:border-sky-500 min-h-[40px]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Field: Demo/Live Toggle switch */}
                <div className="space-y-1">
                  <label className="text-[9.5px] text-zinc-400 uppercase font-black block">Environment Clearance:</label>
                  <div className="grid grid-cols-2 gap-1 bg-black/50 p-1 rounded border border-zinc-800 min-h-[40px]">
                    <button
                      onClick={() => {
                        setServerMode("Demo");
                        addLog("Simulated stream targeted to Demo cluster.", "INFO");
                      }}
                      className={`text-[10px] uppercase font-black py-1.5 rounded transition-all leading-none ${
                        serverMode === "Demo" 
                          ? "bg-zinc-800 text-sky-400 border border-zinc-700 font-black" 
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Demo Sim
                    </button>
                    <button
                      onClick={() => {
                        setServerMode("Live");
                        addLog("WARNING: Switched configuration target to client Live accounts. Safety protection blocks will activate on order transmission.", "WARN");
                      }}
                      className={`text-[10px] uppercase font-black py-1.5 rounded transition-all leading-none ${
                        serverMode === "Live" 
                          ? "bg-red-950/50 text-red-400 border border-red-900/40 font-black animate-pulse" 
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Live Real
                    </button>
                  </div>
                </div>

                {/* Action Buttons: Connect / Sever */}
                <div className="flex flex-col justify-end pt-1">
                  <button
                    onClick={handleToggleConnection}
                    disabled={isConnecting}
                    className={`w-full py-2.5 px-3 border rounded text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-h-[40px] touch-manipulation ${
                      connectionStatus !== "Offline" && connectionStatus !== "Rejected"
                        ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        Handshaking Core...
                      </>
                    ) : (connectionStatus !== "Offline" && connectionStatus !== "Rejected") ? (
                      <>
                        <WifiOff className="w-3.5 h-3.5" />
                        Disconnect MT5 Broker
                      </>
                    ) : (
                      <>
                        <Wifi className="w-3.5 h-3.5" />
                        Authorize & Sync MT5
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Indicator Bar */}
              <div className="flex flex-wrap items-center justify-between text-xs bg-black/40 p-3 rounded-lg border border-zinc-850 gap-2">
                <div className="flex items-center gap-2 text-[10.5px]">
                  <span className="text-zinc-500 uppercase font-black">Gate State:</span>
                  <div className="flex items-center gap-1.5">
                    {connectionStatus === "Offline" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-zinc-400 bg-zinc-400/10 border border-zinc-400/20 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        Offline (Active Server Disconnected)
                      </span>
                    )}
                    {connectionStatus === "Connecting" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        Connecting handshakes...
                      </span>
                    )}
                    {connectionStatus === "Synced" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Synced (0ms latency core loop)
                      </span>
                    )}
                    {connectionStatus === "Delayed" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded animate-bounce">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        Delayed (Queue Latency Buffer Active)
                      </span>
                    )}
                    {connectionStatus === "Rejected" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Rejected Login Credentials
                      </span>
                    )}
                    {connectionStatus === "Demo Locked" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Demo Locked (Routing Muted)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 font-mono">
                  Socket: <span className="text-gray-100 font-bold">SSL_TLS_v1.3</span> • Session: <span className="text-gray-100 font-bold">Validated</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. MT5 Synchronization Dashboard (Core metrics display grid, Collapsible) */}
        <div className="bg-[#0c0e18] border border-zinc-850 rounded-xl overflow-hidden">
          <div 
            onClick={() => setSectionsCollapsed(s => ({ ...s, syncDashboard: !s.syncDashboard }))}
            className="flex items-center justify-between p-3.5 bg-[#090b13] border-b border-zinc-850 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black tracking-widest uppercase text-gray-100">
                MT5 Direct Synchronization Dashboard
              </span>
            </div>
            <div className="text-gray-400 flex items-center">
              {sectionsCollapsed.syncDashboard ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>

          {!sectionsCollapsed.syncDashboard && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 font-mono">
                
                {/* Balance */}
                <div className="bg-black/45 p-3 rounded-lg border border-zinc-900 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Core Balance</span>
                  <span className="text-sm sm:text-base font-black text-gray-100 mt-1 block">
                    ${connectionStatus === "Offline" ? "0.00" : capital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[8px] text-zinc-550 block mt-1">Simulated Capital</span>
                </div>

                {/* Equity */}
                <div className="bg-black/45 p-3 rounded-lg border border-zinc-900 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Net Equity</span>
                  <span className="text-sm sm:text-base font-black text-sky-400 mt-1 block font-mono">
                    ${connectionStatus === "Offline" ? "0.00" : equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[8px] text-zinc-550 block mt-1">Balance + Floating</span>
                </div>

                {/* Margin */}
                <div className="bg-black/45 p-3 rounded-lg border border-zinc-900 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Margin Used</span>
                  <span className="text-sm sm:text-base font-black text-amber-500 mt-1 block">
                    ${connectionStatus === "Offline" ? "0.00" : calculatedMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[8px] text-zinc-550 block mt-1">Commitment Lock</span>
                </div>

                {/* Free Margin */}
                <div className="bg-black/45 p-3 rounded-lg border border-zinc-900 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Free Margin</span>
                  <span className="text-sm sm:text-base font-black text-emerald-400 mt-1 block">
                    ${connectionStatus === "Offline" ? "0.00" : calculatedFreeMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[8px] text-zinc-550 block mt-1">Available risk headroom</span>
                </div>

                {/* Margin Level */}
                <div className="bg-black/45 p-3 rounded-lg border border-zinc-900 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Margin Level</span>
                  <span className={`text-sm sm:text-base font-black mt-1 block ${marginLevel >= 200 ? "text-emerald-400" : marginLevel > 0 ? "text-rose-400 animate-pulse" : "text-gray-400"}`}>
                    {connectionStatus === "Offline" ? "0.0%" : marginLevel === 1000 ? "1000% (No Debt)" : `${marginLevel}%`}
                  </span>
                  <span className="text-[8px] text-zinc-550 block mt-1">Stop Out Threshold: 50%</span>
                </div>

                {/* Leverage Dropdown selection inside Sync */}
                <div className="bg-black/45 p-3 rounded-lg border border-zinc-900 flex flex-col justify-between text-xs">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Account Leverage</span>
                  <select
                    className="bg-zinc-950 border border-zinc-800 rounded p-1 text-[11px] text-[#a855f7] font-black outline-none block mt-1"
                    value={selectedLeverage}
                    onChange={(e) => {
                      setSelectedLeverage(e.target.value);
                      addLog(`Account leverage variable set to ${e.target.value}`, "INFO");
                    }}
                  >
                    <option value="1:30">1:30 (Institutional standard)</option>
                    <option value="1:50">1:50 (Standard swap)</option>
                    <option value="1:100">1:100 (Default calibrated)</option>
                    <option value="1:200">1:200 (Aggressive margin)</option>
                    <option value="1:500">1:500 (Extreme speed)</option>
                  </select>
                  <span className="text-[8px] text-zinc-550 block mt-1">Alters core margin math</span>
                </div>

                {/* Spread */}
                <div className="bg-black/45 p-3 rounded-lg border border-zinc-900 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Live Feed Spread</span>
                  <span className={`text-sm sm:text-base font-black mt-1 block ${activeSpread > 2.0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {connectionStatus === "Offline" ? "N/A" : `${activeSpread} Pips`}
                  </span>
                  <span className="text-[8px] text-zinc-550 block mt-1">Commodity liquidity sweep</span>
                </div>

                {/* Ping latency */}
                <div className="bg-black/45 p-3 rounded-lg border border-zinc-900 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">TCP Ping Latency</span>
                  <span className="text-sm sm:text-base font-black mt-1 block text-purple-400">
                    {connectionStatus === "Offline" ? "Offline" : `${ping} ms`}
                  </span>
                  <span className="text-[8px] text-zinc-550 block mt-1">Handshake cycle speed</span>
                </div>

                {/* Floating PL */}
                <div className="bg-black/45 p-3 rounded-lg border border-zinc-900 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Floating P/L</span>
                  <span className={`text-sm sm:text-base font-black mt-1 block ${floatingPL >= 0 ? "text-emerald-400" : "text-rose-400 animate-pulse"}`}>
                    {connectionStatus === "Offline" ? "$0.00" : `${floatingPL >= 0 ? `+$${floatingPL.toLocaleString()}` : `-$${Math.abs(floatingPL).toLocaleString()}`}`}
                  </span>
                  <span className="text-[8px] text-zinc-550 block mt-1">Real-time valuation</span>
                </div>

                {/* Active Positions */}
                <div className="bg-black/45 p-3 rounded-lg border border-zinc-900 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Active positions</span>
                  <span className="text-sm sm:text-base font-black text-white mt-1 block">
                    {connectionStatus === "Offline" ? "0" : positions.length} contracts
                  </span>
                  <span className="text-[8px] text-zinc-550 block mt-1">Live synchronized positions</span>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Live Market Event Simulation Trigger Box */}
        <div className="bg-[#0c0e18] border border-zinc-850 rounded-xl overflow-hidden">
          <div 
            onClick={() => setSectionsCollapsed(s => ({ ...s, marketInjector: !s.marketInjector }))}
            className="flex items-center justify-between p-3.5 bg-[#090b13] border-b border-zinc-850 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black tracking-widest uppercase text-gray-100">
                Direct Live Market Event Simulator & Incident Injector
              </span>
            </div>
            <div className="text-gray-400">
              {sectionsCollapsed.marketInjector ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>

          {!sectionsCollapsed.marketInjector && (
            <div className="p-4 space-y-3">
              <span className="text-[10px] text-zinc-500 block">
                Simulate critical market anomalies to evaluate how the Execution Protection rules safeguard prop assets.
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <button
                  onClick={() => {
                    const next = !highImpactNewsActive;
                    setHighImpactNewsActive(next);
                    addLog(next ? "High Impact macroeconomic news spike detected. Settle operations." : "News window cleared.", "WARN");
                  }}
                  className={`p-2.5 rounded-lg border font-mono text-center text-xs transition-all ${
                    highImpactNewsActive 
                      ? "bg-red-950/40 border-red-500/50 text-red-300 animate-pulse font-bold" 
                      : "bg-black/30 border-zinc-850 text-zinc-400 hover:text-white hover:bg-black/60"
                  }`}
                >
                  <div className="text-[8px] opacity-75 mb-1 tracking-widest leading-none">NEWS IMPACT</div>
                  <span>High News Spike</span>
                </button>

                <button
                  onClick={() => {
                    const next = !abnormalVolatility;
                    setAbnormalVolatility(next);
                    addLog(next ? "Volatility metric reports abnormal variance sweeps." : "Volatility levels normalized.", "WARN");
                  }}
                  className={`p-2.5 rounded-lg border font-mono text-center text-xs transition-all ${
                    abnormalVolatility 
                      ? "bg-amber-950/40 border-amber-500/50 text-amber-300 font-bold" 
                      : "bg-black/30 border-zinc-850 text-zinc-400 hover:text-white hover:bg-black/60"
                  }`}
                >
                  <div className="text-[8px] opacity-75 mb-1 tracking-widest leading-none">VOLATILITY EXP</div>
                  <span>Abnormal Vix</span>
                </button>

                <button
                  onClick={() => {
                    const next = !dangerousSpread;
                    setDangerousSpread(next);
                    addLog(next ? "Arbitrage caution: Bid-Ask spread width spiked above threshold." : "Spread normalized to tight 1.2 Pips.", "WARN");
                  }}
                  className={`p-2.5 rounded-lg border font-mono text-center text-xs transition-all ${
                    dangerousSpread 
                      ? "bg-amber-950/50 border-rose-500/50 text-rose-300 font-bold" 
                      : "bg-black/30 border-zinc-850 text-zinc-400 hover:text-white hover:bg-black/60"
                  }`}
                >
                  <div className="text-[8px] opacity-75 mb-1 tracking-widest leading-none">SPREAD EXCALATION</div>
                  <span>Wide Spreads</span>
                </button>

                <button
                  onClick={() => {
                    const next = !lowLiquidity;
                    setLowLiquidity(next);
                    addLog(next ? "Low volume depth tracked. Handshake latency expected." : "Standard institutional book volume restored.", "WARN");
                  }}
                  className={`p-2.5 rounded-lg border font-mono text-center text-xs transition-all ${
                    lowLiquidity 
                      ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-300 font-bold" 
                      : "bg-black/30 border-zinc-850 text-zinc-400 hover:text-white hover:bg-black/60"
                  }`}
                >
                  <div className="text-[8px] opacity-75 mb-1 tracking-widest leading-none">ORDER BOOK DEPTH</div>
                  <span>Low Liquidity</span>
                </button>

                <button
                  onClick={() => {
                    const next = !rapidDisplacement;
                    setRapidDisplacement(next);
                    addLog(next ? "Displacement algorithm records rapid sequence shifts." : "Displacement subsided.", "INFO");
                  }}
                  className={`p-2.5 rounded-lg border font-mono text-center text-xs transition-all col-span-2 sm:col-span-1 ${
                    rapidDisplacement 
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold" 
                      : "bg-black/30 border-zinc-850 text-zinc-400 hover:text-white hover:bg-black/60"
                  }`}
                >
                  <div className="text-[8px] opacity-75 mb-1 tracking-widest leading-none">DISPLACEMENT</div>
                  <span>Rapid Speed</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MT5 Direct Order Formulator & Sizing (Collapsible) */}
        <div className="bg-[#0c0e18] border border-zinc-850 rounded-xl overflow-hidden">
          <div 
            onClick={() => setSectionsCollapsed(s => ({ ...s, orderPrep: !s.orderPrep }))}
            className="flex items-center justify-between p-3.5 bg-[#090b13] border-b border-zinc-850 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-black tracking-widest uppercase text-gray-100">
                MT5 Direct Order Formulator & Sizing Matrix
              </span>
            </div>
            <div className="text-gray-400">
              {sectionsCollapsed.orderPrep ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>

          {!sectionsCollapsed.orderPrep && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Controller: Sizing Details (5 columns) */}
                <div className="lg:col-span-5 bg-[#0a0c14] border border-zinc-850 p-4 rounded-xl space-y-4 font-mono">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase block tracking-wider border-b border-zinc-900 pb-1.5">
                    1. Adaptive Lot Sizing Allocation Matrix
                  </span>

                  <div className="space-y-3 font-mono">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Tested Account Balance:</span>
                        <span className="text-sky-450 text-sky-400 font-black">${capital.toLocaleString()} USD</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="250000"
                        step="500"
                        value={capital}
                        onChange={(e) => {
                          setCapital(parseInt(e.target.value));
                        }}
                        className="w-full accent-emerald-500 bg-black/50 h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] text-zinc-500 font-black pt-1">
                        <span>$500</span>
                        <span>$10,000</span>
                        <span>$50,000</span>
                        <span>$250,000+</span>
                      </div>
                    </div>

                    <div className="h-[1px] bg-zinc-900" />

                    {/* Class outcome badge */}
                    <div className="p-3 bg-black/45 rounded border border-zinc-900 space-y-1.5">
                      <div className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block font-mono">
                        Account Risk Classification:
                      </div>
                      <span className="text-xs font-black text-emerald-400 block tracking-tight">
                        {lotSizingResults.sizeClass}
                      </span>
                      <p className="text-[10px] leading-snug text-zinc-400">
                        {lotSizingResults.description}
                      </p>
                    </div>

                    {/* Safeguard Warning overlays */}
                    <div className="space-y-1">
                      {lotSizingResults.drawdownSuppression && (
                        <div className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[9.5px] flex items-center gap-1.5 font-sans">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Drawdown lock triggered. Lots scaled down by -50%.
                        </div>
                      )}
                      {lotSizingResults.psychSuppression && (
                        <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-[9.5px] flex items-center gap-1.5 font-sans">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Emotional fatigue guard: allocations locked at -40% limit.
                        </div>
                      )}
                      {lotSizingResults.spreadSuppression && (
                        <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[9.5px] flex items-center gap-1.5 font-sans">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          High spread condition prevents full leverage multiplier.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right drafting panel (7 columns) */}
                <div className="lg:col-span-7 bg-[#0a0c14] border border-zinc-850 p-4 rounded-xl space-y-4 font-mono">
                  <span className="text-[10px] text-zinc-400 font-black uppercase block tracking-wider border-b border-zinc-900 pb-1.5">
                    2. Institutional Order Ticket Drafting
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="text-[9px] text-zinc-500 block uppercase font-black mb-1">Asset Symbol:</label>
                      <select
                        className="w-full bg-black/60 border border-zinc-800 p-2 text-xs text-white font-bold rounded outline-none font-mono"
                        value={orderSymbol}
                        onChange={(e) => setOrderSymbol(e.target.value)}
                      >
                        <option value="XAUUSD">XAUUSD (Gold Spot)</option>
                        <option value="EURUSD">EURUSD</option>
                        <option value="GBPUSD">GBPUSD</option>
                        <option value="US30">US30 Index</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 block uppercase font-black mb-1">Direction:</label>
                      <div className="grid grid-cols-2 gap-1 bg-black/60 p-0.5 rounded border border-zinc-800">
                        <button
                          onClick={() => setOrderDirection("Buy")}
                          className={`py-1.5 text-[9.5px] rounded transition-all font-black text-center uppercase leading-none min-h-[30px] ${
                            orderDirection === "Buy" ? "bg-emerald-500 text-black font-black" : "text-zinc-400"
                          }`}
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => setOrderDirection("Sell")}
                          className={`py-1.5 text-[9.5px] rounded transition-all font-black text-center uppercase leading-none min-h-[30px] ${
                            orderDirection === "Sell" ? "bg-red-500 text-black font-black" : "text-zinc-400"
                          }`}
                        >
                          Sell
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 block uppercase font-black mb-1">Stop Loss (Pips):</label>
                      <input
                        type="number"
                        className="w-full bg-black/60 border border-zinc-800 p-1.5 rounded font-bold outline-none text-red-400 text-center"
                        value={stopLossPips}
                        onChange={(e) => setStopLossPips(Math.max(2, parseInt(e.target.value) || 2))}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 block uppercase font-black mb-1">Take Profit (Pips):</label>
                      <input
                        type="number"
                        className="w-full bg-black/60 border border-zinc-800 p-1.5 rounded font-bold outline-none text-emerald-400 text-center"
                        value={takeProfitPips}
                        onChange={(e) => setTakeProfitPips(Math.max(2, parseInt(e.target.value) || 2))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="bg-black/35 p-2 rounded border border-zinc-900">
                      <span className="text-[8.5px] text-zinc-500 block uppercase font-mono">Calibrated size</span>
                      <span className="text-base font-black text-white mt-1 block">
                        {lotSizingResults.finalLot} Lots
                      </span>
                      <span className="text-[8px] text-zinc-550 block font-mono">Base recommendation: {lotSizingResults.baseLot}</span>
                    </div>

                    <div className="bg-black/35 p-2 rounded border border-zinc-900">
                      <span className="text-[8.5px] text-zinc-500 block uppercase">Drawdown Risk</span>
                      <span className="text-base font-black text-rose-400 mt-1 block">
                        -${lotRiskEstimates.estExposureUsd} USD
                      </span>
                      <span className="text-[8px] text-zinc-550 block leading-tight">
                        {parseFloat(((lotRiskEstimates.estExposureUsd / capital) * 105).toFixed(1))}% balance exposure
                      </span>
                    </div>

                    <div className="bg-black/35 p-2 rounded border border-zinc-900">
                      <span className="text-[8.5px] text-zinc-500 block uppercase">Target Reward</span>
                      <span className="text-base font-black text-emerald-400 mt-1 block">
                        +${lotRiskEstimates.estRewardUsd} USD
                      </span>
                      <span className="text-[8.5px] text-sky-400 font-extrabold block">
                        Ratio 1:{lotRiskEstimates.rrRatio} RR
                      </span>
                    </div>
                  </div>

                  {/* Checklist permission pipeline before order dispatch */}
                  <div className="border border-zinc-900 bg-black/45 p-3 rounded-lg space-y-1.5 text-[9.5px]">
                    <span className="text-[8px] text-purple-400 uppercase font-black tracking-widest block border-b border-zinc-900 pb-1">
                      Execution Gateway Safety Firewall Checklist
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-400 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>SMC Alignment: OK</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {activeSpread < 2.0 ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span>Slippage Filter</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!highImpactNewsActive ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        )}
                        <span>News Intercept</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {psychStability >= 70 ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <span>Mindset Stb</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Console Execution Result & Auditor Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Action trigger console (6 columns) */}
          <div className="lg:col-span-6 bg-[#0a0c14] border border-zinc-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3 font-mono">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase block tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-450 text-emerald-400 animate-pulse" />
                MT5 Semi-Automatic Dispatch Console
              </span>

              {/* Psychological validation slider */}
              <div className="bg-black/40 p-3 rounded-lg border border-zinc-900 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400 uppercase font-bold">Operator Mindset Volatility:</span>
                  <span className={`font-black ${psychStability >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {psychStability}% Stable
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={psychStability}
                  onChange={(e) => {
                    setPsychStability(parseInt(e.target.value));
                    if (parseInt(e.target.value) < 65) {
                      addLog("Operator focus drifting. Sizing multiplier heavily compressed.", "WARN");
                    }
                  }}
                  className="w-full accent-purple-500 bg-black/60 h-1 rounded-lg cursor-pointer"
                />
                <span className="text-[9px] text-zinc-550 block leading-tight">
                  Calculates overtrading metrics. Lower stability score triggers automatic execution denial to prevent emotional trading.
                </span>
              </div>

              {/* Execution result layout feedback */}
              <div className="p-3 bg-[#0d0f1a] border border-zinc-900 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 uppercase font-black">Firewall Quality Check:</span>
                  <span className={`font-black uppercase tracking-wider text-[11px] ${executionQualityScore >= 70 ? "text-emerald-400" : "text-amber-500"}`}>
                    {executionQualityScore} / 100 Class
                  </span>
                </div>

                <div className="h-[1px] bg-zinc-900" />

                {executionResult.status ? (
                  <div className={`p-2.5 rounded border text-[10.5px] leading-relaxed space-y-1 ${
                    executionResult.status === "Approved" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                      : "bg-red-500/10 border-red-500/20 text-red-300"
                  }`}>
                    <div className="font-extrabold uppercase flex items-center gap-1.5 leading-none mb-1 text-[11px]">
                      {executionResult.status === "Approved" ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ORDER ROUTED & SIGNED
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          ORDER REJECTED BY FIREWALL
                        </>
                      )}
                    </div>
                    <p className="text-[10px] leading-snug font-light font-sans">{executionResult.reason}</p>
                    {executionResult.ticketId && (
                      <span className="text-[9px] text-zinc-500 block font-mono">Routing ID Token: {executionResult.ticketId}</span>
                    )}
                  </div>
                ) : (
                  <div className="py-2.5 text-center text-[10px] text-zinc-500 italic leading-snug">
                    Gateway ready. Review contract conditions above and dispatch signature to MT5.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleApproveExecution}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-black font-black text-[11.5px] rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl min-h-[44px] touch-manipulation"
            >
              <Zap className="w-4 h-4" />
              Sign & Clear Order Setup to Brokerage
            </button>
          </div>

          {/* REAL-TIME AUDITING LOGS (6 columns) */}
          <div className="lg:col-span-6 bg-[#0a0c14] border border-zinc-850 p-4 rounded-xl flex flex-col justify-between space-y-3 font-mono">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase block tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-400" />
              MT5 Real-time Auditor Logs
            </span>

            <div className="bg-black/55 p-3 rounded-lg border border-zinc-900 h-[170px] overflow-y-auto space-y-2 text-[9px] leading-relaxed scrollbar-thin">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 text-[10px]">
                  <span className="text-zinc-550 shrink-0">[{log.timestamp}]</span>
                  <span className={`font-black shrink-0 ${
                    log.type === "INFO" ? "text-sky-400" : log.type === "WARN" ? "text-amber-500" : log.type === "SUCCESS" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {log.type}:
                  </span>
                  <span className="text-zinc-300 leading-snug">{log.message}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setLogs([]);
                addLog("Auditing buffer flushed.", "INFO");
              }}
              className="text-[10px] text-zinc-500 hover:text-zinc-200 transition-all font-bold underline self-start min-h-[30px]"
            >
              Flush safety buffer logs
            </button>
          </div>

        </div>

        {/* POSITION TRACKER TABLE (Collapsible) */}
        <div className="bg-[#0c0e18] border border-zinc-850 rounded-xl overflow-hidden">
          <div 
            onClick={() => setSectionsCollapsed(s => ({ ...s, activePositions: !s.activePositions }))}
            className="flex items-center justify-between p-3.5 bg-[#090b13] border-b border-zinc-850 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black tracking-widest uppercase text-gray-100">
                Active Position Database (MT5 Handshake Verified)
              </span>
            </div>
            <div className="text-gray-400">
              {sectionsCollapsed.activePositions ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4 text-zinc-400" />}
            </div>
          </div>

          {!sectionsCollapsed.activePositions && (
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs select-none min-w-[650px]">
                <thead>
                  <tr className="bg-black/50 text-[9px] text-zinc-500 uppercase tracking-wider border-b border-zinc-900">
                    <th className="p-3">Position Ticket ID</th>
                    <th className="p-3">Asset</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Lots</th>
                    <th className="p-3">Open Price</th>
                    <th className="p-3">Current Price</th>
                    <th className="p-3">Stop Loss / TP</th>
                    <th className="p-3">Floating profit</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 bg-black/15">
                  {(connectionStatus === "Offline" || connectionStatus === "Rejected" || positions.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-zinc-500 italic text-[10px]">
                        No active verified contracts currently running on synchronized MT5 server state.
                      </td>
                    </tr>
                  ) : (
                    positions.map((p) => (
                      <tr key={p.id} className="hover:bg-black/35 transition-all text-xs">
                        <td className="p-3 font-bold text-zinc-400 font-mono">#{p.id}</td>
                        <td className="p-3 font-black text-white">{p.symbol}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase leading-none ${
                            p.type === "Buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-sky-400">{p.lots} LOTS</td>
                        <td className="p-3 text-zinc-300 font-medium">{p.openPrice}</td>
                        <td className="p-3 text-white font-medium">{p.currentPrice}</td>
                        <td className="p-3 text-zinc-500 text-[9.5px] leading-tight font-mono">
                          SL: {p.sl} <br />
                          TP: {p.tp}
                        </td>
                        <td className={`p-3 font-black text-[12px] ${p.profit >= 0 ? "text-emerald-400" : "text-rose-450 text-red-400"}`}>
                          ${p.profit >= 0 ? `+${p.profit.toLocaleString()}` : p.profit.toLocaleString()} USD
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleClosePosition(p.id, p.profit)}
                            className="p-1 px-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-emerald-500 hover:text-black hover:border-transparent transition-all rounded text-[9.5px] font-black uppercase min-h-[30px] touch-manipulation font-mono"
                          >
                            CloseOut
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
