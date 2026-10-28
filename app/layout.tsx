import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/site/Header";
import { Shell } from "@/components/site/Shell";
import { publicPath } from "@/lib/content";

export const metadata: Metadata = {
  title: { default: "雅思真题在线", template: "%s · 雅思真题在线" },
  description: "按试卷排版练习雅思听说读写。自研模拟题，点题号翻页，听力跟到那一秒。",
  manifest: publicPath("/manifest.json"),
  icons: { icon: publicPath("/icon-192.png"), apple: publicPath("/icon-192.png") },
};

const themeBoot = `try{var p=JSON.parse(localStorage.getItem('ielts:prefs')||'{}');if(p.theme&&p.theme!=='light')document.documentElement.setAttribute('data-theme',p.theme);}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <Providers>
          <Header />
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
