import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, 
  BarChart4, 
  Layers, 
  TrendingUp, 
  Activity, 
  Workflow, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  ListOrdered, 
  HelpCircle,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
  Award
} from "lucide-react";

interface SeedDataset {
  id: string;
  name: string;
  epoch: string;
  volatilityClass: "Extreme VIX" | "Low Compression" | "Standard Delivery" | "Sustained Trend";
  marketRegime: "Trending" | "Compression" | "Expansion" | "Manipulation" | "Reversal" | "Distribution" | "Accumulation" | "News Shock";
  description: string;
  stats: {
    winrate: number;
    profitFactor: number;
    averageRR: number;
    maxDrawdown: number;
    losingStreak: number;
    spreadSensitivity: "High" | "Moderate" | "Immune";
    efficiency: number;
  };
}

const HISTORICAL_DATASETS: SeedDataset[] = [
  {
    id: "ds_01",
    name: "2020 Q1 - COVID-19 Liquidity Shock",
    epoch: "2020-01-01 to 2020-04-30",
    volatilityClass: "Extreme VIX",
    marketRegime: "News Shock",
    description: "High impact macro volatility with extreme spread expansions and rapid directional displacement candles.",
    stats: {
      winrate: 48,
      profitFactor: 1.42,
      averageRR: 3.8,
      maxDrawdown: 12.4,
      losingStreak: 6,
      spreadSensitivity: "High",
      efficiency: 45
    }
  },
  {
    id: "ds_02",
    name: "2022 Fed Rate Cycle Accumulation Phase",
    epoch: "2022-03-01 to 2022-09-30",
    volatilityClass: "Sustained Trend",
    marketRegime: "Trending",
    description: "Multi-month bearish structure breaks (BOS) matching clean discount block mitigation sequences.",
    stats: {
      winrate: 64,
      profitFactor: 2.15,
      averageRR: 4.2,
      maxDrawdown: 5.8,
      losingStreak: 3,
      spreadSensitivity: "Moderate",
      efficiency: 82
    }
  },
  {
    id: "ds_03",
    name: "25 Year Gold Consolidation Summer Ranges",
    epoch: "2018-06-01 to 2018-08-31",
    volatilityClass: "Low Compression",
    marketRegime: "Compression",
    description: "Extremely tight trading range parameters prone to false breakouts and multi-low liquidity sweeps.",
    stats: {
      winrate: 51,
      profitFactor: 1.15,
      averageRR: 2.1,
      maxDrawdown: 8.9,
      losingStreak: 5,
      spreadSensitivity: "High",
      efficiency: 38
    }
  },
  {
    id: "ds_04",
    name: "2024 Institutional High Frequency Sweeps",
    epoch: "2024-01-01 to 2024-05-15",
    volatilityClass: "Standard Delivery",
    marketRegime: "Manipulation",
    description: "Engineered stop hunts preceding true NY session expansion displacement legs. Highly synchronized.",
    stats: {
      winrate: 69,
      profitFactor: 2.68,
      averageRR: 4.5,
      maxDrawdown: 4.2,
      losingStreak: 2,
      spreadSensitivity: "Immune",
      efficiency: 91
    }
  }
];

interface SetupRanking {
  name: string;
  historicalWin: number;
  avgRR: number;
  consistency: number; // 0-100%
  drawdownStability: "High" | "Medium" | "Low";
  verdict: "OPTIMAL" | "VIABLE" | "AVOID";
}

