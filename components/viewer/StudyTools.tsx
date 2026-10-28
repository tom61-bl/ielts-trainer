"use client";

import { Eraser, Highlighter, MousePointer2, Redo2, Type, Undo2 } from "lucide-react";
import { inkColors, type InkColor } from "./inkLayer";

export type StudyTool = "lookup" | "translate" | "ink";

export function StudyTools({
  tool,
  color,
  erasing,
  scale,
  canUndo,
  canRedo,
  onTool,
  onColor,
  onErase,
  onScale,
  onUndo,
  onRedo,
}: {
  tool: StudyTool;
  color: InkColor;
  erasing: boolean;
  scale: number;
  canUndo: boolean;
  canRedo: boolean;
  onTool: (tool: StudyTool) => void;
  onColor: (color: InkColor) => void;
  onErase: () => void;
  onScale: (scale: number) => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="exam-tools" role="toolbar" aria-label="试卷工具">
      <button
        type="button"
        className="exam-icon"
        aria-pressed={tool === "lookup"}
        aria-label="查词"
        onClick={() => onTool("lookup")}
      >
        <MousePointer2 size={16} strokeWidth={1.7} />
      </button>
      <button
        type="button"
        className="exam-icon exam-a"
        aria-label="缩小"
        onClick={() => onScale(Math.max(0.7, Number((scale - 0.1).toFixed(2))))}
      >
        A
      </button>
      <button
        type="button"
        className="exam-icon exam-a exam-a-lg"
        aria-label="放大"
        onClick={() => onScale(Math.min(1.6, Number((scale + 0.1).toFixed(2))))}
      >
        A
      </button>
      <button
        type="button"
        className="exam-icon"
        aria-pressed={tool === "translate"}
        aria-label="译句"
        onClick={() => onTool("translate")}
      >
        <Type size={16} strokeWidth={1.7} />
      </button>
      <button
        type="button"
        className="exam-icon"
        aria-pressed={tool === "ink" && !erasing}
        aria-label="高亮"
        onClick={() => onTool("ink")}
      >
        <Highlighter size={16} strokeWidth={1.7} />
      </button>
      <button type="button" className="exam-icon" aria-pressed={erasing} aria-label="橡皮" onClick={onErase}>
        <Eraser size={16} strokeWidth={1.7} />
      </button>
      <span className="exam-pens">
        {inkColors.map((pen) => (
          <button
            key={pen.id}
            type="button"
            className={`exam-pen-a pen-${pen.id}`}
            aria-label={`高亮${pen.label}`}
            aria-pressed={!erasing && tool === "ink" && color === pen.id}
            onClick={() => onColor(pen.id)}
          >
            A
          </button>
        ))}
      </span>
      <button type="button" className="exam-icon" aria-label="撤销" disabled={!canUndo} onClick={onUndo}>
        <Undo2 size={16} strokeWidth={1.7} />
      </button>
      <button type="button" className="exam-icon" aria-label="重做" disabled={!canRedo} onClick={onRedo}>
        <Redo2 size={16} strokeWidth={1.7} />
      </button>
    </div>
  );
}
