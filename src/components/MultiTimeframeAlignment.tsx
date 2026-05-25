import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight, RefreshCw, Layers, ShieldCheck } from "lucide-react";

interface MultiTimeframeAlignmentProps {
  bias: "Bullish" | "Bearish" | "Neutral";
  marketState: string;
  confidenceScore: number;
}

export default function MultiTimeframeAlignment({ bias, marketState, confidenceScore }: MultiTimeframeAlignmentProps) {
  // Compute dynamic structural states based on telemetry input:
  const getAlignmentStatus = () => {
    if (bias === "Neutral" || marketState === "Low Liquidity" || confidenceScore < 50) {
      return {
        label: "CONFLICTED STRUCTURE",
        sub: "Sidelined on key timeframes — HTF bias conflicting with local execution models.",
        color: "text-rose-450 border-rose-500/30 bg-rose-500/10",
        pill: "bg-rose-500 text-black"
      };
    }
    if (confidenceScore >= 80) {
      return {
        label: "FULLY ALIGNED",
        sub: "All execution matrices synchronized. High probability momentum transition active.",
        color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
        pill: "bg-emerald-500 text-black animate-pulse"
      };
    }
    return {
      label: "PARTIAL ALIGNMENT",
      sub: "Higher timezone flow matches local bias, but awaiting displacement confirmation.",
      color: "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10",
      pill: "bg-[#fbbf24] text-black"
    };
  };

  const status = getAlignmentStatus();

  // Dynamic values based on selected bias
  const htfBias = bias;
  const htfStructure = bias === "Neutral" ? "Ranging" : bias === "Bullish" ? "Bullish (CHoCH)" : "Bearish (BOS)";
  const localConfirm = confidenceScore >= 75 ? "Sweep + FVG Confirm" : confidenceScore >= 55 ? "Sweep Pending Mitigation" : "No Rejection Sign";
  const entryModel = confidenceScore >= 80 ? "Premium/Discount FVG Engaged" : confidenceScore >= 60 ? "Liquidity Hunt Wick Formed" : "Sidelined / Out of Zone";

  return (
    <div className="bg-[#0b0c13] border border-gray-900 rounded-xl p-4 sm:p-5 shadow-xl space-y-4" id="mtf-alignment-matrix">
      <div className="flex items-center justify-between border-b border-gray-900 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#a78bfa]" />
          <span className="text-xs font-black font-mono uppercase tracking-widest text-zinc-100">
            Engine 5A: Multi-Timeframe Alignment Matrix
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
          <RefreshCw className="w-3 h-3 animate-spin" />
          AUTO-CALIBRATING
        </div>
      </div>

      {/* Alignment Status Banner */}
      <div className={`p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${status.color}`}>
        <div className="space-y-0.5">
          <span className="text-xs font-black font-mono tracking-wider">
            MATRIX ALIGNMENT: {status.label}
          </span>
          <p className="text-[10px] text-zinc-350 font-mono leading-relaxed">
            {status.sub}
          </p>
        </div>
        <span className={`px-2.5 py-0.5 text-[9px] font-mono font-black rounded text-center self-start sm:self-auto ${status.pill}`}>
          {status.label.split(" ")[0]}
        </span>
      </div>

      {/* Grid of the 4 key structural checkpoints */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* 4H Bias */}
        <div className="bg-black/40 border border-gray-950 p-3 rounded-lg flex flex-col justify-between hover:border-gray-900 transition-all">
          <div>
            <span className="text-[8px] text-zinc-500 block uppercase font-bold tracking-wider">4H Higher Timeframe Bias</span>
            <span className="text-xs font-black text-zinc-100 mt-1 block tracking-wider">4H FEED ANALYSIS</span>
          </div>
          <div className="flex items-center justify-between mt-3 font-black text-xs">
            <span className={htfBias === "Bullish" ? "text-emerald-450 text-emerald-400" : htfBias === "Bearish" ? "text-rose-400" : "text-[#fbbf24]"}>
              {htfBias}
            </span>
            {htfBias === "Bullish" ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : htfBias === "Bearish" ? (
              <ArrowDownRight className="w-4 h-4 text-rose-450" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            )}
          </div>
        </div>

        {/* 1H Structure */}
        <div className="bg-black/40 border border-gray-950 p-3 rounded-lg flex flex-col justify-between hover:border-gray-900 transition-all">
          <div>
            <span className="text-[8px] text-zinc-500 block uppercase font-bold tracking-wider">1H Trend Structure</span>
            <span className="text-xs font-black text-zinc-100 mt-1 block tracking-wider">BOS/CHoCH DETECTION</span>
          </div>
          <div className="flex items-center justify-between mt-3 font-bold text-xs">
            <span className="text-zinc-300">{htfStructure}</span>
            <div className={`p-0.5 px-1.5 rounded text-[8px] font-black ${
              bias === "Bullish" ? "bg-emerald-500/10 text-emerald-400" : bias === "Bearish" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-[#fbbf24]"
            }`}>
              {bias === "Neutral" ? "MT" : "TRENDING"}
            </div>
          </div>
        </div>

        {/* 30M Confirmation */}
        <div className="bg-black/40 border border-gray-950 p-3 rounded-lg flex flex-col justify-between hover:border-gray-900 transition-all">
          <div>
            <span className="text-[8px] text-zinc-500 block uppercase font-bold tracking-wider">30M Local Confirmation</span>
            <span className="text-xs font-black text-zinc-100 mt-1 block tracking-wider">LIQUIDITY HARVEST</span>
          </div>
          <div className="flex items-center justify-between mt-3 font-semibold text-xs">
            <span className="text-zinc-300 text-[10px] truncate max-w-[120px]" title={localConfirm}>{localConfirm}</span>
            <span className="text-sky-400 font-extrabold text-[9px]">SMC</span>
          </div>
        </div>

        {/* 15M Entry Model */}
        <div className="bg-black/40 border border-gray-950 p-3 rounded-lg flex flex-col justify-between hover:border-gray-900 transition-all">
          <div>
            <span className="text-[8px] text-zinc-500 block uppercase font-bold tracking-wider">15M Fractional Entry</span>
            <span className="text-xs font-black text-zinc-100 mt-1 block tracking-wider">DISPLACEMENT ZONE</span>
          </div>
          <div className="flex items-center justify-between mt-3 font-semibold text-xs">
            <span className="text-zinc-300 text-[10px] truncate max-w-[124px]" title={entryModel}>{entryModel}</span>
            <span className="text-[#a78bfa] font-extrabold text-[9px]">EXEC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
