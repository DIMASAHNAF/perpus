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
  MessageCircle,
} from "lucide-react";
import { speak } from "@/lib/voice";
import { perpanjangPinjaman } from "@/actions/eksemplar";
import { WhatsAppModal } from "@/components/admin/WhatsAppModal";

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
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waData, setWaData] = useState<any>(null);
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
    <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-5 sm:gap-6">
      {/* KIRI: scanner utama */}
      <div className="space-y-4 sm:space-y-5">
        {/* Phase indicator */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                !anggota
                  ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-white dark:bg-slate-900/80 text-stone-600 dark:text-slate-400 border border-stone-200 dark:border-slate-800 shadow-xs"
              }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">1. Scan Kartu Anggota</span>
              <span className="xs:hidden">1. Kartu</span>
            </div>
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                anggota
                  ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-white dark:bg-slate-900/80 text-stone-600 dark:text-slate-400 border border-stone-200 dark:border-slate-800 shadow-xs"
              }`}
            >
              <BookCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">2. Scan Buku</span>
              <span className="xs:hidden">2. Buku</span>
            </div>
          </div>

          <button
            onClick={() => setMuted((m) => !m)}
            title={muted ? "Aktifkan suara" : "Matikan suara"}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs cursor-pointer ${
              muted
                ? "bg-stone-100 text-stone-600 dark:bg-slate-900 dark:text-slate-400 border-stone-300 dark:border-slate-800 hover:text-stone-900 dark:hover:text-white"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/30"
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {muted ? "Suara off" : "Suara on"}
          </button>
        </div>

        {/* Scanner input */}
        <form onSubmit={onSubmit} className="relative">
          <div
            className={`flex items-center gap-3 bg-white dark:bg-slate-900/90 rounded-2xl border-2 transition-all backdrop-blur-xl ${
              busy
                ? "border-emerald-500 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/10"
                : anggota
                  ? "border-sky-500 shadow-lg shadow-sky-500/10"
                  : "border-stone-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-md"
            } p-4`}
          >
            <ScanLine className={`w-7 h-7 ${busy ? "text-emerald-600 dark:text-emerald-400 animate-pulse" : "text-emerald-600 dark:text-emerald-400"} shrink-0`} />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder={
                anggota ? "Scan kode buku (8-digit)…" : "Scan kartu anggota (A0001 / NISN)…"
              }
              className="flex-1 h-12 text-lg font-mono tracking-wider bg-transparent text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={busy || !input}
              className="shrink-0 h-10 px-5 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed disabled:bg-stone-200/80 disabled:text-stone-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
            >
              {busy ? "…" : "Proses"}
            </button>
          </div>
          {err && (
            <div className="mt-3 flex items-start gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 rounded-xl px-4 py-3 text-sm shadow-xs">
              <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span className="font-medium">{err}</span>
            </div>
          )}
        </form>

        {/* Kartu anggota aktif */}
        {anggota && (
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200 dark:border-slate-800 shadow-lg overflow-hidden animate-fade-up">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inner">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{anggota.nama}</p>
                  <p className="text-emerald-100 text-xs mt-0.5">
                    {anggota.no_anggota} {anggota.nisn ? `· NISN ${anggota.nisn}` : ""}{" "}
                    {anggota.kelas ? `· ${anggota.kelas}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={selesai}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer backdrop-blur-xs"
              >
                <LogOut className="w-4 h-4" />
                Selesai
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center gap-2 text-sm text-stone-700 dark:text-slate-300">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Sedang dipinjam:{" "}
                  <span className="font-bold text-stone-900 dark:text-white bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-stone-200 dark:border-slate-700 ml-1">{anggota.sedangDipinjam}</span> buku
                </span>
              </div>

              {anggota.pinjaman.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {anggota.pinjaman.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700/60 rounded-xl px-4 py-3"
                    >
                      <span className="text-sm font-medium text-stone-800 dark:text-slate-200 line-clamp-1">
                        {p.judul}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.perpanjangan_count < 1 && (
                          <button
                            onClick={() => handlePerpanjang(p.id)}
                            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 border border-emerald-300 dark:border-emerald-500/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            Perpanjang
                          </button>
                        )}
                        <span
                          className={`text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                            terlambat(p.batas_kembali)
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60"
                              : "bg-stone-100 text-stone-700 dark:bg-slate-900/80 dark:text-slate-400 border border-stone-200 dark:border-slate-700/60"
                          }`}
                        >
                          {terlambat(p.batas_kembali) && <AlertTriangle className="w-3.5 h-3.5" />}
                          {new Date(p.batas_kembali).toLocaleDateString("id-ID")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!anggota) return;
                            const isLate = terlambat(p.batas_kembali);
                            const now = new Date();
                            const batas = new Date(p.batas_kembali);
                            const hariTerlambat = isLate ? Math.max(1, Math.floor((now.getTime() - batas.getTime()) / (1000 * 60 * 60 * 24))) : 0;

                            setWaData({
                              nama: anggota.nama,
                              kelas: anggota.kelas,
                              no_anggota: anggota.no_anggota,
                              nisn: anggota.nisn,
                              telepon: anggota.telepon,
                              judul_buku: p.judul,
                              batas_kembali: p.batas_kembali,
                              hari_terlambat: hariTerlambat,
                              denda: p.denda,
                              defaultType: isLate ? "TERLAMBAT" : "PINJAM",
                            });
                            setWaModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          title="Kirim Notifikasi WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WA</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-stone-500 dark:text-slate-400 italic">
                  Tidak ada pinjaman aktif. Siapkan buku lalu scan.
                </p>
              )}
            </div>
          </div>
        )}

        {!anggota && (
          <div className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-dashed border-stone-300 dark:border-slate-800 p-10 text-center backdrop-blur-sm shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <ScanLine className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            </div>
            <p className="text-sm font-bold text-stone-900 dark:text-white">Mulai dengan scan kartu anggota</p>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
              Scanner USB bekerja otomatis seperti keyboard — arahkan kursor, lalu tekan trigger barcode
            </p>
          </div>
        )}
      </div>

      {/* KANAN: log aktivitas */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-stone-200 dark:border-slate-800 shadow-md flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Log Aktivitas
          </h2>
          {log.length > 0 && (
            <button
              onClick={() => setLog([])}
              className="text-xs text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Hapus
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {log.length === 0 ? (
            <p className="text-center text-xs text-stone-400 dark:text-slate-500 italic py-8">
              Belum ada aktivitas scan
            </p>
          ) : (
            log.map((l) => (
              <div
                key={l.id}
                className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm border ${
                  l.ok 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300" 
                    : "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300"
                }`}
              >
                {l.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm break-words">
                    {l.pesan}
                  </p>
                  <p className="text-[10px] text-stone-400 dark:text-slate-400 mt-0.5 font-mono">{l.waktu}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        data={waData}
      />
    </div>
  );
}
