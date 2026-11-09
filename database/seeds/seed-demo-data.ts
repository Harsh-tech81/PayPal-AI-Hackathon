import prisma from "../prisma-client.js";
import { MongoClient } from "mongodb";
import { hashPassword } from "../../packages/shared/src/security/argon2-hasher.js";
import { encryptSecret, serializeEncryptedPayload } from "../../packages/shared/src/security/aes-encryptor.js";
import { sanitizeMongoUri } from "../connection-sanitizer.js";
import dotenv from "dotenv";

dotenv.config();

export async function seedDemoData() {
  console.log("🌱 Starting PayShield AI production initialization seed...");

  try {
    // 1. Seed Primary Account Holder (India region)
    const passwordHash = await hashPassword("Password123!");
    const primaryUser = await prisma.user.upsert({
      where: { email: "rajesh.kumar@domain.in" },
      update: {
        isFrozen: false,
        frozenUntil: null,
        frozenReason: null,
        intentFormCompleted: true,
      },
      create: {
        id: "a0000000-0000-0000-0000-000000000001",
        email: "rajesh.kumar@domain.in",
        phone: "+919876543210",
        fullName: "Rajesh Kumar",
        passwordHash: passwordHash,
        kycStatus: "verified",
        riskTier: "standard",
        isFrozen: false,
        intentFormCompleted: true,
      },
    });

    console.log(`✅ Seeded User: ${primaryUser.fullName} (${primaryUser.email})`);

    // 2. Seed Verified Business Partner
    const partnerPasswordHash = await hashPassword("Password123!");
    const partner = await prisma.user.upsert({
      where: { email: "partner-merchant@domain.in" },
      update: {},
      create: {
        id: "b0000000-0000-0000-0000-000000000002",
        email: "partner-merchant@domain.in",
        phone: "+919876543211",
        fullName: "Merchant Services India",
        passwordHash: partnerPasswordHash,
        kycStatus: "verified",
        riskTier: "standard",
        isFrozen: false,
        intentFormCompleted: true,
      },
    });

    // 3. Seed Primary User's Trusted Device (Bengaluru, India)
    await prisma.device.upsert({
      where: { deviceFingerprint: "fp_primary_trusted_device" },
      update: {},
      create: {
        userId: primaryUser.id,
        deviceName: "Primary Workstation (Bengaluru Secure Client)",
        deviceFingerprint: "fp_primary_trusted_device",
        osType: "Windows / macOS",
        isTrusted: true,
      },
    });
    // 4. Seed Past Transactions for Dashboard Showcase
    // Routine transfer - low risk
    await prisma.transaction.create({
      data: {
        senderId: primaryUser.id,
        receiverId: partner.id,
        recipientEmail: "partner-merchant@domain.in",
        amount: 45.00,
        currency: "USD",
        description: "Local merchant services invoice",
        status: "APPROVED",
        riskScore: 0.05,
        verificationMethod: "auto",
        ipAddress: "103.212.144.10",
      },
    }).catch(() => null);

    // Tech Store - medium risk, AI-verified
    await prisma.transaction.create({
      data: {
        senderId: primaryUser.id,
        receiverId: partner.id,
        recipientEmail: "hardware-vendor@domain.in",
        amount: 280.00,
        currency: "USD",
        description: "Cloud server node reservation",
        status: "APPROVED",
        riskScore: 0.42,
        verificationMethod: "genai_challenge",
        ipAddress: "103.212.144.10",
      },
    }).catch(() => null);

    // 5. Seed Secret Memory Anchors in MongoDB Vault
    const mongoConfig = sanitizeMongoUri(process.env.MONGODB_URI);
    if (mongoConfig.isValid && mongoConfig.uri) {
      try {
        const mongoClient = new MongoClient(mongoConfig.uri, {
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000,
        });
        await mongoClient.connect();
        const db = mongoClient.db();
        const collection = db.collection("intent_forms");

        const sampleAnchors = [
          {
            id: "anc_01",
            category: "memory_anchors",
            prompt: "Name of your first childhood dog and their favorite snack",
            plainAnswer: "Bruno who loved biscuits",
            hint: "Childhood family pet and food",
          },
          {
            id: "anc_02",
            category: "memory_anchors",
            prompt: "What secret pet name did your grandmother call you when sick?",
            plainAnswer: "Sunshine",
            hint: "Affectionate grandmother nickname",
          },
          {
            id: "anc_03",
            category: "memory_anchors",
            prompt: "Where did you take a cold tumble during your 2018 winter trip?",
            plainAnswer: "Zurich ski slope",
            hint: "Winter vacation funny accident",
          },
          {
            id: "anc_04",
            category: "secret_habits",
            prompt: "What odd food combination do you secretly eat when alone?",
            plainAnswer: "Fries dipped in chocolate milkshake",
            hint: "Late-night odd comfort snack",
          },
          {
            id: "anc_05",
            category: "secret_habits",
            prompt: "What was the very first item you bought with your first salary?",
            plainAnswer: "Blue Fender guitar strap",
            hint: "First paycheck souvenir",
          },
          {
            id: "anc_06",
            category: "secret_habits",
            prompt: "What song do you sing out loud in the shower when stressed?",
            plainAnswer: "Bohemian Rhapsody",
            hint: "Shower rock classic",
          },
          {
            id: "anc_07",
            category: "pattern_sequences",
            prompt: "Your secret lucky 3-digit number and what it stands for",
            plainAnswer: "742 first apartment number",
            hint: "Old home address digits",
          },
          {
            id: "anc_08",
            category: "pattern_sequences",
            prompt: "Street where you fell and bruised your knee learning to ride a bicycle",
            plainAnswer: "Maple avenue sidewalk",
            hint: "Childhood neighborhood street",
          },
          {
            id: "anc_09",
            category: "pattern_sequences",
            prompt: "Nickname of your favorite 4th grade teacher",
            plainAnswer: "Captain Green",
            hint: "Elementary school teacher",
          },
          {
            id: "anc_10",
            category: "memory_anchors",
            prompt: "Make and color of your family's oldest road trip station wagon",
            plainAnswer: "Rusty maroon Volvo",
            hint: "Vintage family wagon",
          },
        ];

        const encryptedAnchors = sampleAnchors.map((item) => {
          const enc = encryptSecret(item.plainAnswer);
          return {
            id: item.id,
            category: item.category,
            prompt: item.prompt,
            encryptedAnswer: serializeEncryptedPayload(enc),
            hint: item.hint,
            lastUsedAt: null,
          };
        });

        await collection.updateOne(
          { userId: primaryUser.id },
          {
            $set: {
              userId: primaryUser.id,
              anchors: encryptedAnchors,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );

        console.log("✅ Seeded 10 AES-256 encrypted memory anchors into MongoDB Vault!");
        await mongoClient.close();
      } catch (mErr) {
        console.warn("[MongoDB Seed Notice] MongoDB connection skipped or failed:", mErr);
      }
    }

    console.log("🚀 Demo data seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes("seed-demo-data")) {
  seedDemoData();
}
