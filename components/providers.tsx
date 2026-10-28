"use client";

import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "./ui/Toast";
import { LoginPopup } from "./login/LoginPopup";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        {children}
        <LoginPopup />
      </AuthProvider>
    </ToastProvider>
  );
}
