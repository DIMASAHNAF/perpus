"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Lock, User, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 text-slate-900 px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Back Link */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Katalog Publik
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          <div className="text-center mb-8 space-y-2">
            <img
              src="/assets/logo.png"
              alt="Logo SMK Negeri 1 Beringin"
              className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1 mx-auto shadow-sm"
            />
            <h1 className="text-2xl font-extrabold text-slate-900">
              Login Petugas
            </h1>
            <p className="text-xs text-slate-500">
              Masuk ke panel admin sistem perpustakaan sekolah
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-lg text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder="Masukkan username admin"
              />
            </div>

            <div>
              <label htmlFor="password" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Masukkan password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? (
                "Memverifikasi..."
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Masuk ke Dashboard
                </>
              )}
            </Button>

            <div className="pt-3 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 inline-block">
                Akun default: <strong>admin</strong> | <strong>admin123</strong>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

