import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const TIMEOUT_MS = 4000;

/**
 * Fetch wrapper with timeout for Google Gemini.
 */
async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("your_gemini_api_key")) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const rawModel = (process.env.GEMINI_MODEL || "gemini-1.5-flash").trim();
  const modelName =
    rawModel.toLowerCase().includes("flash") || rawModel.toLowerCase().includes("1.5")
      ? "gemini-1.5-flash"
      : rawModel;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelName
  )}:generateContent`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const payload: any = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    };

    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
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

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dynamic Challenge Formulator (Preserves user's exact memory prompt)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateDynamicRiddle(
  anchorOrPrompt: { prompt: string; plainAnswer: string; hint?: string } | string,
  secretOrTxn?: string | { amount?: number; location?: string },
  txnContext?: { amount?: number; location?: string }
): Promise<string> {
  const prompt =
    typeof anchorOrPrompt === "string" ? anchorOrPrompt : anchorOrPrompt?.prompt || "";
  if (prompt) {
    const clean = prompt.trim().replace(/\?*$/, "");
    return `${clean}?`;
  }
  return "What was the secret answer you set for this security question?";
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. High-Precision & Friendly Semantic Evaluator
// ─────────────────────────────────────────────────────────────────────────────
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
  if (!trimmed || trimmed.length < 1) {
    return { is_verified: false, confidence: 0.0, reasoning: "No answer submitted" };
  }

  // ── Step 1: High-precision deterministic check first (Instant & Resilient) ──
  const deterministicResult = evaluateDeterministicMatch(expectedSecret, trimmed);
  if (deterministicResult.is_verified) {
    return deterministicResult;
  }

  // ── Step 2: Gemini LLM evaluation (Tolerates complex natural phrasing) ─────
  const systemInstruction = `You are PayShield's Cognitive Verification Judge.
Your task is to verify whether the user's answer matches their private STORED SECRET.

CRITICAL RULES:
1. Stored Secret is the ground truth: "${expectedSecret}".
2. APPROVE (is_verified: true, confidence: 0.95) if the user provides the core secret concept, name, place, number, or item (e.g., if secret is "Bruno who loved biscuits", "Bruno" or "My dog Bruno" MUST be approved).
3. APPROVE natural conversational responses and minor spelling typos (e.g. "Brunno", "Zurich", "Rhapsody").
4. REJECT (is_verified: false, confidence: 0.05) if the answer is a DIFFERENT name, place, or concept (e.g., if secret is "Bruno", answering "Charlie" or "Max" MUST be rejected).
5. REJECT generic filler words or guesses (e.g., "dog", "yes", "idk", "pet", "password").

OUTPUT FORMAT: Return ONLY valid JSON:
{
  "is_verified": boolean,
  "confidence": number between 0.0 and 1.0,
  "reasoning": "short explanation"
}`;

  const prompt = `Stored Secret: "${expectedSecret}"
Question Asked: "${riddle}"
User's Answer: "${trimmed}"`;

  try {
    const raw = await callGeminiApi(prompt, systemInstruction);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const conf =
        typeof parsed.confidence === "number" ? parsed.confidence : parsed.is_verified ? 0.92 : 0.05;
      return {
        is_verified: Boolean(parsed.is_verified),
        confidence: conf,
        reasoning: parsed.reasoning || "Evaluated by Google Gemini",
        is_borderline: conf >= 0.50 && conf < 0.70,
      };
    }
  } catch (err: any) {
    console.warn("[Gemini Evaluator Notice] AI service unavailable, using deterministic match result:", err.message);
  }

  return deterministicResult;
}

// ── Stop words & Generic Category Words ───────────────────────────────────────
const STOP_WORDS = new Set([
  "the", "a", "an", "my", "our", "their", "his", "her", "its", "your",
  "who", "whom", "that", "which", "and", "or", "in", "at", "for", "with",
  "is", "was", "were", "to", "of", "on", "by", "it", "as", "be", "been",
  "i", "me", "we", "us", "you", "he", "she", "they", "them",
  "loved", "liked", "went", "think", "remember", "it was", "was called",
]);

const GENERIC_CATEGORY_WORDS = new Set([
  "dog", "cat", "pet", "animal", "city", "place", "town", "hometown",
  "food", "snack", "meal", "name", "street", "road", "avenue", "house",
  "car", "vehicle", "color", "number", "digits", "code", "song", "music",
  "item", "thing", "teacher", "school", "first", "old", "secret", "answer",
]);

/**
 * Levenshtein distance typo tolerance.
 */
