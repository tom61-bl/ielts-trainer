import Link from "next/link";
import { compliance, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 text-sm leading-7 text-muted md:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="font-medium text-ink">{site.name}</p>
          {compliance.map((line) => (
            <p key={line} className="mt-2">
              {line}
            </p>
          ))}
        </div>
        <div className="space-y-2">
          <p>域名与备案号在部署后由站长填写。这里不放虚假备案。</p>
          <p>
            {site.contactEmail
              ? `联系：${site.contactEmail}`
              : "联系邮箱还空着。部署时改 lib/site.ts。"}
          </p>
          <p className="flex gap-4">
            <Link href="/help">帮助与合规</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
