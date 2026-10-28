"use client";

import { useEffect, useState } from "react";
import { Leaf, Moon, Sun } from "lucide-react";
import { loadPrefs, savePrefs } from "@/lib/storage";
import type { ThemeName } from "@/lib/types";

const order: ThemeName[] = ["light", "dark", "eye"];
const label: Record<ThemeName, string> = {
  light: "浅色",
  dark: "深色",
  eye: "护眼",
};

function applyTheme(theme: ThemeName) {
  if (theme === "light") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark" || current === "eye") setTheme(current);
    else setTheme(loadPrefs().theme);
  }, []);

  function cycle() {
    const next = order[(order.indexOf(theme) + 1) % order.length];
    applyTheme(next);
    const prefs = loadPrefs();
    savePrefs({ ...prefs, theme: next });
    setTheme(next);
  }

  const Icon = theme === "dark" ? Moon : theme === "eye" ? Leaf : Sun;

  return (
    <button className="btn btn-ghost px-3" onClick={cycle} aria-label={`主题：${label[theme]}，点击切换`}>
      <Icon size={16} />
      <span className="text-sm">{label[theme]}</span>
    </button>
  );
}
