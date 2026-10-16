"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
    }
  };

  useEffect(() => {
    const syncTheme = () => {
      try {
        const savedTheme = localStorage.getItem("perpus_theme") as Theme | null;
        if (savedTheme === "light" || savedTheme === "dark") {
          setThemeState(savedTheme);
          applyTheme(savedTheme);
        } else {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          const initialTheme: Theme = prefersDark ? "dark" : "light";
          setThemeState(initialTheme);
          applyTheme(initialTheme);
        }
      } catch {
        applyTheme("dark");
      }
    };

    syncTheme();
    setMounted(true);

    const handleStorage = (e: StorageEvent | CustomEvent) => {
      let newTheme: Theme | null = null;
      if ("key" in e && e.key === "perpus_theme") {
        newTheme = e.newValue as Theme;
      } else if ("detail" in e && e.detail?.theme) {
        newTheme = e.detail.theme as Theme;
      }
      if (newTheme === "light" || newTheme === "dark") {
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    window.addEventListener("storage", handleStorage as EventListener);
    window.addEventListener("perpus_theme_change", handleStorage as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage as EventListener);
      window.removeEventListener("perpus_theme_change", handleStorage as EventListener);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem("perpus_theme", newTheme);
      window.dispatchEvent(
        new CustomEvent("perpus_theme_change", { detail: { theme: newTheme } })
      );
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context;
}
