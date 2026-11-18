import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api";
import { clearSessionToken, getSessionToken, setSessionToken } from "./session-storage";
import type { MobileSessionResponse, User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: {
    username: string;
    email: string;
    displayName: string;
    password: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getSessionToken();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await apiFetch<User>("/auth/me", { token: stored });
        if (!cancelled) {
          setToken(stored);
          setUser(me);
        }
      } catch {
        await clearSessionToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function applySession(session: MobileSessionResponse) {
    await setSessionToken(session.token);
    setToken(session.token);
    setUser(session.user);
  }

  async function login(identifier: string, password: string) {
    const session = await apiFetch<MobileSessionResponse>("/auth/mobile/login", {
      method: "POST",
      body: { identifier, password },
    });
    await applySession(session);
  }

  async function register(input: {
    username: string;
    email: string;
    displayName: string;
    password: string;
  }) {
    const session = await apiFetch<MobileSessionResponse>("/auth/mobile/register", {
      method: "POST",
      body: input,
    });
    await applySession(session);
  }

  async function refresh() {
    if (!token) return;
    const me = await apiFetch<User>("/auth/me", { token });
    setUser(me);
  }

  async function logout() {
    if (token) {
      try {
        await apiFetch("/auth/mobile/logout", { method: "POST", token });
      } catch {
        // La sesión local se limpia igualmente.
      }
    }
    await clearSessionToken();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