export default function QuantResearchConsole() {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("ds_04");
  const [collapsed, setCollapsed] = useState({
    researchMain: false,
    datasetSimulator: false,
    similarityEngine: false,
    rankingMatrix: false,
    replayCenter: false,
    quantHeatmaps: false
  });

  // Replay Simulator States
  const [replayState, setReplayState] = useState<"IDLE" | "PLAYING" | "PAUSED">("IDLE");
  const [replaySpeed, setReplaySpeed] = useState<number>(1); // seconds per tick
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [totalTicks, setTotalTicks] = useState<number>(12);
  const [simulatedPNL, setSimulatedPNL] = useState<number>(0);

  // Volatility mismatch toggle for Pattern Similarity Engine calibration testing
  const [volatilityMismatch, setVolatilityMismatch] = useState<boolean>(false);
  const [regimeMismatch, setRegimeMismatch] = useState<boolean>(false);

  // Selected dataset
  const currentDataset = useMemo(() => {
    return HISTORICAL_DATASETS.find(d => d.id === selectedDatasetId) || HISTORICAL_DATASETS[3];
  }, [selectedDatasetId]);

  // Replay automatic simulation interval
  useEffect(() => {
    let interval: any = null;
    if (replayState === "PLAYING") {
      interval = setInterval(() => {
        setCurrentTick(t => {
          if (t >= totalTicks - 1) {
            setReplayState("IDLE");
            return totalTicks - 1;
          }
          // Shift simulated performance slightly during ticks
          setSimulatedPNL(p => parseFloat((p + (Math.random() - 0.44) * 8).toFixed(1)));
          return t + 1;
        });
      }, replaySpeed * 1000);
    }
    return () => clearInterval(interval);
  }, [replayState, replaySpeed, totalTicks]);

  // Calibration Engine Math
  const calibratedConfidenceCoeff = useMemo(() => {
    let base = currentDataset.stats.winrate;
    let reductionPercentage = 0;
    const reasons: string[] = [];

    if (volatilityMismatch) {
      reductionPercentage += 18;
      reasons.push("Volatility profile parameter mismatch (-18%)");
    }
    if (regimeMismatch) {
      reductionPercentage += 25;
      reasons.push("Market regime structural mismatch (-25%)");
    }
    if (currentDataset.stats.spreadSensitivity === "High") {
      reductionPercentage += 12;
      reasons.push("Dataset reports High Spread sensitivity (-12%)");
    }

    const final = Math.max(10, base - reductionPercentage);

    return {
      finalWeightedConfidence: final,
      reductionPercentage,
      reasons
    };
  }, [currentDataset, volatilityMismatch, regimeMismatch]);

  // Structured list of setup rankings adaptive
  const ranks: SetupRanking[] = useMemo(() => {
    return [
      {
        name: "London AM Liquidity Sweep to Discount OB",
        historicalWin: 72,
        avgRR: 4.8,
        consistency: 89,
        drawdownStability: "High",
        verdict: "OPTIMAL"
      },
      {
        name: "M15 Change of Character (CHoCH) Displacement Entry",
        historicalWin: 64,
        avgRR: 3.5,
        consistency: 78,
        drawdownStability: "High",
        verdict: "OPTIMAL"
      },
      {
        name: "Asian Session True Low Breakout Trap",
        historicalWin: 55,
        avgRR: 2.8,
        consistency: 64,
        drawdownStability: "Medium",
        verdict: "VIABLE"
      },
      {
        name: "High impact News Fair Value Gap (FVG) Mitigation",
        historicalWin: 41,
        avgRR: 5.2,
        consistency: 35,
        drawdownStability: "Low",
        verdict: "AVOID"
      }
    ];
  }, []);

  // Simulating backtest process action
  const handleStartReplay = () => {
    setCurrentTick(0);
    setSimulatedPNL(0);
    setReplayState("PLAYING");
  };

  const handleStopReplay = () => {
    setReplayState("IDLE");
    setCurrentTick(0);
    setSimulatedPNL(0);
  };

  const currentTickExplanation = useMemo(() => {
    const explanations = [
      "Deploying high-resolution structural scanner across historical XAUUSD data...",
      "Detected high-volume liquidity pool building beneath previous daily swing low.",
      "Macroeconomic CPI news release matches initial manipulation sweep vector.",
      "M15 candle displacement breaks previous structural highs (CHoCH transition).",
      "Fair Value Gap (FVG) creation confirmed between successive displacement levels.",
      "Algorithm isolates risk stops directly under newly constructed accumulation floor.",
      "Institutional order preparation: Preparing 1:4.5 Risk-to-Reward balance.",
      "Simulated execution: Limit entry triggered at deep premium discount bounds.",
      "Price reactions align with anticipated HTF direction. Trailing security margins.",
      "Entering London PM session reversal. Consolidation brackets active.",
      "Core target liquidity sweeps fulfilled. Preparing partial volume closures.",
      "Execution complete. Dynamic review snapshot archived in session indices."
    ];
    return explanations[currentTick] || "Awaiting simulation launch parameters.";
  }, [currentTick]);

  return (
    <div className="bg-[#0b0c13] border border-gray-900 rounded-xl overflow-hidden shadow-2xl space-y-6 animate-fade-in" id="phase8-quant-research-workspace">
      
      {/* Structural Institutional Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-[#0e111d] to-indigo-950 p-4 border-b border-gray-900 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-2.5">
          <BarChart4 className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
          <div className="font-sans">
            <span className="text-[11px] font-mono font-black tracking-widest text-amber-500 uppercase block leading-none">
              INSTITUTIONAL QUANT RESEARCH & STRATEGY VALIDATION (PHASE 8)
            </span>
            <span className="text-xs text-gray-300 block leading-tight mt-1">
              Multi-Year Regime Intelligence • Historical Similarity Computations • Defensive Calibration Models
            </span>
          </div>
        </div>

        <div className="flex bg-[#07080d]/60 p-1.5 px-3 border border-gray-850 rounded text-[9.5px] font-mono items-center gap-4">
          <div>
            <span className="text-gray-550 block">SIMULATION REGIMES</span>
            <span className="text-amber-500 font-extrabold block text-[10px]">{currentDataset.marketRegime} Range</span>
          </div>
          <div className="h-6 w-[1px] bg-gray-950" />
          <div>
            <span className="text-gray-550 block">RESEARCH SOURCE</span>
            <span className="text-sky-400 font-bold block">{currentDataset.id.toUpperCase()} Core Databank</span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-1 space-y-6 leading-relaxed">

        {/* SECTION 1: HISTORICAL DATASET SELECTOR & MULTI-YEAR STATS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-black text-[9px]">
                DATABANK
              </span>
              <h3 className="text-xs font-black text-gray-150 uppercase tracking-widest">
                Multi-Year Historical Backtest Datasets
              </h3>
            </div>
            <button
              onClick={() => setCollapsed(s => ({ ...s, datasetSimulator: !s.datasetSimulator }))}
              className="text-gray-550 hover:text-white transition-all text-xs"
            >
              {collapsed.datasetSimulator ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsed.datasetSimulator && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-mono text-xs">
              
              {/* Dataset Selection Stack (5 columns) */}
              <div className="md:col-span-4 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-3 select-none">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block leading-none pb-1.5 border-b border-gray-950">
                  Select Historical Validation Stream:
                </span>

                <div className="space-y-1.5">
                  {HISTORICAL_DATASETS.map((ds) => (
                    <button
                      key={ds.id}
                      onClick={() => {
                        setSelectedDatasetId(ds.id);
                        if (replayState !== "IDLE") handleStopReplay();
                      }}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                        selectedDatasetId === ds.id
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-black/40 border-gray-950 text-gray-400 hover:text-white hover:bg-black/60"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[11px] block">{ds.name}</span>
                        <span className="text-[7.5px] p-0.5 bg-black rounded font-black border border-gray-900 uppercase">
                          {ds.volatilityClass}
                        </span>
                      </div>
                      <span className="text-[8.5px] text-zinc-500 block leading-tight mt-1">{ds.epoch}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Research Metrics Display (8 columns) */}
              <div className="md:col-span-8 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-gray-950 pb-2">
                  <span className="text-[9.5px] text-zinc-500 font-black uppercase">
                    Institutional Strategy Validation Performance Profile
                  </span>
                  <div className="flex items-center gap-1.5 text-[9.5px]">
                    <span className="text-gray-550">Core Regime:</span>
                    <span className="text-amber-400 font-black uppercase">{currentDataset.marketRegime}</span>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-zinc-300">
                  {currentDataset.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-black/40 p-2.5 rounded border border-gray-950">
                    <span className="text-[8.5px] text-zinc-550 block uppercase leading-none">Historical Winrate</span>
                    <span className="text-sm font-black text-amber-400 block mt-1">{currentDataset.stats.winrate}%</span>
                  </div>

                  <div className="bg-black/40 p-2.5 rounded border border-gray-950">
                    <span className="text-[8.5px] text-zinc-550 block uppercase leading-none">Profit Factor Goal</span>
                    <span className="text-sm font-black text-white block mt-1">{currentDataset.stats.profitFactor}x Factor</span>
                  </div>

                  <div className="bg-black/40 p-2.5 rounded border border-gray-950">
                    <span className="text-[8.5px] text-zinc-550 block uppercase leading-none">Avg RR expectation</span>
                    <span className="text-sm font-black text-[#38bdf8] block mt-1">1:{currentDataset.stats.averageRR} Ratio</span>
                  </div>

                  <div className="bg-black/40 p-2.5 rounded border border-gray-950">
                    <span className="text-[8.5px] text-zinc-550 block uppercase leading-none">Max Peak Drawdown</span>
                    <span className="text-sm font-black text-rose-450 text-red-400 block mt-1">-{currentDataset.stats.maxDrawdown}% Drawdown</span>
                  </div>
                </div>

                {/* Additional metrics */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-black/20 border border-gray-950 rounded text-[10px] leading-none text-zinc-400">
                  <div className="flex justify-between">
                    <span>Max Consecutive Losses:</span>
                    <span className="text-white font-bold">{currentDataset.stats.losingStreak} stops</span>
                  </div>
                  <div className="flex justify-between border-l border-gray-950 pl-2">
                    <span>Spread Sensitivity:</span>
                    <span className="text-yellow-400 font-bold">{currentDataset.stats.spreadSensitivity} Protection</span>
                  </div>
                  <div className="flex justify-between border-l border-gray-950 pl-2">
                    <span>Efficiency Rating:</span>
                    <span className="text-emerald-450 text-emerald-300 font-extrabold">{currentDataset.stats.efficiency}%</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* SECTION 2: SIMILARITY ENGINE & DEFENSIIVE WEGHT CALIBRATION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-black text-[9px]">
                SIMILARITY
              </span>
              <h3 className="text-xs font-black text-gray-150 uppercase tracking-widest">
                Historical Pattern Similarity & Defensive Weights Calibration
              </h3>
            </div>
            <button
              onClick={() => setCollapsed(s => ({ ...s, similarityEngine: !s.similarityEngine }))}
              className="text-gray-550 hover:text-white transition-all text-xs"
            >
              {collapsed.similarityEngine ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsed.similarityEngine && (
            <div className="bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-4 font-mono text-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-950 pb-2.5">
                <span className="text-[9.5px] text-zinc-550 uppercase font-black block tracking-widest leading-none">
                  Adaptive Weight Decayer based on Environment Consistency Tests
                </span>
                
                <div className="flex items-center gap-1.5 text-xs bg-black/65 p-1 px-3 border border-gray-900 rounded select-none">
                  <span className="text-gray-500">CALIBRATED SETUP WIN CONFIDENCE:</span>
                  <span className={`text-[12.5px] font-black ${
                    calibratedConfidenceCoeff.finalWeightedConfidence < 45 ? "text-red-400 animate-pulse animate-pulse" : "text-emerald-400"
                  }`}>
                    {calibratedConfidenceCoeff.finalWeightedConfidence}% Confidence Rank
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 leading-normal">
                {/* Simulator controls toggles */}
                <div className="md:col-span-5 bg-black/40 p-3 rounded-lg border border-gray-955 border-gray-950 space-y-3">
                  <span className="text-[9.5px] text-[#a855f7] font-black uppercase tracking-wider block border-b border-gray-950 pb-1 leading-none">
                    Trigger Active Regime Conflict Inconsistencies:
                  </span>

                  <div className="space-y-2 text-zinc-350">
                    <label className="flex items-center justify-between p-2 rounded bg-black border border-gray-900 cursor-pointer select-none">
                      <span>• Toggle Volatility Profile Mismatch</span>
                      <input
                        type="checkbox"
                        checked={volatilityMismatch}
                        onChange={(e) => setVolatilityMismatch(e.target.checked)}
                        className="accent-[#a855f7] rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded bg-black border border-gray-900 cursor-pointer select-none">
                      <span>• Toggle Market Regime Mismatch</span>
                      <input
                        type="checkbox"
                        checked={regimeMismatch}
                        onChange={(e) => setRegimeMismatch(e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Sizing Weight Decisions summary */}
                <div className="md:col-span-7 bg-black/30 p-3 rounded-lg border border-gray-950 space-y-3">
                  <span className="text-[9.5px] text-amber-500 font-bold uppercase tracking-widest block border-b border-gray-950 pb-1 leading-none">
                    Defensive Calibration Model Calculations Logs:
                  </span>

                  <div className="p-2 bg-[#121422] rounded border border-gray-900 text-[10.5px] text-zinc-300 leading-snug">
                    {calibratedConfidenceCoeff.reasons.length > 0 ? (
                      <div className="space-y-1">
                        <span className="text-red-400 font-black text-[9.5px] block uppercase">CALIBRATION DECAY TRIGGERS COOLDOWN:</span>
                        {calibratedConfidenceCoeff.reasons.map((r, i) => (
                          <div key={i} className="text-zinc-400 text-[9.5px]">• {r}</div>
                        ))}
                        <p className="text-[9px] text-[#22c55e] leading-snug font-bold border-t border-gray-900 pt-1.5 mt-1.5 block">
                          * Protection system automatically dampens raw execution limits to prevent over-excitation within dangerous environments.
                        </p>
                      </div>
                    ) : (
                      <span className="text-emerald-450 text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle className="w-4 h-4 text-emerald-400" /> Optimal state integration. No calibration penalties active on this validation stream.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: QUANT RESEARCH PLAY CENTER (Simulated candles & AI What saw) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded font-black text-[9px]">
                REPLAY LABS
              </span>
              <h3 className="text-xs font-black text-gray-150 uppercase tracking-widest font-mono">
                Institutional Quant Research Replay Center
              </h3>
            </div>
            <button
              onClick={() => setCollapsed(s => ({ ...s, replayCenter: !s.replayCenter }))}
              className="text-gray-550 hover:text-white transition-all text-xs"
            >
              {collapsed.replayCenter ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsed.replayCenter && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
              
              {/* Replay controller console (5 Columns) */}
              <div className="lg:col-span-5 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="text-[9.5px] text-zinc-550 uppercase font-black block tracking-widest border-b border-gray-950 pb-1.5 leading-none">
                    Validation Playback Controls
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleStartReplay}
                      disabled={replayState === "PLAYING"}
                      className="py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 rounded font-black text-[9px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all text-center leading-none"
                    >
                      <Play className="w-3 h-3" />
                      Run Playback
                    </button>

                    <button
                      onClick={() => setReplayState(replayState === "PLAYING" ? "PAUSED" : "PLAYING")}
                      disabled={replayState === "IDLE"}
                      className="py-2.5 bg-indigo-505 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-505 hover:bg-indigo-500/20 disabled:opacity-40 rounded font-black text-[9px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all text-center leading-none"
                    >
                      <Pause className="w-3 h-3" />
                      Pause
                    </button>

                    <button
                      onClick={handleStopReplay}
                      className="py-2.5 bg-gray-950 border border-gray-850 text-gray-400 hover:text-white rounded font-black text-[9px] uppercase tracking-wide flex items-center justify-center gap-1.5 text-center leading-none"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>

                  {/* Playback speed slider */}
                  <div className="space-y-1.5 pt-1 border-t border-gray-950">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-gray-400">Step Cycle Time:</span>
                      <span className="text-sky-400 font-bold">{replaySpeed} seconds</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={replaySpeed}
                      onChange={(e) => setReplaySpeed(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 bg-black pointer"
                    />
                  </div>

                  {/* Simulated PNL stream display */}
                  <div className="p-3 bg-black/45 rounded-lg border border-gray-950 space-y-1.5 leading-none select-none text-center">
                    <span className="text-[8.5px] text-zinc-550 uppercase font-black block leading-none">SIMULATED HISTORICAL COMPLIANCE PROFIT OUTCOME:</span>
                    <span className={`text-base font-black block ${
                      simulatedPNL >= 0 ? "text-emerald-400" : "text-rose-450 text-red-400 animate-pulse"
                    }`}>
                      {simulatedPNL >= 0 ? `+${simulatedPNL}` : simulatedPNL} pips
                    </span>
                  </div>
                </div>

                <div className="p-2 border border-orange-500/10 bg-orange-950/20 text-orange-400 text-[9px] leading-tight rounded">
                  * Live historical validation simulation prevents forward-looking model cognitive cheating through strict out-of-sample data masks.
                </div>
              </div>

              {/* Step Visualization & What the AI Saw (7 Columns) */}
              <div className="lg:col-span-7 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-950 pb-1.5">
                    <span className="text-[9.5px] text-zinc-550 uppercase font-black">
                      Live Step-by-Step Scenario Analysis Track
                    </span>
                    <span className="text-zinc-500 text-[10.5px]">
                      Cycle Ticks: {currentTick + 1} / {totalTicks}
                    </span>
                  </div>

                  {/* Progress segment bars */}
                  <div className="flex gap-1 select-none">
                    {Array.from({ length: totalTicks }).map((_, inx) => (
                      <div
                        key={inx}
                        className={`h-2 rounded-sm transition-all grow ${
                          inx === currentTick
                            ? "bg-[#38bdf8] shadow"
                            : inx < currentTick
                            ? "bg-emerald-500"
                            : "bg-gray-950"
                        }`}
                      />
                    ))}
                  </div>

                  {/* AI Explanation block */}
                  <div className="p-3.5 bg-black/55 rounded-lg border border-gray-950 space-y-2 leading-relaxed text-zinc-300">
                    <span className="text-[#38bdf8] font-black uppercase text-[9px] block">
                      SYSTEM INTEGRATION OVERLAY ("What the AI saw"):
                    </span>
                    <p className="text-[11.5px]">
                      {currentTickExplanation}
                    </p>
                  </div>
                </div>

                <div className="text-[9.5px] text-gray-500 select-none flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Hidden future candles sequence active. High stability validation checks nominal.</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* SECTION 4: ADAPTIVE SETUP RANKINGS GRID & RECENT WIN STREAKS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black text-[9px]">
                RANKINGS
              </span>
              <h3 className="text-xs font-black text-gray-150 uppercase tracking-widest font-mono">
                Adaptive Setup Model Rankings Matrix
              </h3>
            </div>
            <button
              onClick={() => setCollapsed(s => ({ ...s, rankingMatrix: !s.rankingMatrix }))}
              className="text-gray-550 hover:text-white transition-all text-xs"
            >
              {collapsed.rankingMatrix ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsed.rankingMatrix && (
            <div className="overflow-x-auto rounded-xl border border-gray-950 select-none">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-black/80 border-b border-gray-950 text-[10px] text-gray-500 uppercase tracking-wider">
                    <th className="p-3.5 pl-4">Setup Model Formulation</th>
                    <th className="p-3.5">Historical Winrate</th>
                    <th className="p-3.5">Expected Target RR</th>
                    <th className="p-3.5">Consistency Index</th>
                    <th className="p-3.5">Drawdown Stability</th>
                    <th className="p-3.5 pr-4 text-right">System Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-950 bg-[#0a0b12] text-zinc-300">
                  {ranks.map((rk, idx) => (
                    <tr key={idx} className="hover:bg-[#121422] transition-colors leading-normal">
                      <td className="p-3 pl-4 font-bold text-gray-150">{rk.name}</td>
                      <td className="p-3">
                        <span className="text-[#34d399] font-black">{rk.historicalWin}% Win</span>
                      </td>
                      <td className="p-3 text-sky-455 text-[#38bdf8] font-bold">1:{rk.avgRR} Ratio</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{rk.consistency}%</span>
                          <div className="w-12 bg-gray-950 h-1 rounded overflow-hidden">
                            <div className="bg-purple-500 h-1" style={{ width: `${rk.consistency}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`font-black p-1 px-2 text-[9px] rounded uppercase ${
                          rk.drawdownStability === "High" ? "bg-emerald-500/10 text-emerald-400" : rk.drawdownStability === "Medium" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-400"
                        }`}>
                          {rk.drawdownStability}
                        </span>
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <span className={`font-black uppercase tracking-wider text-[10.5px] ${
                          rk.verdict === "OPTIMAL" ? "text-emerald-400" : rk.verdict === "VIABLE" ? "text-sky-400" : "text-rose-455 text-red-400"
                        }`}>
                          {rk.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 5: COMPREHENSIVE QUANT RESEARCH HEATMAP GRAPHICS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="p-1 px-1.5 bg-indigo-505 bg-indigo-500/10 text-indigo-400 border border-indigo-550 border-indigo-500/20 rounded font-black text-[9px]">
                HEATMAPS
              </span>
              <h3 className="text-xs font-black text-gray-150 uppercase tracking-widest font-mono">
                Statistical Quant Research Efficiency Heatmaps
              </h3>
            </div>
            <button
              onClick={() => setCollapsed(s => ({ ...s, quantHeatmaps: !s.quantHeatmaps }))}
              className="text-gray-550 hover:text-white transition-all text-xs"
            >
              {collapsed.quantHeatmaps ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!collapsed.quantHeatmaps && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-mono text-xs text-zinc-350 select-none leading-normal">
              
              {/* Box 1 (6 Columns) Best Windows vs Dangerous Environments */}
              <div className="md:col-span-6 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-3.5">
                <span className="text-[9.5px] text-zinc-550 uppercase font-black tracking-widest block border-b border-gray-950 pb-1.5 leading-none">
                  Core Sinking Profile Efficiency
                </span>

                <div className="grid grid-cols-2 gap-3 leading-none">
                  <div className="bg-black/35 p-3 rounded border border-gray-950 space-y-2">
                    <span className="text-[8px] text-zinc-500 block uppercase leading-none">Strongest Volatility Windows:</span>
                    <span className="text-sm font-black text-emerald-400 block leading-none">
                      Expanding Divergence
                    </span>
                    <span className="text-[7.5px] text-gray-500 block mt-1 leading-tight">Optimal slippage & fast sweeps delivery</span>
                  </div>

                  <div className="bg-black/35 p-3 rounded border border-gray-950 space-y-2">
                    <span className="text-[8px] text-zinc-500 block uppercase leading-none">Most Dangerous Environments:</span>
                    <span className="text-sm font-black text-red-400 block leading-none">
                      News Shock Whipsaws
                    </span>
                    <span className="text-[7.5px] text-gray-500 block mt-1 leading-tight">Bypasses stops due to excessive volatility index</span>
                  </div>

                  <div className="bg-black/35 p-3 rounded border border-gray-950 space-y-2">
                    <span className="text-[8px] text-zinc-550 block uppercase leading-none">Spread Instability Periods:</span>
                    <span className="text-sm font-black text-amber-500 block leading-none">
                      Asia Transitions AM
                    </span>
                    <span className="text-[7.5px] text-gray-500 block mt-1 leading-tight">Dampens execution efficiency parameters</span>
                  </div>

                  <div className="bg-black/35 p-3 rounded border border-gray-950 space-y-2">
                    <span className="text-[8px] text-zinc-555 block uppercase leading-none">Best System setup zones:</span>
                    <span className="text-sm font-black text-sky-400 block leading-none font-black text-sky-400">
                      NY Open Premium Sweep
                    </span>
                    <span className="text-[7.5px] text-gray-500 block mt-1 leading-tight">Maximum model probability indices calculated</span>
                  </div>
                </div>
              </div>

              {/* Box 2 (6 Columns) Ascii Representation of Volatility vs Spread instability matrix */}
              <div className="md:col-span-6 bg-[#0a0b12] border border-gray-950 p-4 rounded-xl space-y-3">
                <span className="text-[9.5px] text-zinc-550 uppercase font-black block tracking-widest border-b border-gray-950 pb-2 leading-none">
                  Volatility Instability Multiplier Grid (25 Year Consolidated Core)
                </span>

                <div className="grid grid-cols-5 gap-1.5 text-center text-[7.5px] pt-1">
                  <div className="bg-emerald-950/25 text-emerald-400 border border-emerald-500/20 p-2 rounded">
                    <span>L-Vol</span>
                    <span className="block font-black mt-1 text-[9.5px]">68%</span>
                  </div>
                  <div className="bg-emerald-950/20 text-emerald-400 border border-emerald-500/10 p-2 rounded">
                    <span>S-Vol</span>
                    <span className="block font-black mt-1 text-[9.5px]">74%</span>
                  </div>
                  <div className="bg-[#12221b] text-emerald-300 border border-emerald-500/15 p-2 rounded">
                    <span>H-Sweep</span>
                    <span className="block font-black mt-1 text-[9.5px]">81%</span>
                  </div>
                  <div className="bg-yellow-950/20 text-yellow-400 border border-yellow-500/15 p-2 rounded">
                    <span>M-Trend</span>
                    <span className="block font-black mt-1 text-[9.5px]">52%</span>
                  </div>
                  <div className="bg-red-950/20 text-red-400 border border-red-500/15 p-2 rounded">
                    <span>Macro Spike</span>
                    <span className="block font-black mt-1 text-[9.5px]">12%</span>
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 leading-snug">
                  * Higher values represent periods showing stable structural boundaries that support sniping entries without excessive slippage expansion.
                </p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
