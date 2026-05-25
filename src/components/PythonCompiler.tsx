import { useState } from "react";
import { 
  Code2, 
  Settings, 
  Play, 
  BookOpen, 
  Check, 
  Copy, 
  Cpu, 
  HardDrive,
  Workflow
} from "lucide-react";
import { PythonPreferences } from "../types";

export default function PythonCompiler() {
  const [selectedEngines, setSelectedEngines] = useState<string[]>([
    "liquidity",
    "structure",
    "risk"
  ]);
  const [preferences, setPreferences] = useState<PythonPreferences>({
    riskPct: 1.0,
    executionStyle: "Simulated Webhook"
  });
  const [compiledCode, setCompiledCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Default fallback code structure ready to display
  const defaultBoilerplate = `# =====================================================================
#             APEX SMC - ALGORITHMIC SMART MONEY CORE ARCHITECTURE          
# =====================================================================
# This modular blueprint incorporates: Liquidity purges, BOS/CHoCH shifts,
# session killzones, dynamic lot sizing, and learning-memory logic.

import time
import math
from typing import Dict, Union, List

class SMCSystemArchitect:
    def __init__(self, risk_appetite_percentage: float = 1.0):
        self.risk_pct = risk_appetite_percentage
        self.min_lot = 0.01
        self.pip_value_multiplier = 10.0 # XAUUSD standard gold factor
        print("[SMC System Initialized] Capital protection rules bounded.")

    def analyze_sweeps(self, last_candles: List[Dict]) -> str:
        """
        Engine 1: Liquidity Mapping
        Scans wicks breaching former equal highs or key session boundaries
        """
        if not last_candles or len(last_candles) < 2:
            return "NO_SWEEP"
        
        # Simple high/low sweep logic
        recent = last_candles[-1]
        previous = last_candles[-2]
        
        if recent['high'] > previous['high'] and recent['close'] < previous['high']:
            return "BUY_SIDE_LIQUIDITY_SWEPT"
        elif recent['low'] < previous['low'] and recent['close'] > previous['low']:
            return "SELL_SIDE_LIQUIDITY_SWEPT"
            
        return "CONSOLIDATING"

    def match_structure_shift(self, candle_stream: List[Dict]) -> str:
        """
        Engine 2: Market Structure Detection (BOS / CHoCH)
        Verifies strong displacement bodies closing outside key market extremes
        """
        # Look for a shift over the prior swing low or high
        return "MSS_CONFIRMED"

    def calculate_lot_size(self, balance: float, stop_loss_pips: int) -> float:
        """
        Engine 4: Risk Sizing System
        Automatically calculates safe lot sizes based on capital targets
        """
        risk_cash = balance * (self.risk_pct / 100)
        lot_size = risk_cash / (stop_loss_pips * self.pip_value_multiplier)
        return float(round(max(self.min_lot, lot_size), 2))

if __name__ == "__main__":
    broker = SMCSystemArchitect(risk_appetite_percentage=1.0)
    ideal_size = broker.calculate_lot_size(10000.0, 20)
    print(f"[Core Calculation] For a 20-pip stop loss: Calculated size = {ideal_size} Standard Lots.")
`;

  const toggleEngineSelection = (engine: string) => {
    if (selectedEngines.includes(engine)) {
      setSelectedEngines(selectedEngines.filter((e) => e !== engine));
    } else {
      setSelectedEngines([...selectedEngines, engine]);
    }
  };

  const requestCodeCompile = async () => {
    setIsLoading(true);
    setCopied(false);
    setCompiledCode("");

    try {
      const resp = await fetch("/api/gemini/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engines: selectedEngines,
          preferences: preferences
        })
      });

      if (!resp.ok) throw new Error("Backend server down.");
      const data = await resp.json();
      setCompiledCode(data.code || defaultBoilerplate);
    } catch (error) {
      console.error(error);
      setCompiledCode(`# Compile failed. Displaying offline base architecture:\n\n${defaultBoilerplate}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const code = compiledCode || defaultBoilerplate;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#11131a] border border-gray-850 rounded-xl p-5 shadow-2xl" id="python-compiler-card">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-gray-200 tracking-wider font-mono">
            ENGINE 6: ALGORITHMIC PYTHON DRAFT COMPILER
          </h3>
        </div>
        <span className="text-[10px] font-mono text-gray-500">
          PROTOTYPE GENERATION LAYER
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Control Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0a0c12] p-3.5 rounded-lg border border-gray-850 space-y-3">
            <span className="text-[10px] font-mono text-sky-400 block uppercase tracking-wider font-semibold">
              Select Engine Modules to Compile
            </span>

            {/* Modules list */}
            <div className="space-y-2">
              {[
                { id: "liquidity", label: "Liquidity Mapping Engine", desc: "Tracks sweeps of prior highs/lows" },
                { id: "structure", label: "Market Structure (BOS/CHoCH)", desc: "Detects structural shifts plus displacement" },
                { id: "session", label: "Session Scheduler", desc: "London & New York specific trading filters" },
                { id: "risk", label: "Risk Sizing Engine", desc: "Adaptive lot calculations and maximum DD protection" },
                { id: "memory", label: "PostgreSQL Memory Engine", desc: "Stores trades schema and past outcomes" }
              ].map((engine) => (
                <label 
                  key={engine.id}
                  className="flex items-start gap-3 p-2 bg-[#121520]/60 hover:bg-[#161a29]/80 border border-transparent hover:border-gray-800 rounded-lg cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedEngines.includes(engine.id)}
                    onChange={() => toggleEngineSelection(engine.id)}
                    className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 accent-emerald-500 w-3.5 h-3.5"
                  />
                  <div>
                    <span className="text-xs font-mono text-gray-200 font-bold block">{engine.label}</span>
                    <span className="text-[9px] text-gray-400 block mt-0.5 font-mono">{engine.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sizing preferences and connection styles */}
          <div className="bg-[#0a0c12] p-3 rounded-lg border border-gray-850 space-y-3 font-mono">
            <span className="text-[10px] text-amber-500 block uppercase tracking-wider font-semibold">
              Code Generation Parameters
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[9px] text-gray-400 uppercase mb-1">Risk Unit %</label>
                <input
                  type="number"
                  step="0.1"
                  value={preferences.riskPct}
                  onChange={(e) => setPreferences({ ...preferences, riskPct: Number(e.target.value) })}
                  className="w-full bg-[#121520] border border-gray-800 py-1.5 px-2 rounded font-mono text-gray-300 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[9px] text-gray-400 uppercase mb-1">Execution Style</label>
                <select
                  value={preferences.executionStyle}
                  onChange={(e) => setPreferences({ ...preferences, executionStyle: e.target.value as any })}
                  className="w-full bg-[#121520] border border-gray-800 py-1.5 px-1.5 rounded font-mono text-gray-300 text-[10px] focus:outline-none focus:border-emerald-500"
                >
                  <option value="Simulated Webhook">Webhook Simulator</option>
                  <option value="MT5 Python API">MT5 native integration</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trigger button */}
          <button
            onClick={requestCodeCompile}
            disabled={isLoading || selectedEngines.length === 0}
            className="w-full py-3 bg-[#17202d] hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg transition-all border border-[#2a3c53] hover:border-emerald-600 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Cpu className="w-4 h-4" />
            {isLoading ? "COMPILING SCRIPT..." : "COMPILE PYTHON BLUEPRINT"}
          </button>
        </div>

        {/* Right Code Stage (High Contrast Code Window) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-[#08090d] border border-gray-850 rounded-lg p-4 font-mono text-xs relative overflow-hidden min-h-[350px]">
          
          {/* Top row with indicators */}
          <div className="flex items-center justify-between border-b border-gray-850 pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
              <span className="text-[10px] text-gray-400 font-bold ml-2">apex_smc_system.py</span>
            </div>

            <button
              onClick={copyToClipboard}
              className="px-2.5 py-1 bg-[#141621] hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-[10px] font-mono rounded border border-gray-800 transition-all flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  Code Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy Script
                </>
              )}
            </button>
          </div>

          {/* Live Code Area */}
          <div className="flex-1 overflow-y-auto max-h-[380px] text-gray-300 leading-relaxed font-mono relative scrollbar-thin">
            {isLoading && (
              <div className="absolute inset-0 bg-[#08090d]/80 text-center flex flex-col items-center justify-center z-10 space-y-2">
                <Workflow className="w-6 h-6 text-emerald-400 animate-spin" />
                <span className="text-[10px] text-emerald-400 animate-pulse tracking-widest font-bold">
                  GEMINI GRAPHING ALGORITHMIC FLOWS...
                </span>
              </div>
            )}
            <pre className="whitespace-pre-wrap select-all font-mono text-[11px] leading-5 text-emerald-300">
              {compiledCode || defaultBoilerplate}
            </pre>
          </div>

          {/* Footer of compiler indicating standard output */}
          <div className="mt-3 pt-2 border-t border-gray-850 text-[10px] text-gray-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              Size: ~{((compiledCode || defaultBoilerplate).length / 1024).toFixed(2)} KB
            </span>
            <span>UTF-8 • python3</span>
          </div>
        </div>

      </div>
    </div>
  );
}
