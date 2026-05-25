import { useState, useEffect } from "react";
import { 
  Shield, 
  Settings, 
  HelpCircle, 
  TrendingUp, 
  LayoutGrid, 
  Cpu, 
  LineChart, 
  ListTodo,
  Sparkles,
  Info
} from "lucide-react";
import SMCVisualChart from "./components/SMCVisualChart";
import SetupScorer from "./components/SetupScorer";
import PythonCompiler from "./components/PythonCompiler";
import LearningMemory from "./components/LearningMemory";
import SMCLivePipeline from "./components/SMCLivePipeline";
import SMCReplayBacktester from "./components/SMCReplayBacktester";
import MT5BridgeTerminal from "./components/MT5BridgeTerminal";
import CloudDatabaseTerminal from "./components/CloudDatabaseTerminal";
import ModularRefactorConsole from "./components/ModularRefactorConsole";
import QuantResearchConsole from "./components/QuantResearchConsole";
import { SMCTradeSetup, JournaledTrade } from "./types";
import MasterAIDecisionSummary from "./components/MasterAIDecisionSummary";
import SessionIntelligence from "./components/SessionIntelligence";

const initialTrades: JournaledTrade[] = [
  {
    id: "1",
    date: "2026-05-20",
    symbol: "XAUUSD",
    timeframe: "15M",
    direction: "Sell",
    setupScore: 92,
    riskPct: 1,
    rrRatio: 4.5,
    status: "Win",
    pips: 90,
    liquiditySwept: "Buy-Side",
    structureShift: "CHoCH (Change of Character)",
    sessionType: "London (Kill Zone)"
  },
  {
    id: "2",
    date: "2026-05-21",
    symbol: "XAUUSD",
    timeframe: "15M",
    direction: "Buy",
    setupScore: 88,
    riskPct: 1,
    rrRatio: 3.0,
    status: "Loss",
    pips: 20,
    liquiditySwept: "Sell-Side",
    structureShift: "MSS (Market Structure Shift)",
    sessionType: "New York"
  },
  {
    id: "3",
    date: "2026-05-22",
    symbol: "XAUUSD",
    timeframe: "1H",
    direction: "Buy",
    setupScore: 40,
    riskPct: 2,
    rrRatio: 1.5,
    status: "Loss",
    pips: 30,
    liquiditySwept: "None",
    structureShift: "None",
    sessionType: "Asia"
  },
  {
    id: "4",
    date: "2026-05-23",
    symbol: "XAUUSD",
    timeframe: "15M",
    direction: "Buy",
    setupScore: 95,
    riskPct: 1,
    rrRatio: 5.0,
    status: "Win",
    pips: 100,
    liquiditySwept: "Sell-Side",
    structureShift: "CHoCH (Change of Character)",
    sessionType: "New York"
  }
];

