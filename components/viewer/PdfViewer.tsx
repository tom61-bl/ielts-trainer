"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { GradeResult, Question } from "@/lib/types";
import { applyInkMarks, type InkMark } from "./inkLayer";
import type { StudyTool } from "./StudyTools";
import { QuestionMarker } from "./QuestionMarker";

const noMarks: InkMark[] = [];

export type PdfHandle = {
  goToPage: (page: number) => void;
  scrollToQuestion: (id: string) => Promise<void>;
  getCurrentPage: () => number;
};

type PdfDocument = {
  numPages: number;
  getPage: (page: number) => Promise<{
    getViewport: (params: { scale: number }) => { width: number; height: number };
    render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
    getTextContent: () => Promise<unknown>;
  }>;
  destroy: () => Promise<void>;
};

export const PdfViewer = forwardRef<
  PdfHandle,
  {
    url: string;
    scale: number;
    questions: Question[];
    answers: Record<string, string>;
    activeId: string | null;
    highlightId: string | null;
    grade: Record<string, GradeResult> | null;
    onPage: (page: number) => void;
    onOpen: (id: string) => void;
    onChange: (id: string, value: string) => void;
    onSelectText: (text: string, rect: DOMRect) => void;
    tool?: StudyTool;
    marks?: InkMark[];
    onInk?: (text: string, page: number) => void;
  }
