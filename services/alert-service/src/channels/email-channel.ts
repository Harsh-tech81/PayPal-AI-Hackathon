import { sendUnifiedEmail } from "@payshield/shared";

/**
 * Dispatches high-deliverability security alert emails via Nodemailer Gmail SMTP.
 */
export async function sendEmailAlert(
  toEmail: string,
  subject: string,
  htmlContent: string,
  plainText?: string
): Promise<{ success: boolean; messageId?: string }> {
  console.log(`[EMAIL DISPATCH -> ${toEmail}] Subject: ${subject}`);
  const result = await sendUnifiedEmail({
    to: toEmail,
    subject,
    html: htmlContent,
    text: plainText,
    fromName: "PayPal PayShield Security",
  });
  return { success: result.success, messageId: result.messageId };
}