export default function App() {
  const [setup, setSetup] = useState<SMCTradeSetup>({
    symbol: "XAUUSD",
    timeframe: "15M",
    direction: "Buy",
    liquiditySwept: "Sell-Side",
    structureShift: "CHoCH (Change of Character)",
    displacement: true,
    fairValueGapMatched: "Yes (Discount Area)",
    sessionType: "London (Kill Zone)",
    riskPercentage: 1.0,
    multiplierScore: 90,
    notes: "High probability accumulation sweep under Asian Session lows. Standard institutional momentum displacement observed. Calibrated for 1:4 risk-to-reward ratio."
  });

  const [trades, setTrades] = useState<JournaledTrade[]>(() => {
    const saved = localStorage.getItem("apex_stored_trades_db");
    return saved ? JSON.parse(saved) : initialTrades;
  });

  useEffect(() => {
    localStorage.setItem("apex_stored_trades_db", JSON.stringify(trades));
  }, [trades]);

  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [liveTelemetry, setLiveTelemetry] = useState({
    marketState: "Trending" as any,
    livePrice: 2330.2,
    confidenceScore: 82,
    bias: "Bullish" as any,
    activeSession: "London Open Killzone",
    executionStatus: "AUTHORIZED" as any,
    reasonSummary: "High probability stop hunt sweep detected on Sell-Side. Wick quality extreme is HQ.",
    spreadPips: 1.2,
    cooldownSecondsRemaining: 0,
    tradesThisSession: 1
  });

  const handleUpdateSetup = (updated: Partial<SMCTradeSetup>) => {
    setSetup((prev) => ({ ...prev, ...updated }));
  };

  const handleTriggerPreset = (config: {
    liquiditySwept: any;
    structureShift: any;
    fairValueGapMatched: any;
    sessionType: any;
    direction: any;
    notes: string;
    multiplierScore: number;
  }) => {
    setSetup((prev) => ({
      ...prev,
      ...config
    }));
  };

  const handleSaveJournal = (activeSetup: SMCTradeSetup, rating: string) => {
    const isWin = rating.includes("+") || rating === "A" || Math.random() > 0.45; // Smart simulation helper
    const calculatedPips = isWin ? Math.round(30 + Math.random() * 60) : 15;
    
    const journalRecord: JournaledTrade = {
      id: "journal_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      symbol: activeSetup.symbol,
      timeframe: activeSetup.timeframe,
      direction: activeSetup.direction,
      setupScore: activeSetup.multiplierScore,
      riskPct: activeSetup.riskPercentage,
      rrRatio: isWin ? 3.5 : 1.0,
      status: isWin ? "Win" : "Loss",
      pips: calculatedPips,
      liquiditySwept: activeSetup.liquiditySwept,
      structureShift: activeSetup.structureShift,
      sessionType: activeSetup.sessionType
    };

    setTrades((prev) => [journalRecord, ...prev]);
  };

  const handleClearTradeLog = () => {
    setTrades([]);
  };

  const handleSeedLogs = () => {
    setTrades(initialTrades);
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-gray-100 p-3 sm:p-6 font-sans antialiased selection:bg-emerald-500/30 selection:text-white pb-16">
      
      {/* Dynamic Header container */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between border-b border-gray-900 pb-5 mb-6 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-1 px-1.5 bg-gradient-to-br from-emerald-500 to-sky-500 rounded text-black font-black text-xs font-mono tracking-widest uppercase">
              APEX SMC
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase font-mono bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              Systems Architect
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-mono">
            Smart Money Concepts (SMC) Systems Engineer • Multi-Engine Framework Core
          </p>
        </div>

        {/* Informational dashboard stats */}
        <div className="flex bg-[#11131a] p-2 hover:border-gray-800 rounded-lg border border-gray-900 shadow-lg text-xs font-mono gap-5 self-start md:self-auto select-none">
          <div>
            <span className="text-[9px] text-gray-500 block leading-none">VIRTUAL SIM ENGINE</span>
            <span className="text-emerald-400 font-bold uppercase mt-1 block">Active (3000)</span>
          </div>
          <div className="h-7 w-[1px] bg-gray-800" />
          <div>
            <span className="text-[9px] text-gray-500 block leading-none">TARGET ALLOCATION</span>
            <span className="text-[#38bdf8] font-bold mt-1 block">$50,000 Corporate Funded</span>
          </div>
          <div className="h-7 w-[1px] bg-gray-800" />
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="text-gray-400 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1 self-center"
          >
            <Info className="w-3.5 h-3.5 text-purple-400" />
            Blueprint Guide
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto space-y-6">

        {/* Dynamic AI decision summary and Session feedback top row grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <MasterAIDecisionSummary telemetry={liveTelemetry} />
          </div>
          <div className="lg:col-span-4">
            <SessionIntelligence activeSession={liveTelemetry.activeSession} />
          </div>
        </div>
        
        {/* Dynamic Architectural Blueprint Guide (Toggled Area) */}
        {showGuide && (
          <div className="bg-[#0b0c13] border border-gray-800 p-4 rounded-xl relative overflow-hidden" id="architecture-guide">
            <div className="absolute top-0 right-0 p-3">
              <button 
                onClick={() => setShowGuide(false)}
                className="text-[10px] font-mono p-1 bg-[#151928] rounded hover:bg-gray-800 text-gray-450 hover:text-white transition-all"
              >
                Hide [x]
              </button>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500/10 to-amber-500/20 text-yellow-400 rounded-lg border border-yellow-500/15">
                <Shield className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1 max-w-4xl">
                <span className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1.5">
                  Institutional Rule-Based Core Safety Spec
                </span>
                <p className="text-xs text-gray-350 leading-relaxed font-mono">
                  Standard retail algorithms blow accounts because they trade every minor bounce. Institutional terminals protect boundaries until a hard sweep purges standard stops.
                  Below, view your automated system: evaluate the active Gold feed, replay historic conditions with diagnostic snapshots, and calculate mathematically precise allocations.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 text-[10px] text-gray-500 font-mono font-medium">
                  <div>1. LIQUIDITY ENGINE [Purge scan]</div>
                  <div>• 2. STRUCTURE DETECTOR [BOS/MSS]</div>
                  <div>• 3. SESSION SCHEDULER [Killzones]</div>
                  <div>• 4. LOT SIZING CARD [Capital Risk]</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: INSTUTIONAL LIVE PIPELINE CONSOLE (Engines 8 to 13) */}
        <section id="live-pipeline-section" className="transition-all">
          <SMCLivePipeline 
            onInjectSetup={handleTriggerPreset}
            onJournalLiveTrade={(newTrade) => setTrades((prev) => [newTrade, ...prev])}
            onTelemetryUpdate={setLiveTelemetry}
          />
        </section>

        {/* PHASE 5: LIVE MARKET INFRASTRUCTURE & MT5 BRIDGE ARCHITECTURE */}
        <section id="mt5-bridge-section" className="transition-all">
          <MT5BridgeTerminal 
            onJournalLiveTrade={(newTrade) => setTrades((prev) => [newTrade, ...prev])}
            activeSession={liveTelemetry.activeSession}
          />
        </section>

        {/* PHASE 3: SYSTEM VALIDATION & PERFORMANCE TRACKER (Engines 14 to 20) */}
        <section id="validation-replay-section" className="transition-all">
          <SMCReplayBacktester 
            tradesList={trades}
            onJournalLiveTrade={(newTrade) => setTrades((prev) => [newTrade, ...prev])}
          />
        </section>

        {/* PHASE 6: PERSISTENT INTELLIGENCE MEMORY & CLOUD DATA ARCHITECTURE */}
        <section id="cloud-database-section" className="transition-all">
          <CloudDatabaseTerminal 
            trades={trades}
            onUpdateTradesList={setTrades}
          />
        </section>

        {/* PHASE 7: EXECUTION LOGIC VALIDATION, MODULAR REFACTOR, AND INSTITUTIONAL STABILITY LAYER */}
        <section id="modular-refactor-section" className="transition-all">
          <ModularRefactorConsole />
        </section>

        {/* PHASE 8: INSTITUTIONAL QUANT RESEARCH, HISTORICAL PATTERN INTELLIGENCE, AND STRATEGY VALIDATION LAYER */}
        <section id="quant-research-section" className="transition-all">
          <QuantResearchConsole />
        </section>

        {/* SECTION 1: SMC Live SVG Sandbox & Presets */}
        <section id="visualization-section" className="transition-all">
          <SMCVisualChart 
            liquiditySwept={setup.liquiditySwept}
            structureShift={setup.structureShift}
            fairValueGapMatched={setup.fairValueGapMatched}
            sessionType={setup.sessionType}
            direction={setup.direction}
            onTriggerPreset={handleTriggerPreset}
          />
        </section>

        {/* SECTION 2: Rule Builder, Local Scorer, Position Risk Sizing, AI Auditor */}
        <section id="formulator-section" className="transition-all">
          <SetupScorer 
            setup={setup}
            onUpdateSetup={handleUpdateSetup}
            onSaveJournal={handleSaveJournal}
          />
        </section>

        {/* SECTION 3: Bottom side-by-side: Python Compiler & Learning History */}
        <section id="utilities-section" className="grid grid-cols-1 xl:grid-cols-2 gap-6 transition-all">
          {/* Compiler */}
          <PythonCompiler />

          {/* Metric journal memory */}
          <LearningMemory 
            trades={trades}
            onAddTrade={(t) => setTrades([t, ...trades])}
            onClearTradeLog={handleClearTradeLog}
            onSeedLogs={handleSeedLogs}
          />
        </section>

      </main>

      {/* Humble professional design footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-gray-900 text-center text-[10px] font-mono text-gray-500 select-none">
        <div>SMC Algorithmic Framework Core • Version 1.1 • Port binding configured [3000]</div>
        <div className="mt-1">Wait Patiently • Attack High Probability • Save Capital First • Compound Slowly</div>
      </footer>
    </div>
  );
}
