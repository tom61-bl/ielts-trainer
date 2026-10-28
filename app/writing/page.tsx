import { WritingDesk } from "@/components/writing/WritingDesk";
import { getWritingTasks } from "@/lib/papers";

export const metadata = { title: "写作" };

export default function WritingPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <p className="text-sm text-muted">题目在左，稿纸在右。字数按英文单词计。</p>
      <div className="mt-4">
        <WritingDesk tasks={getWritingTasks()} />
      </div>
    </main>
  );
}
