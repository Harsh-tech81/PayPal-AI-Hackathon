"use client";

import { useState, useEffect } from "react";
import { getSession, clearSession, saveSession, AuthSession } from "../lib/auth-session";

export function useAuth() {
  const [session, setSession] = useState<AuthSession>({ token: null, user: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getSession());
    setLoading(false);
  }, []);

  const loginUser = (token: string, user: any) => {
    saveSession(token, user);
    setSession({ token, user });
  };

  const logoutUser = () => {
    clearSession();
    setSession({ token: null, user: null });
  };

  return {
    user: session.user,
    token: session.token,
    isAuthenticated: !!session.token,
    loading,
    loginUser,
    logoutUser,
  };
}
