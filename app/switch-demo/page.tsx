"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch-button";

export default function DemoSwitchPage() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-6 transition-colors duration-300 ${darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="p-8 rounded-2xl shadow-xl bg-card border border-border flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold">
          {darkMode ? "Dark Mode Aktif 🌙" : "Light Mode Aktif ☀️"}
        </h1>
        <p className="text-sm opacity-70">
          Klik tombol di bawah untuk mengubah mode
        </p>
        <Switch
          value={darkMode}
          onToggle={() => setDarkMode((prev) => !prev)}
          iconOn={<Moon className="size-4 text-amber-300" />}
          iconOff={<Sun className="size-4 text-amber-500" />}
        />
      </div>
    </div>
  );
}
