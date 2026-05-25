import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, 
  Layers, 
  TrendingUp, 
  HelpCircle, 
  Play, 
  RefreshCw, 
  Clock, 
  Maximize2 
} from "lucide-react";
import { 
  LiquiditySweptType, 
  StructureShiftType, 
  FairValueGapType, 
  SessionZoneType 
} from "../types";

interface SMCVisualChartProps {
  liquiditySwept: LiquiditySweptType;
  structureShift: StructureShiftType;
  fairValueGapMatched: FairValueGapType;
  sessionType: SessionZoneType;
  direction: "Buy" | "Sell";
  onTriggerPreset: (config: {
    liquiditySwept: LiquiditySweptType;
    structureShift: StructureShiftType;
    fairValueGapMatched: FairValueGapType;
    sessionType: SessionZoneType;
    direction: "Buy" | "Sell";
    notes: string;
    multiplierScore: number;
  }) => void;
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  session?: "Asia" | "London" | "NewYork";
  label?: string;
}

export default function SMCVisualChart({
  liquiditySwept,
  structureShift,
  fairValueGapMatched,
  sessionType,
  direction,
  onTriggerPreset
}: SMCVisualChartProps) {
  const [activeTab, setActiveTab] = useState<"sandbox" | "sessions">("sandbox");
  const [playSweepSimulation, setPlaySweepSimulation] = useState(false);

  // Generate mock candlesticks that dynamically align with SMC properties for visual context
  const candles = useMemo(() => {
    // Standard template of 18 candles for XAUUSD simulation
    const baseCandles: CandleData[] = [
      { time: "05:00", open: 2320, high: 2324, low: 2318, close: 2322, session: "Asia" },
      { time: "06:00", open: 2322, high: 2326, low: 2320, close: 2321, session: "Asia" },
      { time: "07:00", open: 2321, high: 2323, low: 2319, close: 2322, session: "Asia" },
      { time: "08:00", open: 2322, high: 2325, low: 2317, close: 2324, session: "Asia", label: "EQH" },
      { time: "09:00", open: 2324, high: 2326, low: 2321, close: 2323, session: "Asia", label: "EQH" },
      
      // London Open & Liquidity Sweep
      { time: "10:00", open: 2323, high: 2328, low: 2315, close: 2319, session: "London", label: "SSL Hunt" },
      { time: "11:00", open: 2319, high: 2321, low: 2310, close: 2314, session: "London" },
      // Sweep candle (adjustable based on state)
      { 
        time: "12:00", 
        open: 2314, 
        // Wick sweeps low or high based on setup direction
        high: direction === "Buy" ? 2320 : 2332,
        low: direction === "Buy" ? 2305 : 2311,
        close: direction === "Buy" ? 2316 : 2326, 
        session: "London",
        label: "SWEEP wick"
      },
      
      // Market Structure Shift / Displacement
      { 
        time: "13:00", 
        open: direction === "Buy" ? 2316 : 2326, 
        high: direction === "Buy" ? 2335 : 2327, 
        low: direction === "Buy" ? 2315 : 2309, 
        close: direction === "Buy" ? 2332 : 2312, 
        session: "London",
        label: "Displacement"
      },
      { 
        time: "14:00", 
        open: direction === "Buy" ? 2332 : 2312, 
        high: direction === "Buy" ? 2342 : 2315, 
        low: direction === "Buy" ? 2330 : 2298, 
        close: direction === "Buy" ? 2339 : 2302, 
        session: "NewYork",
        label: "Market Shift"
      },
      
      // FVG Retest & NY Killzone
      { 
        time: "15:00", 
        open: direction === "Buy" ? 2339 : 2302, 
        high: direction === "Buy" ? 2341 : 2308, 
        low: direction === "Buy" ? 2322 : 2319, 
        close: direction === "Buy" ? 2324 : 2316, 
        session: "NewYork" 
      },
      { 
        time: "16:00", 
        open: direction === "Buy" ? 2324 : 2316, 
        high: direction === "Buy" ? 2331 : 2324, 
        low: direction === "Buy" ? 2320 : 2315, 
        close: direction === "Buy" ? 2328 : 2321, 
        session: "NewYork",
        label: "Retest Entry" 
      },
      { 
        time: "17:00", 
        open: direction === "Buy" ? 2328 : 2321, 
        high: direction === "Buy" ? 2348 : 2322, 
        low: direction === "Buy" ? 2326 : 2289, 
        close: direction === "Buy" ? 2345 : 2292, 
        session: "NewYork" 
      },
      { 
        time: "18:00", 
        open: direction === "Buy" ? 2345 : 2292, 
        high: direction === "Buy" ? 2355 : 2295, 
        low: direction === "Buy" ? 2342 : 2280, 
        close: direction === "Buy" ? 2352 : 2284, 
        session: "NewYork" 
      }
    ];

    // Alter candles dynamically to match exact settings selected in Sidebar
    return baseCandles.map((c, i) => {
      let modified = { ...c };
      
      // If we sweep Buy-Side (Equal Highs), push London/NY highs to breach and reverse
      if (liquiditySwept === "Buy-Side" && i === 7) {
        modified.high = 2339;
        modified.close = 2322;
        modified.label = "BSL Sweep ⚡";
      }

      // If we sweep Sell-Side, pull lows down
      if (liquiditySwept === "Sell-Side" && i === 7) {
        modified.low = 2302;
        modified.close = 2321;
        modified.label = "SSL Sweep 🛡️";
      }

      // If Equal Highs is active, align high levels for candles 3 and 4
      if (liquiditySwept === "Equal Highs") {
        if (i === 3) { modified.high = 2326; modified.label = "EQH [Limit]"; }
        if (i === 4) { modified.high = 2326; modified.label = "EQH [Limit]"; }
      }

      // CHoCH setup visualizer labels
      if (structureShift !== "None" && i === 9) {
        modified.label = structureShift === "CHoCH (Change of Character)" ? "CHoCH Shift" : "BOS Break";
      }

      return modified;
    });
  }, [liquiditySwept, structureShift, direction]);

  // Scaler helpers for SVG drawing (Custom SVG canvas 700x320)
  const chartWidth = 720;
  const chartHeight = 300;
  const paddingX = 40;
  const paddingY = 30;

  const minVal = 2275;
  const maxVal = 2365;

  const getX = (index: number) => {
    return paddingX + (index * (chartWidth - paddingX * 2) / (candles.length - 1));
  };

  const getY = (val: number) => {
    return chartHeight - paddingY - ((val - minVal) * (chartHeight - paddingY * 2) / (maxVal - minVal));
  };

  // SMC Preset Configurations for Study
  const presets = [
    {
      name: "XAUUSD A+ London Reversal",
      description: "Equal Highs swept during London Killzone, displacement shift, 15M FVG retest.",
      config: {
        liquiditySwept: "Buy-Side" as const,
        structureShift: "CHoCH (Change of Character)" as const,
        fairValueGapMatched: "Yes (Premium Area)" as const,
        sessionType: "London (Kill Zone)" as const,
        direction: "Sell" as const,
        notes: "XAUUSD London Killzone swept yesterday's premium high before collapsing through the internal MSS trigger structure. Fair Value Gap is aligned structurally.",
        multiplierScore: 92
      }
    },
    {
      name: "XAUUSD B-Grade speculative",
      description: "Retesting NY lows without a clear liquidity sweep. Speculative risk.",
      config: {
        liquiditySwept: "None" as const,
        structureShift: "BOS (Break of Structure)" as const,
        fairValueGapMatched: "No" as const,
        sessionType: "New York" as const,
        direction: "Buy" as const,
        notes: "Structure is bullish, but equal lows have not yet been swept. AI usually advises to Avoid or reduce lot sizes to 0.5% here.",
        multiplierScore: 45
      }
    },
    {
      name: "A+ Accumulation Sweep",
      description: "NY Session sweeps Asian lows, violent displacement upwards on 15M gold.",
      config: {
        liquiditySwept: "Sell-Side" as const,
        structureShift: "MSS (Market Structure Shift)" as const,
        fairValueGapMatched: "Yes (Discount Area)" as const,
        sessionType: "New York" as const,
        direction: "Buy" as const,
        notes: "Stunning sell-side liquidity purge beneath multi-day bottoms preceding a massive 15-pip momentum bar. Enter on reclaim of 15M discount FVG.",
        multiplierScore: 95
      }
    }
  ];

  return (
    <div className="bg-[#12141c] border border-gray-800 rounded-xl p-5 shadow-2xl overflow-hidden relative" id="smc-visual-chart-card">
      {/* Decorative Border Glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500" />

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] rounded border border-emerald-500/20 uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sandbox
            </span>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider font-mono">
              Liquidity Mapping & Structure Engine
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-lg">
            Witness how the algorithmic core maps sweeps, session bounds, and breaks of structure before giving trade ratings.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#0a0b10] p-1 rounded-lg border border-gray-800 max-w-fit">
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "sandbox"
                ? "bg-[#1f2334] text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            SMC Sandbox
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "sessions"
                ? "bg-[#1f2334] text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Preset Deep Dives
          </button>
        </div>
      </div>

      {activeTab === "sandbox" ? (
        <div className="space-y-4">
          {/* Main Candlestick Drawing Stage */}
          <div className="relative bg-[#08090d] border border-gray-800 rounded-lg p-3 overflow-x-auto select-none">
            {/* Interactive Overlays / Status text */}
            <div className="absolute top-3 left-3 bg-[#111219]/90 border border-gray-800 p-2 rounded text-[11px] font-mono text-gray-300 z-10 space-y-1 backdrop-blur">
              <div className="text-emerald-400 font-semibold uppercase tracking-wider">
                SMC ALCORE DETECTOR
              </div>
              <div className="flex items-center gap-1">
                <span>Liquidity Sweep:</span>
                <span className={liquiditySwept !== "None" ? "text-amber-400 font-bold" : "text-gray-500"}>
                  {liquiditySwept}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Market Structure:</span>
                <span className={structureShift !== "None" ? "text-sky-400 font-bold" : "text-gray-500"}>
                  {structureShift}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Active Session:</span>
                <span className="text-purple-400 font-bold">{sessionType}</span>
              </div>
            </div>

            {/* Stage Grid Legend */}
            <div className="absolute top-3 right-3 text-[10px] font-mono text-gray-500 space-y-0.5 z-10 text-right">
              <div>Asset: Gold (XAUUSD Spot)</div>
              <div>Leverage Node: 1:100</div>
              <div>Frame: 15MIN Real-time</div>
            </div>

            {/* Canvas Container */}
            <div className="w-[740px] h-[310px]">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-full overflow-visible"
              >
                {/* 1. Draw horizontal gridlines & prices */}
                {[2280, 2300, 2320, 2340, 2360].map((v) => (
                  <g key={v} className="opacity-20">
                    <line 
                      x1={0} 
                      y1={getY(v)} 
                      x2={chartWidth} 
                      y2={getY(v)} 
                      stroke="#4b5563" 
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <text 
                      x={chartWidth - 5} 
                      y={getY(v) + 3} 
                      fill="#9ca3af" 
                      fontSize={9} 
                      fontFamily="monospace" 
                      textAnchor="end"
                    >
                      ${v}
                    </text>
                  </g>
                ))}

                {/* 2. Highlight Session Ranges */}
                {/* Asia Session Box (Candles 0 to 4) */}
                <rect 
                  x={getX(0) - 10} 
                  y={getY(2332)} 
                  width={getX(4) - getX(0) + 20} 
                  height={getY(2315) - getY(2332)} 
                  fill="#38bdf8" 
                  fillOpacity={0.05} 
                  stroke="#38bdf8" 
                  strokeOpacity={0.15}
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                <text x={getX(2)} y={getY(2335)} fill="#38bdf8" fillOpacity={0.5} fontSize={8} fontFamily="monospace" textAnchor="middle">
                  ASIA RANGE
                </text>

                {/* London Killzone (Candles 5 to 8) */}
                <rect 
                  x={getX(5) - 10} 
                  y={getY(2346)} 
                  width={getX(8) - getX(5) + 20} 
                  height={getY(2304) - getY(2346)} 
                  fill="#a855f7" 
                  fillOpacity={0.06} 
                  stroke="#a855f7" 
                  strokeOpacity={0.2}
                  strokeWidth={1.5}
                />
                <text x={getX(6.5)} y={getY(2348)} fill="#a855f7" fillOpacity={0.6} fontSize={8} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  LONDON KILLZONE
                </text>

                {/* NY Session (Candles 9 to 13) */}
                <rect 
                  x={getX(9) - 10} 
                  y={getY(2360)} 
                  width={getX(13) - getX(9) + 20} 
                  height={getY(2280) - getY(2360)} 
                  fill="#eab308" 
                  fillOpacity={0.04} 
                  stroke="#eab308" 
                  strokeOpacity={0.15}
                  strokeDasharray="2 2"
                />
                <text x={getX(11)} y={getY(2362)} fill="#eab308" fillOpacity={0.5} fontSize={8} fontFamily="monospace" textAnchor="middle">
                  NEW YORK SESSION
                </text>

                {/* 3. Equal Highs / Lows Marks */}
                {liquiditySwept === "Equal Highs" && (
                  <g>
                    {/* Equal highs dotted line */}
                    <line 
                      x1={getX(2)} 
                      y1={getY(2326)} 
                      x2={getX(5)} 
                      y2={getY(2326)} 
                      stroke="#fbbf24" 
                      strokeWidth={1.5} 
                      strokeDasharray="3 3"
                    />
                    <text x={getX(3.5)} y={getY(2326) - 5} fill="#fbbf24" fontSize={8} fontFamily="monospace" textAnchor="middle">
                      ⚠️ EQUAL HIGHS (EQH)
                    </text>
                  </g>
                )}

                {/* 4. Liquidity Sweep Indicator (Wick Purge Sweep Animation) */}
                {liquiditySwept === "Buy-Side" && (
                  <g>
                    {/* Old swing high line swept */}
                    <line 
                      x1={getX(4)} 
                      y1={getY(2326)} 
                      x2={getX(8)} 
                      y2={getY(2326)} 
                      stroke="#ef4444" 
                      strokeWidth={1} 
                      strokeDasharray="2 2"
                    />
                    {/* Sweep arrow and text */}
                    <circle cx={getX(7)} cy={getY(2339)} r={5} fill="none" stroke="#f59e0b" strokeWidth={1} className="animate-ping" />
                    <path d="M 230 40 L 235 45 M 230 40 L 225 45" stroke="#ef4444" strokeWidth={1} />
                    <text x={getX(7.5)} y={getY(2339) - 8} fill="#ef4444" fontSize={8} fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      BSL SWEEPM 🚀
                    </text>
                  </g>
                )}

                {liquiditySwept === "Sell-Side" && (
                  <g>
                    <line 
                      x1={getX(5)} 
                      y1={getY(2310)} 
                      x2={getX(8)} 
                      y2={getY(2310)} 
                      stroke="#22c55e" 
                      strokeWidth={1} 
                      strokeDasharray="2 2"
                    />
                    <circle cx={getX(7)} cy={getY(2302)} r={5} fill="none" stroke="#22c55e" strokeWidth={1} className="animate-ping" />
                    <text x={getX(7.5)} y={getY(2302) + 12} fill="#22c55e" fontSize={8} fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      SSL LIQUIDITY PURGED 🛡️
                    </text>
                  </g>
                )}

                {/* 5. Draw Fair Value Gap Area (FVG Box) */}
                {fairValueGapMatched !== "No" && (
                  <g>
                    {/* Shade between low of bar 7 and high of bar 9 */}
                    <rect 
                      x={getX(7)} 
                      y={direction === "Buy" ? getY(2332) : getY(2320)} 
                      width={getX(10) - getX(7)} 
                      height={direction === "Buy" ? (getY(2314) - getY(2332)) : (getY(2310) - getY(2320))} 
                      fill="#14b8a6" 
                      fillOpacity={0.15} 
                      stroke="#14b8a6" 
                      strokeOpacity={0.4}
                      strokeWidth={1}
                    />
                    <text 
                      x={getX(8.5)} 
                      y={direction === "Buy" ? getY(2323) : getY(2315)} 
                      fill="#14b8a6" 
                      fontSize={8} 
                      fontFamily="monospace" 
                      textAnchor="middle" 
                    >
                      15M FVG ({direction === "Buy" ? "Discount" : "Premium"})
                    </text>
                  </g>
                )}

                {/* 6. Draw Market Structure Break line (BOS / CHoCH) */}
                {structureShift !== "None" && (
                  <g>
                    <line 
                      x1={getX(8)} 
                      y1={direction === "Buy" ? getY(2330) : getY(2315)} 
                      x2={getX(12)} 
                      y2={direction === "Buy" ? getY(2330) : getY(2315)} 
                      stroke="#38bdf8" 
                      strokeWidth={1.5} 
                      strokeDasharray="3 3"
                    />
                    <text x={getX(10)} y={direction === "Buy" ? getY(2330) - 5 : getY(2315) + 11} fill="#38bdf8" fontSize={8} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      {structureShift === "CHoCH (Change of Character)" ? "⚡ CHoCH Shift" : "📈 BOS Trigger"}
                    </text>
                  </g>
                )}

                {/* 7. Plot Candlesticks */}
                {candles.map((candle, idx) => {
                  const x = getX(idx);
                  const isGreen = candle.close >= candle.open;
                  const bodyY = isGreen ? getY(candle.close) : getY(candle.open);
                  const bodyHeight = Math.max(2, Math.abs(getY(candle.close) - getY(candle.open)));
                  const candleStroke = isGreen ? "#10b981" : "#ef4444";
                  const candleFill = isGreen ? "#10b981" : "#ef4444";

                  return (
                    <g key={idx} className="hover:opacity-80 cursor-crosshair">
                      {/* Candle Wick (High-Low) */}
                      <line 
                        x1={x} 
                        y1={getY(candle.high)} 
                        x2={x} 
                        y2={getY(candle.low)} 
                        stroke={candleStroke} 
                        strokeWidth={1.2}
                      />
                      {/* Candle Body */}
                      <rect 
                        x={x - 4} 
                        y={bodyY} 
                        width={8} 
                        height={bodyHeight} 
                        fill={candleFill} 
                        stroke={candleStroke}
                        strokeWidth={1}
                        rx={1}
                      />
                      {/* Optional Interactive Indicator Labels above high/low */}
                      {candle.label && (
                        <g>
                          <rect 
                            x={x - 22} 
                            y={getY(candle.high) - 17} 
                            width={44} 
                            height={11} 
                            fill="#0f111a" 
                            stroke={candleStroke} 
                            strokeWidth={0.5} 
                            rx={2} 
                          />
                          <text 
                            x={x} 
                            y={getY(candle.high) - 9} 
                            fill="#f3f4f6" 
                            fontSize={6.5} 
                            fontFamily="monospace" 
                            textAnchor="middle" 
                            fontWeight="bold"
                          >
                            {candle.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 8. Entry Target Placement Reticle */}
                {fairValueGapMatched !== "No" && (
                  <g>
                    <circle 
                      cx={getX(11)} 
                      y={direction === "Buy" ? getY(2324) : getY(2316)} 
                      r={7} 
                      fill="none" 
                      stroke={direction === "Buy" ? "#10b981" : "#ef4444"} 
                      strokeWidth={1.5} 
                    />
                    <line 
                      x1={getX(10.5)} 
                      y1={direction === "Buy" ? getY(2324) : getY(2316)} 
                      x2={getX(11.5)} 
                      y2={direction === "Buy" ? getY(2324) : getY(2316)} 
                      stroke={direction === "Buy" ? "#10b981" : "#ef4444"} 
                    />
                    <text x={getX(11) + 10} y={direction === "Buy" ? getY(2324) + 3 : getY(2316) + 3} fill={direction === "Buy" ? "#10b981" : "#ef4444"} fontSize={7} fontWeight="bold" fontFamily="monospace">
                      SMC ENTRY ZONE
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Quick Sandbox Controls */}
          <div className="flex flex-wrap gap-2 items-center justify-between text-xs text-gray-400 bg-[#0a0b10] p-3 rounded-lg border border-gray-800">
            <span className="flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              SMC Rule-based Layer mapping simulation
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setPlaySweepSimulation(true);
                  setTimeout(() => setPlaySweepSimulation(false), 2000);
                }}
                disabled={playSweepSimulation}
                className="px-3 py-1 bg-[#161925] border border-gray-700 hover:border-gray-500 rounded text-gray-200 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${playSweepSimulation ? 'animate-spin' : ''}`} />
                {playSweepSimulation ? 'Sweeping...' : 'Re-run Scan'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Preset study maps (Deep Dive Mode) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {presets.map((preset, index) => (
              <div 
                key={index}
                className="bg-[#0a0b10] border border-gray-800 hover:border-gray-700 p-4 rounded-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                      {preset.name}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] rounded font-mono font-bold ${
                      preset.config.multiplierScore >= 80 
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      Score: {preset.config.multiplierScore}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-3">
                    {preset.description}
                  </p>
                </div>

                <button
                  onClick={() => onTriggerPreset(preset.config)}
                  className="w-full mt-4 py-2 bg-[#141724] hover:bg-emerald-500 hover:text-white text-gray-200 border border-[#23273b] hover:border-emerald-600 rounded text-xs transition-all font-mono font-semibold flex items-center justify-center gap-2"
                >
                  <Play className="w-3 h-3" />
                  Inject into Builder
                </button>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-sky-500/5 text-sky-400 rounded-lg text-xs border border-sky-500/10 font-mono">
            💡 <strong>Algorithmic Tip:</strong> Standard retail traders trade every single structure break. High probability algorithms require a prior **Liquidity Sweep** first. If no liquidity is swept before structure breaks, the system rates it lower to safeguard core capital.
          </div>
        </div>
      )}
    </div>
  );
}
