"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-8.5 h-8.5 rounded-xl bg-stone-200 dark:bg-slate-800 animate-pulse ${className}`} />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 select-none">
          {isDark ? "Mode Gelap" : "Mode Terang"}
        </span>
      )}
      <button
        type="button"
        onClick={toggleTheme}
        className="group relative w-8.5 h-8.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-stone-300/80 dark:border-slate-700/80 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-92 cursor-pointer"
        title={isDark ? "Ketuk untuk ganti ke Mode Terang" : "Ketuk untuk ganti ke Mode Gelap"}
        aria-label="Toggle Tema"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300" />
        )}
      </button>
    </div>
  );
}

export default ThemeToggle;
