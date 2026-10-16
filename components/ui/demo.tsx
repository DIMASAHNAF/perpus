"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch-button";

export default function DemoSwitch() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-background">
      <h1 className="text-xl font-semibold">
        {darkMode ? "Dark Mode" : "Light Mode"}
      </h1>
      <Switch
        value={darkMode}
        onToggle={() => setDarkMode((prev) => !prev)}
        iconOn={<Moon className="size-4" />}
        iconOff={<Sun className="size-4" />}
      />
    </div>
  );
}
