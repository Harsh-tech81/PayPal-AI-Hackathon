export interface AuthSession {
  token: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    isFrozen?: boolean;
    intentFormCompleted?: boolean;
  } | null;
}

export function saveSession(token: string, user: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem("payshield_token", token);
  localStorage.setItem("payshield_user_id", user.id || "");
  localStorage.setItem("payshield_user_email", user.email || "");
  localStorage.setItem("payshield_user_name", user.fullName || "User");
  localStorage.setItem("payshield_user_phone", user.phone || "");
  localStorage.setItem("payshield_user_frozen", user.isFrozen ? "true" : "false");
  localStorage.setItem("payshield_intent_completed", user.intentFormCompleted ? "true" : "false");
}

export function getSession(): AuthSession {
  if (typeof window === "undefined") return { token: null, user: null };
  const token = localStorage.getItem("payshield_token");
  const userId = localStorage.getItem("payshield_user_id");
  const email = localStorage.getItem("payshield_user_email");
  const fullName = localStorage.getItem("payshield_user_name");
  const phone = localStorage.getItem("payshield_user_phone");
  const isFrozen = localStorage.getItem("payshield_user_frozen") === "true";
  const intentFormCompleted = localStorage.getItem("payshield_intent_completed") === "true";

  if (!token || !userId) {
    return {
      token: null,
      user: null,
    };
  }

  return {
    token,
    user: {
      id: userId,
      email: email || "",
      fullName: fullName || "User",
      phone: phone || undefined,
      isFrozen,
      intentFormCompleted,
    },
  };
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("payshield_token");
  localStorage.removeItem("payshield_user_id");
  localStorage.removeItem("payshield_user_email");
  localStorage.removeItem("payshield_user_name");
  localStorage.removeItem("payshield_user_phone");
  localStorage.removeItem("payshield_user_frozen");
  localStorage.removeItem("payshield_intent_completed");
  localStorage.removeItem("payshield_intent_draft");
}
