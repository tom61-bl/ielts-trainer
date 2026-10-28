"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

export function LoginForm({ onDone }: { onDone?: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const message =
      mode === "login"
        ? await login(email, password)
        : await register({ email, name, password });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm leading-7 text-muted">
        账号只存在这台浏览器里，用来登录和导入私有卷。密码经过本地摘要后再保存，没有服务器。
      </p>
      {mode === "register" ? (
        <label className="block text-sm">
          称呼
          <input className="field mt-1" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
      ) : null}
      <label className="block text-sm">
        邮箱
        <input
          className="field mt-1"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="block text-sm">
        密码
        <input
          className="field mt-1"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? <p className="text-sm text-wrong">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        {pending ? "请稍等" : mode === "login" ? "登录" : "注册并进入"}
      </button>
      <button
        type="button"
        className="btn btn-text w-full"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}
      >
        {mode === "login" ? "没有账号，注册一个" : "已有账号，去登录"}
      </button>
    </form>
  );
}
