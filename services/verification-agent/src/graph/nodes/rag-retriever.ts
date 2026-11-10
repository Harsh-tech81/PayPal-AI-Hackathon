import { MongoClient } from "mongodb";
import { VerificationState } from "../state.js";
import { decryptSecret } from "@payshield/shared";
import { sanitizeMongoUri } from "../../../../../database/connection-sanitizer.js";

/**
 * Node 2: Contextual RAG Memory Anchor Retriever
 * Queries MongoDB vault for the user's encrypted memories and semantically selects
 * the most relevant anchor for the transaction context.
 */

// Fallback memory anchors if MongoDB is unavailable or empty - 10 Presets
const DEFAULT_USER_ANCHORS = [
  {
    id: "anc_01",
    category: "memory_anchors",
    prompt: "Name of your first childhood dog and their favorite snack",
    plainAnswer: "Bruno who loved biscuits",
    hint: "Childhood family pet",
  },
  {
    id: "anc_02",
    category: "memory_anchors",
    prompt: "What secret pet name did your grandmother call you when sick?",
    plainAnswer: "Sunshine",
    hint: "Private grandmother nickname",
  },
  {
    id: "anc_03",
    category: "memory_anchors",
    prompt: "Where did you take a cold tumble during a winter vacation?",
    plainAnswer: "Zurich ski slope",
    hint: "Winter vacation incident",
  },
  {
    id: "anc_04",
    category: "secret_habits",
    prompt: "What odd food combination do you secretly eat when alone?",
    plainAnswer: "Fries with chocolate shake",
    hint: "Quirky comfort habit",
  },
  {
    id: "anc_05",
    category: "secret_habits",
    prompt: "What song do you always sing in the shower when stressed?",
    plainAnswer: "Bohemian Rhapsody",
    hint: "Personal private routine",
  },
  {
    id: "anc_06",
    category: "secret_habits",
    prompt: "What was the very first item you bought with your own earned paycheck?",
    plainAnswer: "Blue guitar strap",
    hint: "Personal milestone item",
  },
  {
    id: "anc_07",
    category: "pattern_sequences",
    prompt: "Your secret lucky 3-digit number and the reason behind it",
    plainAnswer: "742 first apartment",
    hint: "Private cognitive association",
  },
  {
    id: "anc_08",
    category: "pattern_sequences",
    prompt: "The street name of the house where you fell and bruised your knee as a child",
    plainAnswer: "Elm Street alley",
    hint: "Childhood landmark",
  },
  {
    id: "anc_09",
    category: "pattern_sequences",
    prompt: "The nickname of your favorite elementary school teacher",
    plainAnswer: "Captain Green",
    hint: "School memory",
  },
  {
    id: "anc_10",
    category: "memory_anchors",
    prompt: "The color and make of your family's oldest road-trip car",
    plainAnswer: "Rusty red wagon",
    hint: "Sentimental family anchor",
  },
];

let cachedRAGClient: MongoClient | null = null;

async function getRAGMongoClient(): Promise<MongoClient | null> {
  const mongoConfig = sanitizeMongoUri(process.env.MONGODB_URI);
  if (!mongoConfig.isValid || !mongoConfig.uri) {
    return null;
  }

  if (cachedRAGClient) {
    return cachedRAGClient;
  }

  try {
    const client = new MongoClient(mongoConfig.uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("MongoDB connect timeout")), 8000)
    );
    await Promise.race([connectPromise, timeoutPromise]);
    cachedRAGClient = client;
    return cachedRAGClient;
  } catch (err: any) {
    console.warn(`[RAG Node MongoDB Notice] ${err.message}. Using contextual memory fallback.`);
    return null;
  }
}

export async function ragRetrieverNode(state: VerificationState): Promise<Partial<VerificationState>> {
  try {
    const client = await getRAGMongoClient();
    if (client) {
      const db = client.db();
      const safeUserId = String(state.userId);
      const doc = await db.collection("intent_forms").findOne({ userId: safeUserId });

      if (doc && Array.isArray(doc.anchors) && doc.anchors.length > 0) {
        // Randomly select across user anchors to provide a varied challenge every step
        const randomIndex = Math.floor(Math.random() * doc.anchors.length);
        const picked = doc.anchors[randomIndex];
        let plainAnswer = "Bruno";
        try {
          plainAnswer = decryptSecret(picked.encryptedAnswer);
        } catch {
          plainAnswer = picked.plainAnswer || picked.answer || "Bruno";
        }

        // Asynchronously touch lastUsedAt
        db.collection("intent_forms")
          .updateOne(
            { userId: safeUserId, "anchors.id": picked.id },
            { $set: { "anchors.$.lastUsedAt": new Date() } }
          )
          .catch(() => {});

        return {
          selectedAnchor: {
            id: picked.id,
            prompt: picked.prompt,
            plainAnswer: plainAnswer,
            hint: picked.hint,
          },
        };
      }
    }
  } catch (err: any) {
    console.warn("[RAG Node] MongoDB fetch error, using contextual fallback:", err.message);
  }

  try {
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:8001";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${USER_SERVICE_URL}/api/v1/intent-form/internal-vault/${encodeURIComponent(state.userId)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data && Array.isArray(data.anchors) && data.anchors.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.anchors.length);
        const picked = data.anchors[randomIndex];
        return {
          selectedAnchor: {
            id: picked.id,
            prompt: picked.prompt,
            plainAnswer: picked.plainAnswer || picked.answer,
            hint: picked.hint,
          },
        };
      }
    }
  } catch (err: any) {
    console.warn("[RAG Node] user-service fetch notice:", err.message);
  }

  // Fallback anchor: randomly rotate among all 10 presets
  const randomFallbackIndex = Math.floor(Math.random() * DEFAULT_USER_ANCHORS.length);
  const fallback = DEFAULT_USER_ANCHORS[randomFallbackIndex];
  return {
    selectedAnchor: {
      id: fallback.id,
      prompt: fallback.prompt,
      plainAnswer: fallback.plainAnswer,
      hint: fallback.hint,
    },
  };
}
