export type LiquiditySweptType = "Buy-Side" | "Sell-Side" | "Equal Highs" | "None";
export type StructureShiftType = "BOS (Break of Structure)" | "MSS (Market Structure Shift)" | "CHoCH (Change of Character)" | "None";
export type FairValueGapType = "Yes (Premium Area)" | "Yes (Discount Area)" | "No";
export type SessionZoneType = "Asia" | "London (Kill Zone)" | "New York" | "None";

export interface SMCTradeSetup {
  symbol: string;
  timeframe: string;
  direction: "Buy" | "Sell";
  liquiditySwept: LiquiditySweptType;
  structureShift: StructureShiftType;
  displacement: boolean;
  fairValueGapMatched: FairValueGapType;
  sessionType: SessionZoneType;
  riskPercentage: number;
  multiplierScore: number;
  notes: string;
}

export interface AIGradeResponse {
  rating: "A+" | "A" | "B" | "AVOID";
  reasoning: string;
  strengths: string[];
  warnings: string[];
  suggestedFilters: string;
}

export interface JournaledTrade {
  id: string;
  date: string;
  symbol: string;
  timeframe: string;
  direction: "Buy" | "Sell";
  setupScore: number;
  riskPct: number;
  rrRatio: number;
  status: "Win" | "Loss";
  pips: number;
  liquiditySwept: LiquiditySweptType;
  structureShift: StructureShiftType;
  sessionType: SessionZoneType;
  marketState?: string;
  executionTiming?: string;
  volatilityIndex?: string;
  spreadPips?: number;
  spreadConditions?: string;
  entryReasoning?: string;
  emotionalState?: string;
}

export interface PythonPreferences {
  riskPct: number;
  executionStyle: "Simulated Webhook" | "MT5 Python API" | "Broker Direct Webhooks";
}

// ==========================================
// PHASE 2 STRUCTS - SYSTEM INTELLIGENCE
// ==========================================

export interface Engine8Candle {
  timeframe: "15M" | "30M" | "1H";
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type MarketStateType = "Trending" | "Expanding" | "Ranging" | "Manipulative" | "Volatile" | "Low Liquidity";

export interface SwingPoint {
  index: number;
  type: "High" | "Low";
  price: number;
  strength: "weak" | "moderate" | "high quality";
}

export interface StructureBreak {
  type: "BOS" | "MSS" | "CHoCH";
  price: number;
  candleIndex: number;
  direction: "Bullish" | "Bearish";
}

export interface SafetyProtectionState {
  dailyDrawdown: number;
  weeklyDrawdown: number;
  tradesThisSession: number;
  isCooldownActive: boolean;
  cooldownSecondsRemaining: number;
  isNewsLockoutActive: boolean;
  currentSpreadPips: number;
  isSystemStopActive: boolean;
}

// ==========================================
// PHASE 3 STRUCTS - VALIDATION & PERFORMANCE
// ==========================================

export interface BacktestResult {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPct: number;
  avgHoldMinutes: number;
  netPips: number;
  bestSetupType: string;
  sessionDistribution: { Asia: number; London: number; NY: number };
}

export interface CalibrationFactor {
  parameter: string;
  weight: number;
  efficiencyRating: number; // 0 - 100%
  status: "Calibrated" | "Needs Tuning" | "Optimized";
}

export type ExecutionModeType = "Manual Confirmation" | "Semi-Auto Strategy" | "Fully Automated (Simulation Mode)";

export type MistakeRecordType = {
  id: string;
  timestamp: string;
  pattern: "Emotion/Revenge" | "Chasing Candle" | "Overtrading" | "Entering inside Chop" | "Bad Risk-to-Reward Ratio";
  actionTaken: string;
  severity: "Low" | "Moderate" | "Critical";
};
