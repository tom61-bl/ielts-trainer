"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { site } from "@/lib/site";
import { useToast } from "@/components/ui/Toast";

const benefits = [
  "听力、阅读对答案，并看到一句解释",
  "写作范文",
  "选中单词后的音标和中文释义",
  `口语批改额度（尚未接入，标价 ¥${site.speakingCorrection}）`,
];

export default function ProPage() {
  const { user, setLoginOpen, unlockMember } = useAuth();
  const toast = useToast();
  const [done, setDone] = useState(false);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs tracking-[0.18em] text-accent">MEMBER</p>
      <h1 className="mt-2 font-serif text-4xl">会员</h1>
      <p className="mt-3 max-w-xl text-muted">
        扫码和 H5 支付还没有接。下面的解锁只作用于这台浏览器里当前登录的账号，用来把会员门控走通。
      </p>
      <ul className="mt-6 space-y-2">
        {benefits.map((item) => (
          <li key={item} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-6 font-serif text-5xl text-accent">
        ¥{site.memberFee}
        <span className="ml-2 font-sans text-base text-muted">演示档</span>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {user?.member || done ? (
          <p className="text-sm text-correct">这个账号已在本机解锁。</p>
        ) : (
          <button
            className="btn btn-accent"
            onClick={() => {
              if (!user) {
                setLoginOpen(true);
                return;
              }
              unlockMember();
              setDone(true);
              toast("已在本机解锁会员功能");
            }}
          >
            在这台浏览器演示解锁
          </button>
        )}
      </div>
    </main>
  );
}
