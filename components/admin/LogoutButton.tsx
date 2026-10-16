"use client";

import { signOut } from "next-auth/react";
import { LogOut, ChevronRight } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
      className="group w-full text-left p-5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:border-rose-400 dark:hover:border-rose-700/80 bg-rose-50/60 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-all shadow-xs flex flex-col justify-between cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
        </div>
        <ChevronRight className="w-4 h-4 text-stone-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
      </div>
      <div>
        <h3 className="font-bold text-rose-700 dark:text-rose-400 text-sm group-hover:text-rose-800 dark:group-hover:text-rose-300 transition-colors">Keluar Akun</h3>
        <p className="text-xs text-stone-600 dark:text-slate-400 mt-1">Akhiri sesi login pengelola perpustakaan</p>
      </div>
    </button>
  );
}
