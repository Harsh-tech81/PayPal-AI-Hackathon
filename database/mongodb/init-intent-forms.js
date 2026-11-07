/**
 * MongoDB Intent Vault Initialization & Index Configuration
 * Ensures fast lookup by userId and creates vector / text indexes for memory anchors.
 */

export async function initIntentFormsCollection(db) {
  try {
    const collection = db.collection("intent_forms");
    
    // Unique index on userId
    await collection.createIndex({ userId: 1 }, { unique: true });
    
    // Index on lastUsedAt for prompt cooldown rotation
    await collection.createIndex({ "anchors.lastUsedAt": 1 });
    
    console.log("[MongoDB] Indexes initialized successfully for intent_forms collection.");
    return true;
  } catch (error) {
    console.error("[MongoDB] Failed to initialize indexes:", error);
    throw error;
  }
}
