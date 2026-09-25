"use client";

import { useState, useRef } from "react";
import { scanAnggota } from "@/actions/eksemplar";
import { BarcodeLabel } from "@/components/admin/BarcodeLabel";
import { LABEL_SIZES, printWithPageSize } from "@/lib/label";
import { Search, Printer, User } from "lucide-react";

type AnggotaInfo = {
  id: string;
  no_anggota: string;
  nama: string;
  jenis: string;
  nisn: string | null;
  kelas: string | null;
};

/**
 * Cetak kartu anggota: cari by no_anggota/NISN, render kartu + barcode,
 * window.print() dengan @page ukuran KTP (85.6 x 54 mm / ISO 7810 ID-1).
 */
export function CetakKartuClient() {
  const [query, setQuery] = useState("");
  const [anggota, setAnggota] = useState<AnggotaInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cari = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || busy) return;

    setBusy(true);
    setErr(null);
    try {
      const res = await scanAnggota(q);
      if (res.ok && (res as any).anggota) {
        setAnggota((res as any).anggota);
      } else {
        setAnggota(null);
        setErr(res.pesan);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal mencari anggota");
    } finally {
      setBusy(false);
    }
  };

  const cetak = () =>
    printWithPageSize(LABEL_SIZES.kartu.width, LABEL_SIZES.kartu.height);

  return (
    <>
      {/* UI normal — disembunyikan saat print */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-6 print-hidden">
        {/* Panel pencarian */}
        <div className="space-y-5">
          <form onSubmit={cari} className="relative">
            <div className="flex items-center gap-3 bg-white rounded-2xl border-2 border-emerald-300 p-3 shadow-sm focus-within:ring-4 focus-within:ring-emerald-100 transition-all">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={busy}
                placeholder="No anggota / NISN…"
                className="flex-1 h-10 font-mono tracking-wider bg-transparent focus:outline-none disabled:opacity-50"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={busy || !query}
                className="shrink-0 h-9 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >
                {busy ? "…" : "Cari"}
              </button>
            </div>
          </form>

          {err && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
              <span className="font-medium">{err}</span>
            </div>
          )}

          {anggota && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{anggota.nama}</p>
                  <p className="text-xs text-slate-500">
                    {anggota.no_anggota} · {anggota.jenis}
                    {anggota.kelas ? ` · ${anggota.kelas}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={cetak}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Cetak Kartu
              </button>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ukuran otomatis KTP (85,6 × 54 mm). Siapkan kertas kartu plastik
                lalu tekan cetak.
              </p>
            </div>
          )}
        </div>

        {/* Preview kartu */}
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-8 flex items-center justify-center min-h-[420px]">
          {anggota ? (
            <Kartu a={anggota} preview />
          ) : (
            <div className="text-center">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">
                Cari anggota untuk melihat preview kartu
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print-only area — HARUS di luar wrapper print:hidden */}
      {anggota && (
        <div className="print-area">
          <Kartu a={anggota} />
        </div>
      )}
    </>
  );
}

/**
 * Kartu fisik ukuran KTP. Preview: dibesarkan agar terbaca di layar.
 * Print: presisi 85.6 x 54 mm.
 */
function Kartu({ a, preview = false }: { a: AnggotaInfo; preview?: boolean }) {
  return (
    <div
      className={`${
        preview
          ? "w-[340px] rounded-2xl border-2 border-slate-300 shadow-xl"
          : "w-[85.6mm] h-[54mm] border border-slate-300 mx-auto"
      } bg-white overflow-hidden flex flex-col text-slate-900`}
    >
      <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-3 py-1.5 flex items-center gap-2">
        <img
          src="/assets/logo.png"
          alt="Logo sekolah"
          className="shrink-0 h-9 w-9 object-cover rounded-md ring-1 ring-white/30"
        />
        <div className="min-w-0">
          <p className="font-bold text-[9px] tracking-wide leading-tight text-white">
            PERPUSTAKAAN SMK NEGERI 1 BERINGIN
          </p>
          <p className="text-emerald-50 text-[7px] leading-tight">
            KARTU ANGGOTA
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-2 px-3 py-2">
        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
          <p className="font-bold text-[11px] leading-tight truncate">
            {a.nama}
          </p>
          <p className="font-mono text-[10px] font-bold text-emerald-700">
            {a.no_anggota}
          </p>
          {a.nisn && (
            <p className="font-mono text-[8px] text-slate-600">NISN {a.nisn}</p>
          )}
          {a.kelas && (
            <p className="text-[8px] text-slate-600">Kelas {a.kelas}</p>
          )}
        </div>
        <div
          className={`shrink-0 flex items-center ${
            preview ? "w-[110px]" : "w-[34mm]"
          }`}
        >
          <BarcodeLabel kode={a.no_anggota} judul="" size="small" />
        </div>
      </div>

      <div className="bg-slate-100 px-3 py-1 border-t border-slate-200">
        <p className="text-[6.5px] text-slate-500 text-center leading-tight">
          Kartu wajib dibawa saat berkunjung ke perpustakaan. Hubungi
          pustakawan jika hilang.
        </p>
      </div>
    </div>
  );
}
