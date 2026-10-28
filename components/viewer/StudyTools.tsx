"use client";

import { Eraser, Highlighter, Languages, MousePointer2 } from "lucide-react";
import { inkColors, type InkColor } from "./inkLayer";

export type StudyTool = "lookup" | "translate" | "ink";

export function StudyTools({
  tool,
  color,
  erasing,
  onTool,
  onColor,
  onErase,
  onClear,
}: {
  tool: StudyTool;
  color: InkColor;
  erasing: boolean;
  onTool: (tool: StudyTool) => void;
  onColor: (color: InkColor) => void;
  onErase: () => void;
  onClear: () => void;
}) {
  const tools = [
    { id: "lookup" as const, label: "查词", icon: MousePointer2 },
    { id: "translate" as const, label: "译句", icon: Languages },
    { id: "ink" as const, label: "高亮", icon: Highlighter },
  ];

  return (
    <div className="study-tools" role="toolbar" aria-label="试卷工具">
      {tools.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className="study-tool"
            aria-pressed={tool === item.id}
            onClick={() => onTool(item.id)}
          >
            <Icon size={15} strokeWidth={1.7} aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
      {tool === "ink" ? (
        <span className="study-pens">
          {inkColors.map((pen) => (
            <button
              key={pen.id}
              type="button"
              className={`pen pen-${pen.id}`}
              aria-label={pen.label}
              aria-pressed={!erasing && color === pen.id}
              onClick={() => onColor(pen.id)}
            />
          ))}
          <button type="button" className="study-tool" aria-pressed={erasing} onClick={onErase}>
            <Eraser size={15} strokeWidth={1.7} aria-hidden="true" />
            橡皮
          </button>
          <button type="button" className="study-tool" onClick={onClear}>
            清空
          </button>
        </span>
      ) : null}
    </div>
  );
}
