"use client";

import { useAuth } from "@/lib/auth";
import { Modal } from "../ui/Modal";
import { LoginForm } from "./LoginForm";

export function LoginPopup() {
  const { loginOpen, setLoginOpen } = useAuth();
  return (
    <Modal open={loginOpen} onClose={() => setLoginOpen(false)} title="登录">
      <LoginForm onDone={() => setLoginOpen(false)} />
    </Modal>
  );
}
