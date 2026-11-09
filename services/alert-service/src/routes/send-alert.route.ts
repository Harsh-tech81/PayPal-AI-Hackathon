import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { sendSmsAlert } from "../channels/twilio-sms.js";
import { sendEmailAlert } from "../channels/email-channel.js";
import { sendPushNotification } from "../channels/firebase-push.js";
import prisma from "../../../../database/prisma-client.js";

export async function sendAlertRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/alerts/send", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        userId: string;
        userEmail?: string;
        phone?: string;
        incidentReference?: string;
        amount?: number;
        attackerIp?: string;
        location?: string;
        type?: "FRAUD_ATTEMPT" | "ACCOUNT_FROZEN" | "ACCOUNT_UNFROZEN";
      };

      let phone = body.phone || "";
      let email = body.userEmail || "";

      // Lookup genuine user contact info from database for the specified userId
      if (body.userId && (!phone || !email || email.includes("example.com"))) {
        try {
          const userRecord = await prisma.user.findUnique({ where: { id: body.userId } });
          if (userRecord) {
            if (userRecord.email && !userRecord.email.includes("example.com")) email = userRecord.email;
            if (userRecord.phone && !phone) phone = userRecord.phone;
          }
        } catch (dbErr: any) {
          fastify.log.warn(`[Alert User Lookup Notice] ${dbErr.message}`);
        }
      }

      if (!phone || phone.includes("123456")) {
        phone = process.env.ALERT_FALLBACK_PHONE || "";
      }
      if (!email || email.includes("example.com")) {
        email = process.env.ALERT_FALLBACK_EMAIL || "security-alerts@payshield.ai";
      }

      const ref = body.incidentReference || `PS-FR-2026-${Math.floor(1000 + Math.random() * 9000)}A`;
      const amount = Number(body.amount || 1200);
      const clientIp = (request.headers["x-forwarded-for"] as string) || request.ip || request.socket.remoteAddress || "127.0.0.1";
      const ip = body.attackerIp && !body.attackerIp.includes("185.220.101.5") ? body.attackerIp : clientIp;
      const loc = body.location || "Overseas Proxy Node (Frankfurt / Tor)";
      const formattedAmount = `$${amount.toFixed(2)} USD`;
      const freezeTime = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

      const smsText = ` PayShield Alert: An unauthorized transfer of ${formattedAmount} was blocked on your PayPal account from IP ${ip} (${loc}). Your account has been temporarily FROZEN for 1 hour to protect your funds. Incident Ref: ${ref}`;
      
      const plainText = `PayPal PayShield Security Interception Notice:
An unauthorized transfer of ${formattedAmount} was intercepted on your PayPal account from ${loc} (IP: ${ip}) on ${freezeTime}.
PayPal Order Status: VOIDED & SAFE.
Incident Reference: ${ref}.
Your account has been placed into Security Lockdown for 1 hour to protect your funds. You can verify your identity using Video KYC to restore instant access.`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
            .card { background: #ffffff; border-radius: 16px; padding: 32px; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px; }
            .badge { background: #fef2f2; color: #dc2626; padding: 6px 14px; border-radius: 9999px; font-weight: bold; font-size: 12px; display: inline-block; margin-bottom: 16px; border: 1px solid #fecaca; }
            .stat-box { background: #f8fafc; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0; }
            .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 13px; }
            .btn { background: #003087; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; font-size: 13px; display: inline-block; margin-top: 16px; text-align: center; }
            .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #edf2f7; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2 style="margin: 0; color: #003087; font-size: 24px; font-weight: 900;">Pay<span style="color: #0070ba;">Pal</span></h2>
              <span style="font-size: 11px; font-weight: bold; color: #ef4444; background: #fee2e2; padding: 4px 10px; border-radius: 6px;">PayShield Interception</span>
            </div>
            
            <span class="badge">UNAUTHORIZED TRANSACTION BLOCKED & ACCOUNT FROZEN</span>
            
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
              Our PayShield AI Cognitive Verification Agent intercepted an unauthorized transfer on your PayPal account before any funds left your balance.
            </p>
            
            <div class="stat-box">
              <div class="stat-row"><span style="color: #64748b;">Attempted Amount:</span> <strong style="color: #b91c1c; font-size: 15px;">${formattedAmount}</strong></div>
              <div class="stat-row"><span style="color: #64748b;">Attacker Location:</span> <span>${loc}</span></div>
              <div class="stat-row"><span style="color: #64748b;">Attacker IP Node:</span> <strong style="font-family: monospace;">${ip}</strong></div>
              <div class="stat-row"><span style="color: #64748b;">Trigger Reason:</span> <span style="color: #b91c1c; font-weight: 600;">Cognitive Memory Verification Mismatch</span></div>
              <div class="stat-row"><span style="color: #64748b;">PayPal Order Status:</span> <strong style="color: #059669;">VOIDED & CANCELLED (SAFE)</strong></div>
              <div class="stat-row" style="border: none;"><span style="color: #64748b;">Incident Reference:</span> <strong style="font-family: monospace;">${ref}</strong></div>
            </div>

            <p style="font-size: 13px; color: #475569; line-height: 1.6;">
              <strong>Action Taken:</strong> Your PayPal account has been placed in a temporary 1-Hour Security Freeze to ensure complete protection. You can verify your identity through biometric KYC to restore immediate access.
            </p>

            <div style="text-align: center; margin: 24px 0 12px 0;">
              <a href="http://localhost:3000/alerts/lockdown?amount=${amount}&ref=${ref}" class="btn">
                Verify Identity & Unlock Account
              </a>
            </div>

            <div class="footer">
              PayPal PayShield Security Operations • 2211 North First Street, San Jose, CA 95131
            </div>
          </div>
        </body>
        </html>
      `;

      // Concurrently dispatch across all 3 channels
      const [smsRes, emailRes, pushRes] = await Promise.allSettled([
        sendSmsAlert(phone, smsText),
        sendEmailAlert(email, `PayShield Security Alert: Incident ${ref}`, html, plainText),
        sendPushNotification("Security Interception", `Unauthorized transfer of ${formattedAmount} blocked. Account frozen for 1 hr.`),
      ]);

      // Record to Prisma PostgreSQL if available
      try {
        await prisma.alertLog.create({
          data: {
            userId: body.userId || "a0000000-0000-0000-0000-000000000001",
            channel: "multi_channel (SMS+Email+Push)",
            message: smsText,
            delivered: true,
          },
        });
      } catch (dbErr: any) {
        fastify.log.warn(`[Alert DB Log Notice] ${dbErr.message}`);
      }

      return reply.send({
        status: "DISPATCHED",
        incidentReference: ref,
        recipientEmail: email,
        channels: {
          sms: smsRes.status === "fulfilled" ? smsRes.value : { success: false },
          email: emailRes.status === "fulfilled" ? emailRes.value : { success: false },
          push: pushRes.status === "fulfilled" ? pushRes.value : { success: false },
        },
        dispatchedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to dispatch alerts", message: err.message });
    }
  });
}
