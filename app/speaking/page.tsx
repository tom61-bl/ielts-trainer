import { SpeakingDesk } from "@/components/speaking/SpeakingDesk";
import { getSpeakingPrompts } from "@/lib/papers";

export const metadata = { title: "口语" };

export default function SpeakingPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <h1 className="font-serif text-4xl">口语题库</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Part 2 先给一分钟准备，再录音。四项自评存在这台浏览器。AI 批改还没有接入。
      </p>
      <div className="mt-6">
        <SpeakingDesk prompts={getSpeakingPrompts()} />
      </div>
    </main>
  );
}
