"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

export function ShareModal({
  open,
  onClose,
  title,
  url,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const text = `我在「雅思真题在线」练习《${title}》。${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("文案已复制");
    } catch {
      toast("复制失败，请手动选择文字");
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title, text, url });
    } catch {
      /* user dismissed the sheet */
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="分享这套练习">
      <p className="text-sm leading-7 text-muted">复制下面这段话，或交给系统分享。</p>
      <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm leading-7">{text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={copy}>
          {copied ? "已复制" : "复制文案"}
        </button>
        <button className="btn btn-ghost" onClick={nativeShare}>
          系统分享
        </button>
      </div>
    </Modal>
  );
}
