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
    q: "会员支付了吗？",
    a: "没有接入支付。会员页的按钮只在本机打开对答案、范文和查词，用来验收门控。",
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-4xl">帮助</h1>
      <ol className="mt-6 space-y-3 text-sm leading-7">
        <li>1. 从首页进入听力、阅读、写作或口语。</li>
        <li>2. 在目录里按学术类 / 培训类、纸笔 / 机考筛选。</li>
        <li>3. 打开试卷后，用答题卡定位。纸笔模式翻 PDF，机考模式左右分栏。</li>
        <li>4. 选中单词可以收入生词本，再导出 CSV 或 Anki。</li>
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
