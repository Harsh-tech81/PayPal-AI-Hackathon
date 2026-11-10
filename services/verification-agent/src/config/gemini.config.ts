import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const TIMEOUT_MS = 4000;

/**
 * Fetch wrapper with timeout for Google Gemini.
 */
async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("your_gemini_api_key")) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const rawModel = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite").trim();
  const modelName = rawModel.includes("1.5") || rawModel.includes("2.5")
    ? "gemini-3.5-flash-lite"
    : rawModel;

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
        temperature: 0.1,
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
    const parts = data.candidates?.[0]?.content?.parts || [];
    const candidate = parts.map((p: any) => p.text || "").join("").trim();
    if (!candidate) throw new Error("Empty response from Gemini API");
    return candidate;
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
    // Deterministic Circuit Breaker: fallback to dynamic template for all 10 intent presets
    console.warn("[Gemini Circuit Breaker] Formulator fallback triggered:", err.message);
    const lowerPrompt = (prompt || "").toLowerCase();
    const lowerAns = (plainAnswer || "").toLowerCase();

    if (lowerPrompt.includes("dog") || lowerAns.includes("bruno") || lowerPrompt.includes("pet")) {
      return "Who used to wag their tail and beg for your morning biscuits when you woke up?";
    }
    if (lowerPrompt.includes("grandmother") || lowerAns.includes("sunshine")) {
      return "What secret pet name did your grandmother call you when you were sick in bed?";
    }
    if (lowerPrompt.includes("tumble") || lowerPrompt.includes("winter") || lowerAns.includes("zurich")) {
      return "Where did you take a cold tumble in the snow during a winter vacation?";
    }
    if (lowerPrompt.includes("food") || lowerAns.includes("shake") || lowerAns.includes("fries")) {
      return "What quirky comfort food combination do you secretly eat when you are home alone?";
    }
    if (lowerPrompt.includes("song") || lowerPrompt.includes("shower") || lowerAns.includes("rhapsody")) {
      return "What iconic song do you always sing out loud in the shower when stressed?";
    }
    if (lowerPrompt.includes("paycheck") || lowerPrompt.includes("bought") || lowerAns.includes("guitar")) {
      return "What was the very first memorable item you bought with your own hard-earned paycheck?";
    }
    if (lowerPrompt.includes("lucky") || lowerPrompt.includes("digit") || lowerPrompt.includes("number") || lowerAns.includes("742")) {
      return "What is your secret lucky 3-digit number and private memory code?";
    }
    if (lowerPrompt.includes("street") || lowerPrompt.includes("knee") || lowerAns.includes("elm")) {
      return "What was the name of the street where you fell and scraped your knee as a child?";
    }
    if (lowerPrompt.includes("teacher") || lowerAns.includes("green") || lowerAns.includes("captain")) {
      return "What was the beloved nickname of your favorite elementary school teacher?";
    }
    if (lowerPrompt.includes("car") || lowerPrompt.includes("wagon") || lowerPrompt.includes("road-trip")) {
      return "What was the color and style of your family's oldest unforgettable road-trip car?";
    }
    
    if (prompt) {
      const clean = prompt.trim().replace(/\?+$/, "");
      return `${clean}?`;
    }
    return "What is your primary childhood family pet name or native hometown?";
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

  const systemInstruction = `You are PayShield's LLM-as-a-Judge Cognitive Verification Engine.
Your task is to strictly evaluate whether the user's submitted answer matches or semantically answers the expected secret memory anchor.
STRICT VERIFICATION RULES:
1. APPROVE if the submitted answer matches the expected secret, shares key core memory elements (e.g. "fries with milkshake", "shake and fries", "fries in shake" for "Fries dipped in chocolate milkshake"), or is an obvious synonym/casual wording.
2. REJECT if the submitted answer is generic, unrelated, incorrect, or contradicts the expected secret (e.g. submitting "cake", "pizza", "water", "apple", "random", "cat" when the secret is "Fries dipped in chocolate milkshake" MUST BE REJECTED with is_verified: false and confidence: 0.05).
3. Tolerate minor phonetic typos, capitalization, and trivial articles ("the", "my", "a").
OUTPUT:
Return ONLY a valid JSON object:
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

const STOP_WORDS = new Set(["the", "a", "an", "my", "our", "their", "who", "whom", "that", "which", "and", "or", "in", "at", "for", "with", "loved", "liked", "dog", "pet", "is", "was", "to", "of", "dipped"]);

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
    const expTokens = normExp.split(/\s+/).filter((t) => t.length > 2 && !STOP_WORDS.has(t));
    const subTokens = normSub.split(/\s+/).filter((t) => t.length > 2 && !STOP_WORDS.has(t));

    // Check exact token overlap
    const shared = subTokens.filter((t) => expTokens.includes(t));
    if (shared.length > 0) {
      return {
        is_verified: true,
        confidence: 0.95,
        reasoning: `Cognitive intent verified: User recalled key cognitive anchor (${shared.join(", ")})`,
      };
    }

    // Check stemming / substring on key tokens (e.g. "shake" matches "milkshake", "fry" matches "fries")
    const partialMatch = subTokens.some((st) => expTokens.some((et) => et.includes(st) || st.includes(et)));
    if (partialMatch) {
      return {
        is_verified: true,
        confidence: 0.92,
        reasoning: "Cognitive intent verified: Partial stem match on stored cognitive anchor",
      };
    }
  }

  // If no match was found against expected secret, it MUST be rejected
  return {
    is_verified: false,
    confidence: 0.04,
    reasoning: "Answer does not match your registered private cognitive memory anchor",
  };
}
