"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Lock, User, ArrowLeft, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (!result) {
        setError("Tidak ada respon dari server autentikasi.");
        return;
      }

      if (result.error) {
        if (result.error === "CredentialsSignin") {
          setError("Username atau password salah");
        } else {
          setError(result.error);
        }
      } else if (result.url && (result.url.includes("csrf=true") || result.url.includes("error="))) {
        setError("Sesi login atau token keamanan kadaluarsa. Silakan muat ulang halaman.");
      } else if (result.ok) {
        window.location.href = "/admin";
      } else {
        setError("Gagal masuk. Periksa kembali username dan password Anda.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan atau server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex flex-col justify-center items-center px-4 py-12 overflow-hidden transition-colors duration-500 ${
      isDark
        ? "bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white"
        : "bg-slate-100 text-slate-900 selection:bg-sky-600 selection:text-white"
    }`}>
      {/* Dynamic Aurora Ambient Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        {/* Deep ambient gradient base */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${
          isDark 
            ? "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.18),rgba(2,6,23,0.95))]" 
            : "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(186,230,253,0.65),rgba(241,245,249,0.98))]"
        }`} />

        {/* Floating Glowing Aurora Orbs */}
        <div className={`absolute -top-32 -left-20 w-[42rem] h-[42rem] rounded-full blur-[85px] mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-40 animate-aurora-mesh-1 ${
          isDark ? "bg-gradient-to-tr from-blue-700 via-sky-600 to-cyan-500" : "bg-gradient-to-tr from-sky-400 via-blue-300 to-cyan-200"
        }`} />

        <div className={`absolute top-1/4 -right-24 w-[40rem] h-[40rem] rounded-full blur-[90px] mix-blend-multiply dark:mix-blend-screen opacity-65 dark:opacity-35 animate-aurora-mesh-2 ${
          isDark ? "bg-gradient-to-bl from-indigo-700 via-blue-600 to-sky-500" : "bg-gradient-to-bl from-blue-300 via-indigo-200 to-sky-300"
        }`} />

        <div className={`absolute -bottom-36 left-1/4 w-[48rem] h-[48rem] rounded-full blur-[95px] mix-blend-multiply dark:mix-blend-screen opacity-60 dark:opacity-30 animate-aurora-mesh-3 ${
          isDark ? "bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-700" : "bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-200"
        }`} />

        {/* Soft Wave Ray */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[25rem] rounded-full blur-[100px] opacity-40 dark:opacity-25 animate-aurora-pulse ${
          isDark ? "bg-sky-500/30" : "bg-sky-400/30"
        }`} />
      </div>

      <div className="relative max-w-md w-full space-y-6 z-10">
        {/* Top Actions: Back Link & Theme Toggle */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-sm backdrop-blur-xl border ${
              isDark
                ? "text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 hover:border-sky-500/40"
                : "text-slate-700 hover:text-slate-900 bg-white/90 hover:bg-white border-slate-200 hover:border-sky-500/60 shadow-xs"
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Kembali ke Katalog
          </Link>
          <ThemeToggle />
        </div>

        {/* Glassmorphic Card */}
        <div className={`rounded-3xl border shadow-2xl p-6 sm:p-10 animate-fade-up relative overflow-hidden backdrop-blur-2xl transition-all duration-300 ${
          isDark
            ? "bg-slate-900/85 border-slate-800 shadow-black/80 ring-1 ring-sky-500/15"
            : "bg-white/95 border-white/80 shadow-2xl shadow-sky-950/10 ring-1 ring-sky-200/80"
        }`}>
          {/* Top subtle highlight border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/80 to-transparent" />

          <div className="text-center mb-8 space-y-2">
            <div className="flex items-center justify-center gap-2.5 mx-auto">
              <img
                src="/assets/logo.png"
                alt="Logo SMK Negeri 1 Beringin"
                className="w-11 h-11 rounded-xl object-contain bg-white/60 dark:bg-white/10 border border-slate-200 dark:border-white/15 p-1 shadow-sm backdrop-blur-md"
              />
              <img
                src="/assets/logo-kolaborasi.png"
                alt="Logo Kolaborasi Sumut Berkah"
                className="h-9 w-auto object-contain"
              />
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              Login Petugas
            </h1>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Masuk ke panel admin sistem perpustakaan sekolah
            </p>
          </div>

          <form onSubmit={handleSubmit} method="post" action="#" className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 text-rose-500 px-3.5 py-2.5 rounded-xl text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Username
              </label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder="Masukkan username admin"
                className={`rounded-xl h-11 transition-all focus:ring-2 focus:ring-sky-500/30 ${
                  isDark
                    ? "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 shadow-xs"
                }`}
              />
            </div>

            <div>
              <label htmlFor="password" className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                <Lock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Masukkan password"
                  className={`rounded-xl h-11 pr-11 transition-all focus:ring-2 focus:ring-sky-500/30 ${
                    isDark
                      ? "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500"
                      : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 shadow-xs"
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                  }`}
                  title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-500 hover:via-sky-500 hover:to-cyan-500 text-white border border-sky-400/30 shadow-sky-500/25"
              disabled={loading}
            >
              {loading ? (
                "Memverifikasi..."
              ) : (
                "Login"
              )}
            </Button>

            <div className={`pt-4 border-t text-center ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <span className={`text-[11px] px-3.5 py-1.5 rounded-full border inline-flex items-center gap-1.5 ${
                isDark
                  ? "text-slate-400 bg-slate-800/60 border-slate-700/60"
                  : "text-slate-600 bg-slate-50 border-slate-200 shadow-2xs"
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Panel Akses Khusus Petugas &amp; Pustakawan Sekolah</span>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
