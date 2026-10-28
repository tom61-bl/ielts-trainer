"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  const push = useCallback((next: string) => {
    setMessage(next);
    setToken((value) => value + 1);
    window.setTimeout(() => setMessage((current) => (current === next ? null : current)), 2500);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <div
          key={token}
          className="toast-in pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-bg shadow-lg"
          role="status"
        >
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
