import { LoginForm } from "@/components/login/LoginForm";

export const metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-serif text-4xl">登录</h1>
      <p className="mt-2 text-sm text-muted">登录后回到目录。这是本机账号，不是邮箱验证码服务。</p>
      <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <LoginForm />
      </div>
    </main>
  );
}
