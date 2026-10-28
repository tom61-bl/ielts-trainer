"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clearCookie, readJson, setCookie, storageKeys, writeJson } from "./storage";
import type { LocalUser, SessionUser } from "./types";

interface AuthContextValue {
  ready: boolean;
  user: SessionUser | null;
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  register: (input: { email: string; name: string; password: string }) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  unlockMember: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(`ielts-local:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function syncCookies(user: SessionUser | null) {
  if (!user) {
    clearCookie("ielts_session");
    clearCookie("ielts_member");
    return;
  }
  setCookie("ielts_session", user.email, 30);
  if (user.member) setCookie("ielts_member", "1", 730);
  else clearCookie("ielts_member");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const session = readJson<SessionUser | null>(storageKeys.session, null);
    setUser(session);
    syncCookies(session);
    setReady(true);
  }, []);

  const persist = useCallback((next: SessionUser | null) => {
    setUser(next);
    if (next) writeJson(storageKeys.session, next);
    else localStorage.removeItem(storageKeys.session);
    syncCookies(next);
  }, []);

  const register = useCallback(
    async ({ email, name, password }: { email: string; name: string; password: string }) => {
      const clean = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return "邮箱格式不对。";
      if (password.length < 6) return "密码至少 6 位。";
      if (!name.trim()) return "写一个称呼。";
      const users = readJson<LocalUser[]>(storageKeys.users, []);
      if (users.some((item) => item.email === clean)) return "这个邮箱已经注册过。";
      const next: LocalUser = {
        id: crypto.randomUUID(),
        email: clean,
        name: name.trim(),
        passHash: await hashPassword(password),
        member: false,
      };
      writeJson(storageKeys.users, [...users, next]);
      persist({ id: next.id, email: next.email, name: next.name, member: false });
      setLoginOpen(false);
      return null;
    },
    [persist],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const clean = email.trim().toLowerCase();
      const users = readJson<LocalUser[]>(storageKeys.users, []);
      const found = users.find((item) => item.email === clean);
      if (!found || found.passHash !== (await hashPassword(password))) {
        return "邮箱或密码不对。";
      }
      persist({ id: found.id, email: found.email, name: found.name, member: found.member });
      setLoginOpen(false);
      return null;
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const unlockMember = useCallback(() => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    const users = readJson<LocalUser[]>(storageKeys.users, []);
    writeJson(
      storageKeys.users,
      users.map((item) => (item.id === user.id ? { ...item, member: true } : item)),
    );
    persist({ ...user, member: true });
  }, [persist, user]);

  const value = useMemo(
    () => ({ ready, user, loginOpen, setLoginOpen, register, login, logout, unlockMember }),
    [ready, user, loginOpen, register, login, logout, unlockMember],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
