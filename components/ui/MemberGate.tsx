"use client";

import Link from "next/link";
import { site } from "@/lib/site";
import { Modal } from "./Modal";

export function MemberGate({
  open,
  onClose,
  feature,
}: {
  open: boolean;
  onClose: () => void;
  feature: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title="解锁会员">
      <p className="font-serif text-2xl text-ink">{feature}</p>
      <ul className="mt-4 space-y-2 text-sm leading-7 text-muted">
        <li>对答案，并看到一句解释</li>
        <li>写作范文</li>
        <li>选中单词后的音标和释义，以及整句译文</li>
        <li>口语批改额度仍是占位，价格 ¥{site.speakingCorrection}</li>
      </ul>
      <p className="mt-4 text-sm">
        会员价 <span className="font-serif text-2xl text-accent">¥{site.memberFee}</span>
        <span className="text-muted"> / 演示档</span>
      </p>
      <p className="mt-2 text-sm leading-7 text-muted">
        支付还没有接入。关闭后会回到刚才的位置，作答不会丢。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="btn btn-accent" href="/pro" onClick={onClose}>
          查看会员页
        </Link>
        <button className="btn btn-ghost" onClick={onClose}>
          先继续做题
        </button>
      </div>
    </Modal>
  );
}
