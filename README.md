# 雅思真题在线

首页只有听力、阅读、写作、翻译四个板块。点进去是同一套卷面：听录音或朗读、选词听读音并收藏、在正文上做记号。题目是原创模拟卷，不复制其他站点的代码、商标或试卷。

目录里的三套卷是本站写的模拟题。城镇、人物和图表数字都是虚构的，不是剑桥雅思，也不是官方样题的拷贝。阅读页登录后可以导入自己的 Markdown，文件只留在这台浏览器里。

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

- 首页四个板块：听力、阅读、写作、翻译
- 听力：播放、倍速、题号跳转、答题卡
- 阅读：分栏做题，朗读整篇，登录后导入 Markdown
- 写作：题目和稿纸、字数、计时、范文
- 翻译：按段展开中文，整篇朗读
- 选词：音标、释义、英语读音、收藏到生词本
- 译句和高亮：黄、粉、绿、蓝，笔迹留在这台浏览器
- 浅色、深色、护眼

对答案、释义、译文和范文都直接打开，没有付费墙。进度键名是 `ielts:progress:<paperId>`。

## 部署到 GitHub Pages

线上地址：[https://tom61-bl.github.io/ielts-trainer/](https://tom61-bl.github.io/ielts-trainer/)。仓库是 [tom61-bl/ielts-trainer](https://github.com/tom61-bl/ielts-trainer)。

站点是静态导出。推到仓库的 `main` 后，`.github/workflows/pages.yml` 会构建 `out/` 并发布到 GitHub Pages。项目站的地址是 `https://<用户名>.github.io/<仓库名>/`，构建时会把 `NEXT_PUBLIC_BASE_PATH` 设成 `/<仓库名>`。如果仓库名以 `.github.io` 结尾，前缀留空。

仓库 Settings → Pages 的 Source 选 GitHub Actions。仓库需要是公开的，免费账号才能用 Pages。

本机账号、进度和笔迹都在浏览器里，换设备不会跟着走。
