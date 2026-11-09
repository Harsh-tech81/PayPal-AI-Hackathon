import prisma from "../../../../database/prisma-client.js";

const memoryLedger: any[] = [];

export const transactionRepository = {
  async createTransaction(data: {
    senderId: string;
    recipientEmail: string;
    amount: number;
    currency?: string;
    description?: string;
    status: string;
    riskScore?: number;
    verificationMethod?: string;
    ipAddress?: string;
  }) {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record = {
      id,
      senderId: data.senderId,
      recipientEmail: data.recipientEmail,
      amount: data.amount,
      currency: data.currency || "USD",
      description: data.description || null,
      status: data.status,
      riskScore: data.riskScore ?? 0.0,
      verificationMethod: data.verificationMethod || "auto",
      ipAddress: data.ipAddress || null,
      createdAt: new Date(),
    };

    try {
      const created = await prisma.transaction.create({
        data: {
          senderId: data.senderId,
          recipientEmail: data.recipientEmail,
          amount: data.amount,
          currency: data.currency || "USD",
          description: data.description,
          status: data.status,
          riskScore: data.riskScore,
          verificationMethod: data.verificationMethod,
          ipAddress: data.ipAddress,
        },
      });
      memoryLedger.unshift(created);
      return created;
    } catch (err: any) {
      console.warn(`[Txn Repo Notice] ${err.message}. Saved to resilient memory ledger.`);
      memoryLedger.unshift(record);
      return record;
    }
  },

  async updateStatus(id: string, status: string) {
    try {
      await prisma.transaction.update({
        where: { id },
        data: { status },
      });
    } catch (err: any) {
      console.warn(`[Txn Update DB Notice] ${err.message}`);
    }
    const item = memoryLedger.find((t) => t.id === id);
    if (item) item.status = status;
  },

  async getHistory(senderId: string, limit: number = 20) {
    const now = Date.now();

    // Auto-expire stale "verifying" transactions older than 60 seconds
    for (const t of memoryLedger) {
      if (t.status === "verifying" && t.createdAt) {
        const age = now - new Date(t.createdAt).getTime();
        if (age > 60000) {
          t.status = "UNVERIFIED";
        }
      }
    }

    try {
      const list = await prisma.transaction.findMany({
        where: { senderId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      if (list.length > 0) {
        return list.map((t: any) => {
          if (t.status === "verifying" && t.createdAt) {
            const age = now - new Date(t.createdAt).getTime();
            if (age > 60000) {
              return { ...t, status: "UNVERIFIED" };
            }
          }
          return t;
        });
      }
    } catch (err: any) {
      console.warn(`[Txn History DB Notice] ${err.message}`);
    }
    return memoryLedger.filter((t) => !senderId || t.senderId === senderId).slice(0, limit);
  },
};
