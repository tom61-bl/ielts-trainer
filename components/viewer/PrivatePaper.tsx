"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { loadPrivatePdf, listPrivatePapers } from "@/lib/private";
import { PdfViewer } from "./PdfViewer";

export function PrivatePaper({ id }: { id: string }) {
  const { user, ready, setLoginOpen } = useAuth();
  const [url, setUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("私有卷");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) return;
    const meta = listPrivatePapers(user.id).find((item) => item.id === id);
    if (!meta) {
      setMissing(true);
      return;
    }
    setTitle(meta.title);
    let objectUrl = "";
    void loadPrivatePdf(id).then((blob) => {
      if (!blob) {
        setMissing(true);
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ready, user, id]);

  if (!ready) return <p className="px-4 py-8 text-sm text-muted">正在打开私有卷。</p>;
  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-serif text-3xl">这是私有卷</h1>
        <p className="mt-3 text-muted">登录之后才能看到属于你的文件。</p>
        <button className="btn btn-primary mt-4" onClick={() => setLoginOpen(true)}>
          登录
        </button>
      </main>
    );
  }
  if (missing) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-serif text-3xl">没有找到这套私有卷</h1>
        <p className="mt-3 text-muted">它可能在另一台浏览器里，或已经被清掉。</p>
      </main>
    );
  }
  if (!url) return <p className="px-4 py-8 text-sm text-muted">正在读取 PDF。</p>;

  return (
    <div className="h-[calc(100vh-4rem)]">
      <p className="border-b border-line px-4 py-3 text-sm">
        {title}
        <span className="ml-3 text-muted">私有卷没有题号标注，可以翻页和选词。</span>
      </p>
      <PdfViewer
        url={url}
        scale={1}
        questions={[]}
        answers={{}}
        activeId={null}
        highlightId={null}
        grade={null}
        onPage={() => {}}
        onOpen={() => {}}
        onChange={() => {}}
        onSelectText={() => {}}
      />
    </div>
  );
}
