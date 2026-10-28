"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { storageKeys } from "@/lib/storage";

export function InviteBanner() {
  const params = useSearchParams();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const invite = params.get("invite");
    if (!invite) return;
    localStorage.setItem(storageKeys.invite, invite);
    if (sessionStorage.getItem("ielts:invite-dismissed") === invite) return;
    setCode(invite);
  }, [params]);

  if (!code) return null;

  return (
    <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-line bg-primary-soft px-4 py-3 text-sm">
      <p>
        你从邀请 <span className="font-medium">{code}</span> 进来。进度仍只留在这台浏览器。
      </p>
      <button
        className="btn btn-text"
        onClick={() => {
          sessionStorage.setItem("ielts:invite-dismissed", code);
          setCode(null);
        }}
      >
        关闭
      </button>
    </div>
  );
}
