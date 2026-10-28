import { compliance } from "@/lib/site";

export const metadata = { title: "帮助" };

const faqs = [
  {
    q: "这些是剑桥真题吗？",
    a: "不是。目录里的三套卷是为本站写的模拟题，城镇、人物和数据都是虚构的。不要把它们当成官方题目或真实报道。",
  },
  {
    q: "作答存在哪里？",
    a: "存在这台浏览器的 localStorage，键名以 ielts: 开头。换浏览器或清站点数据会丢掉进度。",
  },
  {
    q: "怎么把听力跳到某一题？",
    a: "打开试卷，在答题卡上点听力题号。播放会跳到那一句的开头。",
  },
  {
    q: "私有卷谁能看见？",
    a: "只有导入它的这个浏览器账号。文件放在 IndexedDB，不会上传。",
  },
  {
    q: "查答案、译文和范文要付费吗？",
    a: "不用。对答案、单词释义、整句译文和写作范文都直接打开。",
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-4xl">帮助</h1>
      <ol className="mt-6 space-y-3 text-sm leading-7">
        <li>1. 首页只有听力、阅读、写作、翻译四个板块。</li>
        <li>2. 听力在底部播放，点题号会跳到那一句。阅读可以朗读整篇。</li>
        <li>3. 选中单词会弹出释义，并用英语语音读出来。点星星收入生词本。</li>
        <li>4. 选中句子，或先点 T 再选一小段，可以看到中文。荧光笔可以在正文上做记号。</li>
        <li>5. 阅读页登录后可以导入 Markdown。文末加上 Answers 就能对答案。</li>
      </ol>
      <div className="mt-8 space-y-3">
        {faqs.map((item) => (
          <details key={item.q} className="rounded-xl border border-line bg-surface px-4 py-3">
            <summary className="cursor-pointer font-medium">{item.q}</summary>
            <p className="mt-2 text-sm leading-7 text-muted">{item.a}</p>
          </details>
        ))}
      </div>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">内容来源与合规</h2>
        <div className="mt-3 space-y-2 text-sm leading-7 text-muted">
          {compliance.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
