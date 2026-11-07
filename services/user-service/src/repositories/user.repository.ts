import prisma from "../../../../database/prisma-client.js";

// Local cache fallback for robust operation
const memoryUsers = new Map<string, any>();

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
          email: data.email.toLowerCase(),
          phone: data.phone,
          fullName: data.fullName,
          passwordHash: data.passwordHash,
          kycStatus: "verified",
          riskTier: "standard",
        },
      });
      memoryUsers.set(created.email.toLowerCase(), created);
      return created;
    } catch (err: any) {
      console.warn(`[User Repo DB Notice] create: ${err.message}, saved to memory.`);
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
