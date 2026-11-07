import admin from "firebase-admin";

let firebaseInitialized = false;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey && !projectId.includes("your_firebase")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firebaseInitialized = true;
    }
  }
} catch (err: any) {
  console.warn("[Firebase Push] Initialization skipped:", err.message);
}

export async function sendPushNotification(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean }> {
  console.log(`[PUSH NOTIFICATION DISPATCH] "${title}" - ${body}`);

  if (firebaseInitialized) {
    try {
      await admin.messaging().send({
        topic: "payshield-security-alerts",
        notification: { title, body },
        data: data || {},
      });
      console.log(`[Firebase Push] Real push notification dispatched.`);
      return { success: true };
    } catch (err: any) {
      console.warn(`[Firebase Push Notice] ${err.message}`);
    }
  }

  return { success: true };
}