>(function PdfViewer(
  {
    url,
    scale,
    questions,
    answers,
    activeId,
    highlightId,
    grade,
    onPage,
    onOpen,
    onChange,
    onSelectText,
    tool = "lookup",
    marks = noMarks,
    onInk,
  },
  ref,
) {
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("正在打开试卷");
  const [attempt, setAttempt] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pageNodes = useRef<Record<number, HTMLElement | null>>({});
  const ensures = useRef<Record<number, () => Promise<void>>>({});
  const currentPage = useRef(1);

  useEffect(() => {
    let cancelled = false;
    let doc: PdfDocument | null = null;
    setPdf(null);
    setError(null);
    setStatus("正在打开试卷");
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const task = pdfjs.getDocument(url);
        const loaded = (await task.promise) as unknown as PdfDocument;
        if (cancelled) {
          await loaded.destroy();
          return;
        }
        doc = loaded;
        setPdf(loaded);
        setStatus("");
      } catch {
        if (!cancelled) setError("试卷没有载入。");
      }
    })();
    return () => {
      cancelled = true;
      void doc?.destroy();
    };
  }, [url, attempt]);

  useImperativeHandle(ref, () => ({
    goToPage(page: number) {
      pageNodes.current[page]?.scrollIntoView({ behavior: "smooth", block: "start" });
      void ensures.current[page]?.();
    },
    async scrollToQuestion(id: string) {
      const question = questions.find((item) => item.id === id);
      if (!question) return;
      await ensures.current[question.page]?.();
      document.getElementById(`marker-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    getCurrentPage() {
      return currentPage.current;
    },
  }));

  function onMouseUp(event: React.MouseEvent) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().replace(/\s+/g, " ").trim();
    if (!text || text.length > 400) return;
    const node = selection.anchorNode;
    if (!node || !scrollerRef.current?.contains(node)) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) return;
    event.stopPropagation();
    if (tool === "ink") {
      const page = Number((event.target as HTMLElement).closest?.("[data-page]")?.getAttribute("data-page") ?? 1);
      onInk?.(text, page);
      selection.removeAllRanges();
      return;
    }
    onSelectText(text, rect);
  }

  return (
    <div ref={scrollerRef} className={`h-full overflow-auto ${tool === "ink" ? "ink-on" : ""}`} onMouseUp={onMouseUp}>
      {error ? (
        <div className="m-6 rounded-xl border border-line bg-surface p-6">
          <p className="font-medium">试卷没有载入</p>
          <p className="mt-2 text-sm text-muted">检查文件是否还在，然后重试。</p>
          <button className="btn btn-primary mt-4" onClick={() => setAttempt((value) => value + 1)}>
            重试
          </button>
        </div>
      ) : null}
      {status && !error ? <p className="px-6 py-4 text-sm text-muted">{status}</p> : null}
      {pdf
        ? Array.from({ length: pdf.numPages }, (_, index) => {
            const pageNumber = index + 1;
            const pageQuestions = questions.filter((question) => question.page === pageNumber);
            return (
              <PdfPage
                key={`${pageNumber}-${scale}`}
                pdf={pdf}
                pageNumber={pageNumber}
                scale={scale}
                onReady={(node, ensure) => {
                  pageNodes.current[pageNumber] = node;
                  ensures.current[pageNumber] = ensure;
                }}
                onVisible={() => {
                  currentPage.current = pageNumber;
                  onPage(pageNumber);
                  setStatus(`第 ${pageNumber} / ${pdf.numPages} 页`);
                }}
                marks={marks.filter((mark) => mark.surface === "paper" && mark.page === pageNumber)}
              >
                {pageQuestions.map((question) => (
                  <QuestionMarker
                    key={question.id}
                    question={question}
                    active={activeId === question.id}
                    hot={highlightId === question.id}
                    value={answers[question.id] ?? ""}
                    result={grade?.[question.id]}
                    onOpen={() => onOpen(question.id)}
                    onChange={(value) => onChange(question.id, value)}
                  />
                ))}
              </PdfPage>
            );
          })
        : null}
    </div>
  );
});

function PdfPage({
  pdf,
  pageNumber,
  scale,
  onReady,
  onVisible,
  marks,
  children,
}: {
  pdf: PdfDocument;
  pageNumber: number;
  scale: number;
  onReady: (node: HTMLElement | null, ensure: () => Promise<void>) => void;
  onVisible: () => void;
  marks: InkMark[];
  children: React.ReactNode;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const onVisibleRef = useRef(onVisible);
  const marksRef = useRef(marks);
  onReadyRef.current = onReady;
  onVisibleRef.current = onVisible;
  marksRef.current = marks;
  const [height, setHeight] = useState(760 * scale * 1.414);
  const width = 760 * scale;

  useEffect(() => {
    let cancelled = false;
    let started = false;
    const ensure = async () => {
      if (started || cancelled) return;
      started = true;
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / base.width });
      setHeight(viewport.height);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const canvas = canvasRef.current;
      const textLayer = textRef.current;
      if (!canvas || !textLayer || cancelled) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      await page.render({ canvasContext: context, viewport }).promise;
      if (cancelled) return;
      textLayer.replaceChildren();
      textLayer.style.width = `${viewport.width}px`;
      textLayer.style.height = `${viewport.height}px`;
      try {
        const pdfjs = await import("pdfjs-dist");
        const textContent = await page.getTextContent();
        const layer = new pdfjs.TextLayer({
          textContentSource: textContent as ConstructorParameters<typeof pdfjs.TextLayer>[0]["textContentSource"],
          container: textLayer,
          viewport: viewport as ConstructorParameters<typeof pdfjs.TextLayer>[0]["viewport"],
        });
        await layer.render();
        applyInkMarks(textLayer, marksRef.current);
      } catch {
        /* the page image is still usable without a text layer */
      }
    };
    onReadyRef.current(shellRef.current, ensure);
    const node = shellRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void ensure();
          if (entries.some((entry) => entry.intersectionRatio > 0.4)) onVisibleRef.current();
        }
      },
      { rootMargin: "700px", threshold: [0.1, 0.5] },
    );
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [pdf, pageNumber, width]);

  const markKey = marks.map((mark) => mark.id).join("|");

  useEffect(() => {
    const layer = textRef.current;
    if (!layer) return;
    const paint = () => {
      if (!layer.childNodes.length) return;
      applyInkMarks(layer, marksRef.current);
      layer.dataset.ink = String(marksRef.current.length);
    };
    paint();
    const frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [markKey]);

  return (
    <article ref={shellRef} className="mx-auto my-4 w-fit" data-page={pageNumber}>
      <div className="paper-sheet relative" style={{ width, height }}>
        <canvas ref={canvasRef} className="block" />
        <div ref={textRef} className="textLayer" />
        {children}
      </div>
    </article>
  );
}
