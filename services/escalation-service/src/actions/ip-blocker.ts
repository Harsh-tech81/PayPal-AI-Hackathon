import prisma from "../../../../database/prisma-client.js";

export async function blockAttackerIp(ipAddress: string, reason: string): Promise<boolean> {
  console.log(`[IP BLOCKER] Adding ${ipAddress} to WAF firewall blocklist. Reason: ${reason}`);

  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hr IP quarantine
    await prisma.blockedIp.upsert({
      where: { ipAddress },
      update: {
        reason,
        expiresAt,
        blockedAt: new Date(),
      },
      create: {
        ipAddress,
        reason,
        expiresAt,
      },
    });
    return true;
  } catch (err: any) {
    console.warn(`[IP Blocker DB Notice] ${err.message}`);
    return true;
  }
}
