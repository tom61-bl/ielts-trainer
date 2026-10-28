# 雅思真题在线

按试卷排版练习听说读写：翻 PDF、点题号定位、标答案、听听力、收生词。题目是原创模拟卷。目录的排法参照公开真题列表页：按系列横排封面、封面底部写名称和进度，不复制该站的代码、商标或试卷。

目录里的三套卷是本站写的模拟题（学术类两套、培训类一套）。城镇、人物和图表数字都是虚构的，不是剑桥雅思，也不是官方样题的拷贝。你可以在登录后导入自己的 PDF，文件只留在这台浏览器里。

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://127.0.0.1:43123](http://127.0.0.1:43123)。

```bash
npm test
npm run lint
```

重新生成试卷 PDF、听力音频和 JSON：

```bash
npm run samples
```

这一步需要 Python、PyMuPDF、edge-tts 和 ffmpeg，并且要能访问语音合成服务。生成结果已经放在 `public/samples` 和 `data`，日常开发不必重跑。

## 现在能做什么

- 首页、目录筛选（学术类 / 培训类、纸笔 / 机考、科目）
- 试卷页：PDF 翻页、题号定位、答题卡、选择和填空、本地进度
- 听力：播放、倍速、后退 10 秒、段落标记、题号跳转
- 纸笔 / 机考两种看法
- 浅色、深色、护眼
- 生词本：加入、搜索、删除、导出 CSV / Anki
- 译句：选中正文，直接看到逐句中文
- 高亮：黄、粉、绿、蓝四色笔，笔迹留在这台浏览器
- 口语提示卡、准备计时、录音和自评
- 写作字数、计时、草稿
- 本机账号，用来登录和导入只留在这台浏览器里的 PDF

对答案、释义、译文和范文都直接打开，没有付费墙。进度键名是 `ielts:progress:<paperId>`。

## 部署到 GitHub Pages

线上地址：[https://tom61-bl.github.io/ielts-trainer/](https://tom61-bl.github.io/ielts-trainer/)。仓库是 [tom61-bl/ielts-trainer](https://github.com/tom61-bl/ielts-trainer)。

站点是静态导出。推到仓库的 `main` 后，`.github/workflows/pages.yml` 会构建 `out/` 并发布到 GitHub Pages。项目站的地址是 `https://<用户名>.github.io/<仓库名>/`，构建时会把 `NEXT_PUBLIC_BASE_PATH` 设成 `/<仓库名>`。如果仓库名以 `.github.io` 结尾，前缀留空。

仓库 Settings → Pages 的 Source 选 GitHub Actions。仓库需要是公开的，免费账号才能用 Pages。

本机账号、进度和笔迹都在浏览器里，换设备不会跟着走。
