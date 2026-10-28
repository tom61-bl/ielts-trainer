import { WritingDesk } from "@/components/writing/WritingDesk";
import { getWritingTasks } from "@/lib/papers";

export const metadata = { title: "写作" };

export default function WritingPage() {
  return <WritingDesk tasks={getWritingTasks()} />;
}