function isFuzzyWordMatch(submittedWord: string, targetWord: string): boolean {
  if (submittedWord === targetWord) return true;
  const sLen = submittedWord.length;
  const tLen = targetWord.length;
  if (Math.abs(sLen - tLen) > 2) return false;
  if (sLen < 4 || tLen < 4) return false; // Too short for typos

  const maxAllowedDist = sLen <= 5 ? 1 : 2;

  const dp: number[][] = Array.from({ length: sLen + 1 }, (_, i) =>
    Array.from({ length: tLen + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= sLen; i++) {
    for (let j = 1; j <= tLen; j++) {
      dp[i][j] =
        submittedWord[i - 1] === targetWord[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[sLen][tLen] <= maxAllowedDist;
}

function extractTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * High-accuracy deterministic matcher:
 * - Friendly: Accepts exact answer, key memory nouns, numbers, and minor typos.
 * - Secure: Blocks generic words ("pet", "dog"), partial word substrings ("rich"), and noise.
 */
export function evaluateDeterministicMatch(expected: string, submitted: string): JudgeResult {
  const cleanSub = submitted.trim().toLowerCase();
  const normSub = cleanSub.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  if (!normSub || normSub.length < 1) {
    return { is_verified: false, confidence: 0.0, reasoning: "Answer is empty" };
  }

  // Reject noise words
  const NOISE = new Set(["yes", "no", "ok", "idk", "hi", "hey", "maybe", "sure", "nope", "test", "pass", "password"]);
  if (NOISE.has(normSub)) {
    return { is_verified: false, confidence: 0.02, reasoning: "Generic noise answer rejected" };
  }

  // Split expected options if pipe-delimited
  const expectedOptions = expected
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const opt of expectedOptions) {
    const normExp = opt.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    if (!normExp) continue;

    // Rule 1: Exact string match (ignoring punctuation/case)
    if (normExp === normSub) {
      return {
        is_verified: true,
        confidence: 0.99,
        reasoning: "Exact match with stored memory answer",
      };
    }

    const subTokens = extractTokens(normSub);
    const expTokens = extractTokens(normExp);

    if (expTokens.length === 0 || subTokens.length === 0) continue;

    // Distinctive tokens = tokens that are NOT stop words and NOT generic category names
    const expDistinctive = expTokens.filter((t) => !STOP_WORDS.has(t) && !GENERIC_CATEGORY_WORDS.has(t));
    // If all tokens happened to be generic (rare), fallback to non-stop words
    const keyExpectedTokens = expDistinctive.length > 0 ? expDistinctive : expTokens.filter((t) => !STOP_WORDS.has(t));

    // Rule 2: Numeric token exact match (e.g. "742")
    const expectedNumbers = expTokens.filter((t) => /^\d+$/.test(t));
    if (expectedNumbers.length > 0) {
      const subNumbers = subTokens.filter((t) => /^\d+$/.test(t));
      const numbersMatch = expectedNumbers.every((n) => subNumbers.includes(n));
      if (numbersMatch && subNumbers.length > 0) {
        return {
          is_verified: true,
          confidence: 0.98,
          reasoning: "Verified: Correct memory number code matched",
        };
      }
    }

    // Rule 3: Submitted contains ANY distinctive key word from the expected secret
    // (e.g. user says "Bruno" for "Bruno who loved biscuits", or "Zurich" for "Zurich ski slope")
    const matchedDistinctive = keyExpectedTokens.filter((kt) =>
      subTokens.some((st) => st === kt || isFuzzyWordMatch(st, kt))
    );

    if (matchedDistinctive.length > 0) {
      // Make sure the submitted answer isn't solely a generic category word
      const subNonGeneric = subTokens.filter((t) => !STOP_WORDS.has(t) && !GENERIC_CATEGORY_WORDS.has(t));
      if (subNonGeneric.length > 0 || matchedDistinctive.length >= keyExpectedTokens.length) {
        return {
          is_verified: true,
          confidence: 0.95,
          reasoning: `Verified: User successfully recalled key cognitive anchor (${matchedDistinctive.join(", ")})`,
        };
      }
    }

    // Rule 4: High token overlap (> 60% of all content tokens match)
    const contentExpTokens = expTokens.filter((t) => !STOP_WORDS.has(t));
    const matchedContent = contentExpTokens.filter((et) =>
      subTokens.some((st) => st === et || isFuzzyWordMatch(st, et))
    );
    if (contentExpTokens.length > 0 && matchedContent.length / contentExpTokens.length >= 0.6) {
      return {
        is_verified: true,
        confidence: 0.90,
        reasoning: "Verified: High semantic token match with stored memory answer",
      };
    }
  }

  return {
    is_verified: false,
    confidence: 0.04,
    reasoning: "Answer does not match stored memory anchor",
  };
}
