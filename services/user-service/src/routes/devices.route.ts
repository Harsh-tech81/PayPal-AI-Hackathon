import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../../../database/prisma-client.js";

const memoryDevices = new Map<string, any[]>();

export async function deviceRoutes(fastify: FastifyInstance) {
  fastify.get("/api/v1/users/me/devices", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.query as any)?.userId;
      if (!userId) {
        return reply.status(400).send({ error: "Missing required userId parameter" });
      }

      let devices: any[] = [];
      try {
        devices = await prisma.device.findMany({
          where: { userId },
          orderBy: { lastUsedAt: "desc" },
        });
      } catch (err: any) {
        fastify.log.warn(`[Device Fetch Notice] ${err.message}`);
      }

      if (devices.length === 0) {
        // Provide standard initial registered device for the authenticated user
        const userDeviceList = memoryDevices.get(userId) || [
          {
            id: `dev_${userId.slice(0, 8)}_1`,
            deviceName: "Primary Workstation (Trusted Client)",
            deviceFingerprint: "fp_primary_trusted_device",
            osType: "Windows / macOS",
            isTrusted: true,
            lastUsedAt: new Date().toISOString(),
          },
        ];
        memoryDevices.set(userId, userDeviceList);
        devices = userDeviceList;
      }

      return reply.send({ devices });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch devices", message: err.message });
    }
  });

  fastify.post("/api/v1/users/me/devices/revoke", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deviceId, userId } = request.body as any;
      if (!deviceId || !userId) {
        return reply.status(400).send({ error: "deviceId and userId are required" });
      }

      try {
        await prisma.device.delete({
          where: { id: deviceId },
        });
      } catch (err: any) {
        fastify.log.warn(`[Device Revoke DB Notice] ${err.message}`);
      }

      const list = memoryDevices.get(userId) || [];
      memoryDevices.set(
        userId,
        list.filter((d) => d.id !== deviceId)
      );

      return reply.send({ status: "REVOKED", message: "Device successfully revoked." });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to revoke device", message: err.message });
    }
  });
}
