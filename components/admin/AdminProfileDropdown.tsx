"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  ShieldCheck,
  LogOut,
  ChevronDown,
  ExternalLink,
  User,
  Settings,
  BookOpen,
  KeyRound,
  Download,
} from "lucide-react";
import { UbahPasswordModal } from "@/components/admin/UbahPasswordModal";

export function AdminProfileDropdown({ userName }: { userName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownloadApp = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("open-pwa-install"));
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 border border-transparent hover:border-stone-200 dark:hover:border-slate-700 transition-all cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
            {userName?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1 leading-tight">
              {userName || "Administrator"}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3" /> Pustakawan
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-stone-400 transition-transform hidden sm:block ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-scale-up">
            <div className="px-4 py-2.5 border-b border-stone-100 dark:border-slate-800">
              <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                {userName || "Administrator"}
              </p>
              <p className="text-[10px] text-stone-500 dark:text-slate-400">
                Hak Akses: Pustakawan / Admin
              </p>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={handleDownloadApp}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-left font-medium"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Download App</span>
              </button>

              <Link
                href="/admin/buku"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                <span>Kelola Koleksi Buku</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsPasswordModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-left font-medium"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Ganti Password</span>
              </button>
            </div>

            <div className="pt-1 border-t border-stone-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun (Logout)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ubah Password */}
      <UbahPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userName={userName}
      />
    </>
  );
}
