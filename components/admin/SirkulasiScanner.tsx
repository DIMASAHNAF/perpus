"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useActionState } from "react";
import { scanAnggota, scanEksemplar } from "@/actions/eksemplar";
import {
  ScanLine,
  User,
  BookCheck,
  LogOut,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { speak } from "@/lib/voice";
import { perpanjangPinjaman } from "@/actions/eksemplar";

type AnggotaInfo = {
  id: string;
  no_anggota: string;
  nama: string;
  jenis: string;
  nisn: string | null;
  kelas: string | null;
  telepon: string | null;
  sedangDipinjam: number;
  pinjaman: {
    id: string;
    judul: string;
    batas_kembali: string;
    perpanjangan_count: number;
    denda: number;
  }[];
};

type LogItem = {
  id: number;
  ok: boolean;
  pesan: string;
  waktu: string;
};

/**
 * Scanner USB HID = keyboard + Enter. Input auto-focus, debounce 300ms
 * anti double-scan. Phase 1: kartu anggota. Phase 2: eksemplar berulang.
 */
export function SirkulasiScanner() {
  const [anggota, setAnggota] = useState<AnggotaInfo | null>(null);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScan = useRef<{ kode: string; ts: number }>({ kode: "", ts: 0 });
  const logId = useRef(0);

  // Auto-focus input selalu (scanner butuh focus)
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [anggota, busy]);

  const pushLog = useCallback((ok: boolean, pesan: string) => {
    setLog((l) =>
      [{ id: logId.current++, ok, pesan, waktu: new Date().toLocaleTimeString("id-ID") }, ...l].slice(0, 30)
    );
  }, []);

  const say = useCallback(
    (text: string) => {
      if (!muted) speak(text);
    },
    [muted]
  );

  const handlePerpanjang = useCallback(
    async (transaksiId: string) => {
      if (!anggota || busy) return;
      setBusy(true);
      try {
        const res = await perpanjangPinjaman(transaksiId);
        pushLog(res.ok, res.pesan);
        say(res.ok ? res.pesan : `Gagal. ${res.pesan}`);
        const refresh = await scanAnggota(anggota.no_anggota);
        if (refresh.ok && (refresh as any).anggota) {
          setAnggota((refresh as any).anggota);
        }
      } finally {
        setBusy(false);
      }
    },
    [anggota, busy, pushLog, say]
  );

  const handleScan = useCallback(
    async (raw: string) => {
      const kode = raw.trim();
      if (!kode || busy) return;

      // Debounce: scanner bisa kirim Enter 2x cepat
      const now = Date.now();
      if (kode === lastScan.current.kode && now - lastScan.current.ts < 1500) return;
      lastScan.current = { kode, ts: now };

      setBusy(true);
      setErr(null);

      try {
        if (!anggota) {
          // Phase 1: scan kartu anggota
          const res = await scanAnggota(kode);
          if (res.ok && (res as any).anggota) {
            setAnggota((res as any).anggota);
            pushLog(true, `Anggota: ${(res as any).anggota.nama} (${(res as any).anggota.no_anggota})`);
            say(`Selamat datang ${(res as any).anggota.nama}. Silakan scan buku.`);
          } else {
            pushLog(false, res.pesan);
            setErr(res.pesan);
          }
        } else {
          // Phase 2: scan eksemplar
          const res = await scanEksemplar(anggota.id, kode);
          pushLog(res.ok, res.pesan);
          if (res.ok) {
            say(res.aksi === "KEMBALI" ? `Pengembalian berhasil. ${res.pesan}` : `Peminjaman buku atas nama ${anggota.nama} berhasil`);
          } else {
            say(`Gagal. ${res.pesan}`);
          }
          if (!res.ok) setErr(res.pesan);

          // Refresh data anggota (jumlah pinjaman berubah)
          const refresh = await scanAnggota(anggota.no_anggota);
          if (refresh.ok && (refresh as any).anggota) {
            setAnggota((refresh as any).anggota);
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Gagal memproses scan";
        pushLog(false, msg);
        setErr(msg);
      } finally {
        setBusy(false);
        setInput("");
      }
    },
    [anggota, busy, pushLog]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(input);
  };

  const selesai = () => {
    setAnggota(null);
    setInput("");
    setErr(null);
  };

  const terlambat = (iso: string) => new Date(iso) < new Date();

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6">
      {/* KIRI: scanner utama */}
      <div className="space-y-5">
        {/* Phase indicator */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                !anggota
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <User className="w-4 h-4" />
              1. Scan Kartu Anggota
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                anggota
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <BookCheck className="w-4 h-4" />
              2. Scan Buku
            </div>
          </div>

          <button
            onClick={() => setMuted((m) => !m)}
            title={muted ? "Aktifkan suara" : "Matikan suara"}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
              muted
                ? "bg-slate-100 text-slate-500"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {muted ? "Suara off" : "Suara on"}
          </button>
        </div>

        {/* Scanner input */}
        <form onSubmit={onSubmit} className="relative">
          <div
            className={`flex items-center gap-3 bg-white rounded-2xl border-2 transition-all ${
              busy
                ? "border-emerald-400 ring-4 ring-emerald-100"
                : anggota
                  ? "border-sky-300"
                  : "border-emerald-300"
            } p-4 shadow-sm`}
          >
            <ScanLine className={`w-7 h-7 ${busy ? "text-emerald-500 animate-pulse" : "text-slate-400"} shrink-0`} />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder={
                anggota ? "Scan kode buku (8-digit)…" : "Scan kartu anggota (A0001 / NISN)…"
              }
              className="flex-1 h-12 text-lg font-mono tracking-wider bg-transparent focus:outline-none disabled:opacity-50"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={busy || !input}
              className="shrink-0 h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? "…" : "Proses"}
            </button>
          </div>
          {err && (
            <div className="mt-3 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-medium">{err}</span>
            </div>
          )}
        </form>

        {/* Kartu anggota aktif */}
        {anggota && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{anggota.nama}</p>
                  <p className="text-emerald-50 text-xs">
                    {anggota.no_anggota} {anggota.nisn ? `· NISN ${anggota.nisn}` : ""}{" "}
                    {anggota.kelas ? `· ${anggota.kelas}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={selesai}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Selesai
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  Sedang dipinjam:{" "}
                  <span className="font-bold text-slate-900">{anggota.sedangDipinjam}</span> buku
                </span>
              </div>

              {anggota.pinjaman.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {anggota.pinjaman.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 bg-slate-50 rounded-lg px-3 py-2.5"
                    >
                      <span className="text-sm font-medium text-slate-700 line-clamp-1">
                        {p.judul}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.perpanjangan_count < 1 && (
                          <button
                            onClick={() => handlePerpanjang(p.id)}
                            className="text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-300 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"
                          >
                            Perpanjang
                          </button>
                        )}
                        <span
                          className={`text-xs font-semibold flex items-center gap-1 ${
                            terlambat(p.batas_kembali) ? "text-rose-600" : "text-slate-500"
                          }`}
                        >
                          {terlambat(p.batas_kembali) && <AlertTriangle className="w-3.5 h-3.5" />}
                          {new Date(p.batas_kembali).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-400 italic">
                  Tidak ada pinjaman aktif. Siapkan buku lalu scan.
                </p>
              )}
            </div>
          </div>
        )}

        {!anggota && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <ScanLine className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Mulai dengan scan kartu anggota</p>
            <p className="text-xs text-slate-400 mt-1">
              Scanner USB bekerja seperti keyboard — arahkan kursor, lalu tekan trigger
            </p>
          </div>
        )}
      </div>

      {/* KANAN: log aktivitas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[calc(100vh-8rem)]">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Log Aktivitas</h2>
          {log.length > 0 && (
            <button
              onClick={() => setLog([])}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Hapus
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {log.length === 0 ? (
            <p className="text-center text-xs text-slate-400 italic py-8">
              Belum ada aktivitas scan
            </p>
          ) : (
            log.map((l) => (
              <div
                key={l.id}
                className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
                  l.ok ? "bg-emerald-50" : "bg-rose-50"
                }`}
              >
                {l.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${l.ok ? "text-emerald-900" : "text-rose-900"} break-words`}
                  >
                    {l.pesan}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{l.waktu}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
