import { MongoClient } from "mongodb";
import { StoredIntentDocument } from "@payshield/shared";
import { sanitizeMongoUri } from "../../../../database/connection-sanitizer.js";

const memoryVault = new Map<string, StoredIntentDocument>();
let cachedMongoClient: MongoClient | null = null;

async function getConnectedMongoClient(): Promise<MongoClient | null> {
  const mongoConfig = sanitizeMongoUri(process.env.MONGODB_URI);
  if (!mongoConfig.isValid || !mongoConfig.uri) {
    return null;
  }

  if (cachedMongoClient) {
    return cachedMongoClient;
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
    cachedMongoClient = client;
    return cachedMongoClient;
  } catch (err: any) {
    console.warn(`[Intent Vault MongoDB Connect Notice] ${err.message}. Operating in resilient memory mode.`);
    return null;
  }
}

export const intentRepository = {
  async saveIntentSecrets(doc: StoredIntentDocument): Promise<boolean> {
    const safeUserId = String(doc.userId);
    memoryVault.set(safeUserId, { ...doc, userId: safeUserId });

    try {
      const client = await getConnectedMongoClient();
      if (client) {
        const db = client.db();
        await db.collection("intent_forms").updateOne(
          { userId: safeUserId },
          {
            $set: {
              userId: safeUserId,
              anchors: doc.anchors,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
        return true;
      }
    } catch (err: any) {
      console.warn(`[Intent Vault MongoDB Notice] ${err.message}. Saved to resilient memory vault.`);
    }

    return true;
  },

  async getIntentSecrets(userId: string): Promise<StoredIntentDocument | null> {
    const safeUserId = String(userId);

    try {
      const client = await getConnectedMongoClient();
      if (client) {
        const db = client.db();
        const found = await db.collection("intent_forms").findOne({ userId: safeUserId });
        if (found) return found as unknown as StoredIntentDocument;
      }
    } catch (err: any) {
      console.warn(`[Intent Vault MongoDB Notice] ${err.message}`);
    }

    return memoryVault.get(safeUserId) || null;
  },

  async clearIntentSecrets(userId: string): Promise<boolean> {
    const safeUserId = String(userId);
    memoryVault.delete(safeUserId);

    try {
      const client = await getConnectedMongoClient();
      if (client) {
        const db = client.db();
        await db.collection("intent_forms").deleteOne({ userId: safeUserId });
        return true;
      }
    } catch (err: any) {
      console.warn(`[Intent Vault MongoDB Notice] ${err.message}. Cleared from memory vault.`);
    }

    return true;
  },
};
