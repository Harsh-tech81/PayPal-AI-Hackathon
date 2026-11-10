import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { sendEmailAlert } from "../channels/email-channel.js";
import prisma from "../../../../database/prisma-client.js";

export async function receiptRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/alerts/receipt", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        senderEmail?: string;
        userId?: string;
        recipientEmail: string;
        amount: number;
        currency?: string;
        transactionId: string;
        verificationMethod?: string;
        date?: string;
      };

      let toEmail = body.senderEmail || "";

      // ── BUG FIX #3 & #4: Only send receipt to the verified sender, never
      // to the recipient email typed in the payment form.
      // The recipient's email (body.recipientEmail) is ONLY used in the email
      // body text to show who the payment was sent TO — it must NEVER become
      // the delivery address.
      //
      // We look up the sender strictly by userId. We NO LONGER fall back to
      // "most recently created user" (prisma.user.findFirst) because that
      // could accidentally resolve to the recipient if they registered recently.
      // ────────────────────────────────────────────────────────────────────────
      if (!toEmail && body.userId) {
        try {
          const user = await prisma.user.findUnique({ where: { id: body.userId } });
          if (user?.email && !user.email.includes("example.com")) {
            toEmail = user.email;
          }
        } catch (dbErr: any) {
          fastify.log.warn(`[Receipt User Lookup Notice] ${dbErr.message}`);
        }
      }

      // Safety guard: never send the receipt to the recipient's email address
      if (toEmail && toEmail.trim().toLowerCase() === (body.recipientEmail || "").trim().toLowerCase()) {
        fastify.log.warn(`[Receipt Safety] Prevented sending receipt to recipient email (${toEmail}). Routing to fallback.`);
        toEmail = "";
      }

      if (!toEmail || toEmail.includes("example.com")) {
        toEmail = "saurabhkumar1542007@gmail.com";
      }

      const amountFormatted = `$${Number(body.amount || 0).toFixed(2)} ${body.currency || "USD"}`;
      const txnDate = body.date || new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
      const txnId = body.transactionId || `TXN_${Date.now()}`;
      const method = body.verificationMethod || "PayShield AI Cognitive Interception (< 400ms)";

      const subject = `Receipt for your PayPal payment of ${amountFormatted} to ${body.recipientEmail}`;

      const plainText = `PayPal PayShield Confirmation: You sent ${amountFormatted} to ${body.recipientEmail} on ${txnDate}. Transaction ID: ${txnId}. Verification: ${method}. Funds transferred safely.`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; color: #0f172a; margin: 0; padding: 24px; }
            .card { background: #ffffff; border-radius: 16px; padding: 32px; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { border-bottom: 2px solid #0070ba; padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
            .badge { background: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; display: inline-block; margin-bottom: 16px; border: 1px solid #a7f3d0; }
            .stat-box { background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0; }
            .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 13px; }
            .amount { font-size: 28px; font-weight: 900; color: #003087; margin: 12px 0; }
            .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2 style="margin: 0; color: #003087; font-size: 24px; font-weight: 900;">Pay<span style="color: #0070ba;">Pal</span></h2>
              <span style="font-size: 11px; font-weight: bold; color: #64748b; background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">PayShield Protected</span>
            </div>
            
            <span class="badge">✅ PAYMENT COMPLETED & DELIVERED</span>
            
            <p style="margin: 0; color: #64748b; font-size: 13px;">You sent a payment to <strong>${body.recipientEmail}</strong></p>
            <div class="amount">${amountFormatted}</div>

            <div class="stat-box">
              <div class="stat-row"><span style="color: #64748b;">Transaction ID:</span> <strong style="font-family: monospace;">${txnId}</strong></div>
              <div class="stat-row"><span style="color: #64748b;">Recipient:</span> <strong>${body.recipientEmail}</strong></div>
              <div class="stat-row"><span style="color: #64748b;">Payment Date:</span> <span>${txnDate}</span></div>
              <div class="stat-row"><span style="color: #64748b;">Security Gate:</span> <strong style="color: #0070ba;">${method}</strong></div>
              <div class="stat-row" style="border: none;"><span style="color: #64748b;">PayPal Status:</span> <strong style="color: #059669;">Completed & Cleared</strong></div>
            </div>

            <p style="font-size: 12px; color: #64748b; line-height: 1.6;">
              This transaction was protected by <strong>PayShield AI Cognitive Interception</strong> with sub-400ms semantic verification.
            </p>

            <div class="footer">
              PayPal PayShield Security • 2211 North First Street, San Jose, CA 95131
            </div>
          </div>
        </body>
        </html>
      `;

      const emailRes = await sendEmailAlert(toEmail, subject, html, plainText);

      // Record to Prisma PostgreSQL if available
      try {
        await prisma.alertLog.create({
          data: {
            userId: body.userId || "a0000000-0000-0000-0000-000000000001",
            channel: "email_receipt",
            message: `Payment of ${amountFormatted} sent to ${body.recipientEmail}. Transaction ID: ${txnId}`,
            delivered: emailRes.success,
          },
        });
      } catch (dbErr: any) {
        fastify.log.warn(`[Receipt DB Log Notice] ${dbErr.message}`);
      }

      return reply.send({
        status: "RECEIPT_DISPATCHED",
        recipient: toEmail,
        transactionId: txnId,
        amount: body.amount,
        dispatched: emailRes.success,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to dispatch receipt email", message: err.message });
    }
  });
}
