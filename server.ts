import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing
app.use(express.json());

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY is not set or empty. AI features will fallback to custom mock feedback.");
}

// 1. Analyze setup rating (A+, B, or Avoid) with Smart Money Concepts (SMC)
app.post("/api/gemini/analyze", async (req, res) => {
  const { 
    timeframe, 
    symbol, 
    liquiditySwept, // "Buy-Side", "Sell-Side", "Equal Highs", "None"
    structureShift, // "BOS (Break of Structure)", "MSS (Market Structure Shift)", "CHoCH (Change of Character)", "None"
    displacement, // boolean/string
    fairValueGapMatched, // "Yes (Premium Area)", "Yes (Discount Area)", "No"
    sessionType, // "Asia", "London (Kill Zone)", "New York", "None"
    multiplierScore, // Out of 100
    riskPercentage, // Lot sizes etc
    notes 
  } = req.body;

  if (!ai) {
    // Elegant fallback if no key set
    return res.json({
      rating: multiplierScore >= 80 ? "A" : "B",
      reasoning: "GEMINI_API_KEY is not configured, but based on rule metrics: Setup has valid parameters. " + 
                 (multiplierScore >= 80 ? "Score is strong. Watch higher timeframe alignment." : "Slightly speculative setup. Focus heavily on Liquidity Sweep verification."),
      strengths: [
        `Risk Percentage constrained to ${riskPercentage}%`,
        `Session is ${sessionType}`,
        `SMC shift defined as ${structureShift}`
      ],
      warnings: ["AI analysis is running in offline local mode. Configure GEMINI_API_KEY in Secrets for live SMC deep reasoning."],
      suggestedFilters: "Wait for NY sweep before taking entry. Confirm FVG confluence."
    });
  }

  try {
    const prompt = `You are a professional retail and institutional Smart Money Concepts (SMC) Portfolio Risk Officer.
Grade this XAUUSD/Forex setup based on these technical specifications and give it an absolute grade of 'A+', 'A', 'B', or 'AVOID' according to strict rule-based criteria (Protect Capital first, Wait Patiently, Manage Risk).

Setup details:
- Symbol: ${symbol || 'XAUUSD'}
- Timeframe: ${timeframe || '15M'}
- Liquidity Swept Prior to Entry: ${liquiditySwept}
- Market Structure Shift: ${structureShift}
- Displacement of move: ${displacement ? 'Yes (strong push)' : 'No/Moderate'}
- Fair Value Gap Intersection: ${fairValueGapMatched}
- Session & Killzone Alignment: ${sessionType}
- Internal Probability Score: ${multiplierScore} / 100
- Risk Lot Allocations: ${riskPercentage}% risk of capital
- Additional Setup Notes: ${notes || 'None'}

Your response should be in pure JSON matching this exact structure:
{
  "rating": "A+ | A | B | AVOID",
  "reasoning": "A paragraph explaining the institutional logic of this trade. Argue if equal highs/lows was swept, or if the trader is gambling prior to liquidity sweeps.",
  "strengths": ["list of 3 key strengths"],
  "warnings": ["list of structural hazards or contradictions"],
  "suggestedFilters": "1-2 actionable modifications to optimize this trade layout (such as waiting for session overlap, dynamic lot adjustments, or targeting equal highs/lows liquidity)."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Error /api/gemini/analyze:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze setup" });
  }
});

// 2. Dynamic Python modular trading draft compiler
app.post("/api/gemini/generate-code", async (req, res) => {
  const { engines, preferences } = req.body;
  // engines is an array like ["liquidity", "structure", "session", "risk", "memory"]

  if (!ai) {
    return res.json({
      code: `# GEMINI_API_KEY is not set. Showing a pre-coded rule base skeleton:

class SMCCoreEngine:
    def __init__(self, risk_pct=${preferences?.riskPct || 1.0}):
        self.risk_pct = risk_pct
        print("SMC Core Engine loaded offline.")

    def check_liquidity_sweep(self, high, low, close):
        # Scan sweeps of previous session highs/lows
        if close > high:
            return "SWEEP_HIGH"
        elif close < low:
            return "SWEEP_LOW"
        return "NO_SWEEP"

    def calculate_lot_size(self, balance, stop_loss_pips):
        # Adaptive risk lot engine calculation
        risk_amount = balance * (self.risk_pct / 100)
        pip_value = 10.0 # Standard lot
        lot_size = risk_amount / (stop_loss_pips * pip_value)
        return round(max(0.01, lot_size), 2)
`
    });
  }

  try {
    const prompt = `You are a veteran Quant Systems Architect specialized in high-frequency algorithmic derivatives trading for gold (XAUUSD).
Compile a highly robust, clean, modular Python codebase drafting the functional engines selected by the user.

Selected Modules to generate code for:
${engines.map((e: string) => `- ${e.toUpperCase()} ENGINE`).join("\n")}

User Preferences:
- Risk Target: ${preferences?.riskPct || 1.0}% per trade.
- Focus: Smart Money Concepts (BOS, CHoCH, Liquidity Sweeps, FVGs).
- Execution Style: ${preferences?.executionStyle || 'Simulated Webhook / MT5 Python integration'}

Ensure the scripts are well-typed, professional, contain clean logic, and avoid dummy functions of 'pass'. Write functional methods implementing:
1. Liquidity Sweep tracking of session high/low bounds.
2. Market Structure Shift or CHoCH verification via displacement candles.
3. Adaptive sizing with dynamic stop-loss buffer based on True Range.
4. Setup validation loop.

Return the Python code beautifully structured and heavily commented with institutional trading wisdom. Keep it extremely useful for traders building automated systems.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    return res.json({ code: response.text });
  } catch (error: any) {
    console.error("Gemini Error /api/gemini/generate-code:", error);
    return res.status(500).json({ error: error.message || "Failed to generate python code" });
  }
});

// 3. Learning Analysis route (studies wins/losses and improves filtering rules)
app.post("/api/gemini/analyze-history", async (req, res) => {
  const { trades } = req.body;

  if (!ai) {
    return res.json({
      analysis: "Configure GEMINI_API_KEY in secrets to get custom statistical and psychological setup filter tips from Gemini AI. Local mode: Settle for keeping trade risk strictly bounded below 2% of equity and trading solely during NY/London overlaps.",
      successFactors: ["High Discipline detected in simulated log"],
      suggestedRules: ["Limit trades to NY session kill zones exclusively", "Always sweep liquitidity prior to CHoCH entries"]
    });
  }

  try {
    const prompt = `You are an elite Prop Firm Risk Director studying a trader's journaled outcome log.
Analyze these simulated trade logs of SMC (Smart Money Concepts) setups:

${JSON.stringify(trades, null, 2)}

Provide a highly targeted retrospective analysis that is actionable and grounded in statistical trading mathematics.

Your response MUST be formatted as custom JSON:
{
  "analysis": "Structured paragraph diagnosing the emotional, timing, or structural flaws in their wins and losses. Point out session overlaps and risk-reward behavior.",
  "successFactors": ["List 2-3 traits that yield the highest risk-reward setups"],
  "suggestedRules": ["List 2-3 clear trade filtering rules they MUST add to their rule-based execution core filter to immediately protect equity capital."]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Error /api/gemini/analyze-history:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze trade history" });
  }
});

// Setup Vite and Static Paths
async function setupViteAndAssets() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SMC Server] Running on http://localhost:${PORT}`);
  });
}

setupViteAndAssets().catch((err) => {
  console.error("Vite setup error:", err);
});
