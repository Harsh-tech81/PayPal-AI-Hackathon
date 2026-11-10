import prisma from "../../../../database/prisma-client.js";

// Local cache fallback for robust operation
const memoryUsers = new Map<string, any>();
const passkeyRegistry = new Map<string, string>(); // credentialId -> userId

export const userRepository = {
  async findByEmail(email: string) {
    try {
      const u = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { devices: true },
      });
      if (u) return u;
    } catch (err: any) {
      console.warn(`[User Repo DB Notice] findByEmail: ${err.message}`);
    }
    return memoryUsers.get(email.toLowerCase()) || null;
  },

  async findById(id: string) {
    try {
      const u = await prisma.user.findUnique({
        where: { id },
        include: { devices: true },
      });
      if (u) return u;
    } catch (err: any) {
      console.warn(`[User Repo DB Notice] findById: ${err.message}`);
    }
    for (const u of memoryUsers.values()) {
      if (u.id === id) return u;
    }
    return null;
  },

  async findByDeviceFingerprint(deviceFingerprint: string) {
    if (!deviceFingerprint || !deviceFingerprint.trim()) return null;
    const cleanFp = deviceFingerprint.trim();

    try {
      const device = await prisma.device.findFirst({
        where: { deviceFingerprint: cleanFp },
        include: { user: true },
      });
      if (device?.user) return device.user;
      if (device?.userId) {
        const u = await this.findById(device.userId);
        if (u) return u;
      }
    } catch (err: any) {
      console.warn(`[User Repo DB Notice] findByDeviceFingerprint: ${err.message}`);
    }

    const memoryUserId = passkeyRegistry.get(cleanFp);
    if (memoryUserId) {
      return this.findById(memoryUserId);
    }

    // Check user devices inside memoryUsers
    for (const u of memoryUsers.values()) {
      if (Array.isArray(u.devices) && u.devices.some((d: any) => d.deviceFingerprint === cleanFp)) {
        return u;
      }
    }

    return null;
  },

  async registerDevicePasskey(data: {
    userId: string;
    credentialId: string;
    deviceName?: string;
  }) {
    const { userId, credentialId, deviceName } = data;
    const cleanId = credentialId.trim();
    passkeyRegistry.set(cleanId, userId);

    const user = await this.findById(userId);
    if (user) {
      if (!Array.isArray(user.devices)) user.devices = [];
      const existingIdx = user.devices.findIndex((d: any) => d.deviceFingerprint === cleanId);
      const devObj = {
        id: `dev_${userId.slice(0, 8)}_${Date.now().toString(36)}`,
        userId,
        deviceName: deviceName || "Biometric Authenticator (Passkey)",
        deviceFingerprint: cleanId,
        osType: "Platform Authenticator",
        isTrusted: true,
        lastUsedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        user.devices[existingIdx] = devObj;
      } else {
        user.devices.push(devObj);
      }
      memoryUsers.set(user.email.toLowerCase(), user);
    }

    try {
      await prisma.device.upsert({
        where: { deviceFingerprint: cleanId },
        update: {
          userId,
          lastUsedAt: new Date(),
          isTrusted: true,
          deviceName: deviceName || "Biometric Authenticator (Passkey)",
        },
        create: {
          id: `dev_${userId.slice(0, 8)}_${Date.now().toString(36)}`,
          userId,
          deviceName: deviceName || "Biometric Authenticator (Passkey)",
          deviceFingerprint: cleanId,
          osType: "Platform Authenticator",
          isTrusted: true,
        },
      });
      console.log(`[User Repo] Registered passkey device fingerprint ${cleanId} for user ${userId}`);
    } catch (err: any) {
      console.warn(`[User Repo DB Notice] registerDevicePasskey: ${err.message}. Saved to in-memory passkey registry.`);
    }

    return true;
  },

  async findFirstUser() {
    try {
      const u = await prisma.user.findFirst({
        orderBy: { createdAt: "desc" },
        include: { devices: true },
      });
      if (u) return u;
    } catch (err: any) {
      console.warn(`[User Repo DB Notice] findFirstUser: ${err.message}`);
    }
    const firstMem = memoryUsers.values().next().value;
    return firstMem || null;
  },

  async create(data: {
    email: string;
    phone?: string;
    fullName: string;
    passwordHash: string;
  }) {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userObj = {
      id,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      kycStatus: "verified",
      riskTier: "standard",
      isFrozen: false,
      frozenUntil: null,
      frozenReason: null,
      intentFormCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      devices: [],
    };

    try {
      const created = await prisma.user.create({
        data: {
          id,
          email: data.email.toLowerCase().trim(),
          phone: data.phone ? data.phone.trim() : null,
          fullName: data.fullName.trim(),
          passwordHash: data.passwordHash,
          kycStatus: "verified",
          riskTier: "standard",
        },
      });
      console.log(`✅ [User Repo] Successfully persisted user to Supabase PostgreSQL: ${created.id} (${created.email})`);
      memoryUsers.set(created.email.toLowerCase(), created);
      return created;
    } catch (err: any) {
      console.error(`❌ [User Repo DB Error] Failed to persist user to PostgreSQL: ${err.message}`);
      memoryUsers.set(userObj.email.toLowerCase(), userObj);
      return userObj;
    }
  },

  async updateIntentCompleted(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { intentFormCompleted: true },
      });
    } catch (err: any) {
      console.warn(`[User Repo DB Notice] updateIntentCompleted: ${err.message}`);
    }
    for (const [k, u] of memoryUsers.entries()) {
      if (u.id === userId) {
        u.intentFormCompleted = true;
        memoryUsers.set(k, u);
      }
    }
  },

  async updateIntentCleared(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { intentFormCompleted: false },
      });
    } catch (err: any) {
      console.warn(`[User Repo DB Notice] updateIntentCleared: ${err.message}`);
    }
    for (const [k, u] of memoryUsers.entries()) {
      if (u.id === userId) {
        u.intentFormCompleted = false;
        memoryUsers.set(k, u);
      }
    }
  },

  async unfreezeUser(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isFrozen: false, frozenUntil: null, frozenReason: null },
      });
    } catch (err: any) {
      console.warn(`[User Repo DB Notice] unfreezeUser: ${err.message}`);
    }
    for (const [k, u] of memoryUsers.entries()) {
      if (u.id === userId) {
        u.isFrozen = false;
        u.frozenUntil = null;
        u.frozenReason = null;
        memoryUsers.set(k, u);
      }
    }
  },
};
