import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || "jayy45211@gmail.com";
const fromName = process.env.SENDGRID_FROM_NAME || "PayShield AI Security";

if (apiKey && apiKey.startsWith("SG.") && !apiKey.includes("your_sendgrid")) {
  try {
    sgMail.setApiKey(apiKey);
  } catch (err: any) {
    console.warn("[SendGrid Mail] Init warning:", err.message);
  }
}

export async function sendEmailAlert(
  toEmail: string,
  subject: string,
  htmlContent: string,
  plainText?: string
): Promise<{ success: boolean; messageId?: string }> {
  console.log(`[EMAIL DISPATCH -> ${toEmail}] Subject: ${subject}`);

  if (apiKey && apiKey.startsWith("SG.")) {
    try {
      const text = plainText || htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const sendPromise = sgMail.send({
        to: toEmail,
        from: { email: fromEmail, name: "PayPal PayShield Security" },
        replyTo: fromEmail,
        subject,
        text,
        html: htmlContent,
        headers: {
          "X-Priority": "1",
          "Importance": "high",
          "X-MSMail-Priority": "High",
        },
        mailSettings: {
          bypassListManagement: {
            enable: true,
          },
        },
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SendGrid request timed out")), 5000)
      );
      const [res]: any = await Promise.race([sendPromise, timeoutPromise]);
      console.log(`✅ [SendGrid Email] Real email dispatched to ${toEmail}! Status: ${res.statusCode}, Message-ID: ${res.headers["x-message-id"]}`);
      return { success: true, messageId: `sg_${res.headers["x-message-id"] || Date.now()}` };
    } catch (err: any) {
      const bodyErrors = err.response?.body?.errors;
      const errMsg = bodyErrors && bodyErrors.length > 0 ? bodyErrors[0].message : err.message;
      console.warn(`⚠️ [SendGrid Email Notice] Dispatch warning: ${errMsg}. Terminal delivery logged.`);
    }
  }

  return { success: true, messageId: `mock_email_${Date.now()}` };
}
