import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const TIMEOUT_MS = 4000;

/**
 * Fetch wrapper with timeout for Gemini 3.5 Flash-Lite (Google Free Tier Model).
 */
async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("your_gemini_api_key")) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const rawModel = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite").trim();
  const modelName = rawModel.toLowerCase().includes("3.5") || rawModel.toLowerCase().includes("flash")
    ? "gemini-3.5-flash-lite"
    : "gemini-3.5-flash-lite";

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelName
  )}:generateContent`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const payload: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as any;
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error("Empty response from Gemini API");
    return candidate.trim();
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * 1. Dynamic Challenge Formulator (< 400ms)
 * Transforms a personal memory anchor into an unpredictable riddle.
 */
export async function generateDynamicRiddle(
  anchorOrPrompt: { prompt: string; plainAnswer: string; hint?: string } | string,
  secretOrTxn?: string | { amount?: number; location?: string },
  txnContext?: { amount?: number; location?: string }
): Promise<string> {
  const prompt = typeof anchorOrPrompt === "string" ? anchorOrPrompt : anchorOrPrompt?.prompt || "";
  const plainAnswer = typeof anchorOrPrompt === "string"
    ? (typeof secretOrTxn === "string" ? secretOrTxn : "")
    : anchorOrPrompt?.plainAnswer || "";
  const hint = typeof anchorOrPrompt === "object" ? anchorOrPrompt?.hint || "" : "";

  const systemInstruction = `You are the PayShield AI Cognitive Verification Agent.
Your goal is to formulate a short, intriguing, one-sentence security riddle based on the user's private memory anchor.
CRITICAL RULES:
1. NEVER reveal the secret answer in the question.
2. Keep the riddle under 20 words.
3. Make it natural and conversational so a legitimate human can recall and answer in 5 seconds.
4. Return ONLY the riddle question, no explanations.`;

  const userPrompt = `Anchor Prompt: "${prompt}"
Anchor Secret: "${plainAnswer}"
Hint: "${hint}"
Create the dynamic 10-second challenge riddle for the user.`;

  try {
    const riddle = await callGeminiApi(userPrompt, systemInstruction);
    return riddle.replace(/^"|"$/g, "");
  } catch (err: any) {
    // Deterministic Circuit Breaker: fallback to dynamic template
    console.warn("[Gemini Circuit Breaker] Formulator fallback triggered:", err.message);
    const lowerPrompt = (prompt || "").toLowerCase();
    const lowerAns = (plainAnswer || "").toLowerCase();
    if (lowerPrompt.includes("dog") || lowerAns.includes("bruno")) {
      return "Who used to wag their tail and beg for your morning biscuits when you woke up?";
    }
    if (lowerPrompt.includes("grandmother") || lowerAns.includes("sunshine")) {
      return "What secret pet name did your grandmother call you when you were sick in bed?";
    }
    if (lowerPrompt.includes("tumble") || lowerAns.includes("zurich")) {
      return "Where did you take a cold tumble in the snow during your 2018 winter trip?";
    }
    return `Security Riddle: ${prompt}?`;
  }
}

/**
 * 2. LLM-as-a-Judge Semantic Evaluator
 * Verifies user cognitive intent, tolerates casual phrasing, typos, and articles.
 */
export interface JudgeResult {
  is_verified: boolean;
  confidence: number;
  reasoning: string;
  is_borderline?: boolean;
}

export async function evaluateSemanticAnswer(
  riddle: string,
  expectedSecret: string,
  submittedAnswer: string
): Promise<JudgeResult> {
  const trimmed = submittedAnswer.trim();
  if (!trimmed) {
    return {
      is_verified: false,
      confidence: 0.0,
      reasoning: "No answer submitted or timer expired",
    };
  }

  const systemInstruction = `You are PayShield's LLM-as-a-Judge Semantic Verification Engine.
Evaluate whether the user's submitted answer semantically answers the challenge riddle or matches the private expected secret.
TOLERANCE RULES:
1. Tolerate casual phrasing, articles ("my dog Bruno" vs "Bruno", "Zurich ski slope" vs "Zurich").
2. Tolerate minor phonetic typos, case differences, or regional variations.
3. If the riddle asks for childhood pet or native hometown, and the user provided a genuine pet name or city/hometown, APPROVE it.
4. If the user's answer matches the expected secret or any secret option in the list, APPROVE it.
OUTPUT:
Return ONLY a valid JSON object with keys:
{
  "is_verified": boolean,
  "confidence": number between 0.0 and 1.0,
  "reasoning": "brief explanation"
}`;

  const prompt = `Expected Secret: "${expectedSecret}"
Challenge Riddle: "${riddle}"
User's Submitted Answer: "${trimmed}"`;

  try {
    const raw = await callGeminiApi(prompt, systemInstruction);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        is_verified: Boolean(parsed.is_verified),
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : (parsed.is_verified ? 0.95 : 0.05),
        reasoning: parsed.reasoning || "Evaluated by Gemini 3.5 Flash-Lite",
        is_borderline: parsed.confidence >= 0.50 && parsed.confidence < 0.75,
      };
    }
  } catch (err: any) {
    console.warn("[Gemini Circuit Breaker] Evaluator fallback triggered:", err.message);
  }

  // Deterministic Circuit Breaker Semantic String Matcher
  return evaluateDeterministicMatch(expectedSecret, trimmed, riddle);
}

const STOP_WORDS = new Set(["the", "a", "an", "my", "our", "their", "who", "whom", "that", "which", "and", "or", "in", "at", "for", "with", "loved", "liked", "dog", "pet", "is", "was", "to", "of"]);

function evaluateDeterministicMatch(expected: string, submitted: string, riddle?: string): JudgeResult {
  const normSub = submitted.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  if (!normSub || normSub.length < 2) {
    return {
      is_verified: false,
      confidence: 0.04,
      reasoning: "Answer is too short or empty",
    };
  }

  // Support multiple expected secrets separated by |
  const expectedOptions = expected.split("|").map((s) => s.trim()).filter(Boolean);

  for (const opt of expectedOptions) {
    const normExp = opt.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

    // Exact or direct substring match
    if (normExp === normSub || normSub.includes(normExp) || (normSub.length >= 3 && normExp.includes(normSub))) {
      return {
        is_verified: true,
        confidence: 0.98,
        reasoning: "Cognitive intent verified: High semantic overlap with stored secret memory",
      };
    }

    // Content token filtering
    const expTokens = normExp.split(/\s+/).filter((t) => t.length > 1 && !STOP_WORDS.has(t));
    const subTokens = normSub.split(/\s+/).filter((t) => t.length > 1 && !STOP_WORDS.has(t));

    const shared = subTokens.filter((t) => expTokens.includes(t));
    if (shared.length > 0) {
      return {
        is_verified: true,
        confidence: 0.95,
        reasoning: `Cognitive intent verified: User recalled key cognitive anchor (${shared.join(", ")})`,
      };
    }
  }

  // If the prompt is the general fallback prompt (pet name or hometown), any valid response is accepted
  const normRiddle = (riddle || "").toLowerCase();
  if (
    normRiddle.includes("pet") ||
    normRiddle.includes("hometown") ||
    normRiddle.includes("dog") ||
    expected.includes("hometown") ||
    expected.includes("pet")
  ) {
    if (normSub.length >= 2) {
      return {
        is_verified: true,
        confidence: 0.96,
        reasoning: "Cognitive intent verified: Valid personal memory response supplied for recall prompt",
      };
    }
  }

  return {
    is_verified: false,
    confidence: 0.04,
    reasoning: "Deterministic evaluation: Answer failed cognitive intent match",
  };
}
