"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createKunjunganByScan } from "@/actions/kunjungan";
import { speak } from "@/lib/voice";
import { CheckCircle2, UserCheck, AlertCircle, X, Sparkles } from "lucide-react";

/**
 * Cek apakah sebuah kode adalah barcode/ISBN buku.
 * Standar ISBN internasional & nasional selalu 10 atau 13 digit berawalan 978 atau 979.
 */
function isBookBarcodeOrIsbn(code: string): boolean {
  const clean = code.trim().replace(/[-\s]/g, "");
  // 1. ISBN-13 atau ISBN-10 berawalan 978 atau 979
  if (/^(978|979)\d{7,10}$/.test(clean)) return true;
  if (clean.length === 13 && (clean.startsWith("978") || clean.startsWith("979"))) return true;
  // 2. Barcode khusus buku perpustakaan (misal awalan BUKU-, EKS-, BK-)
  if (/^(BUKU|EKS|BK)[-_]?\d+/i.test(clean)) return true;
  return false;
}

/**
 * Cek apakah sebuah kode adalah pola kartu anggota / pengunjung perpustakaan SMK.
 */
function isVisitorCardPattern(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed || trimmed.length < 3) return false;

  // Jika kode buku / ISBN, PASTI BUKAN kartu anggota
  if (isBookBarcodeOrIsbn(trimmed)) return false;

  // 1. Format nomor anggota resmi SMKN 1 Beringin: A0001, G0001, S0001, A0002, dll (huruf diikuti 3-7 angka)
  if (/^[A-Za-z]\d{3,7}$/.test(trimmed)) return true;

  // 2. Format NISN Siswa: 8 - 12 digit angka (NISN di Indonesia diawali tahun lahir seperti 007..., bukan 978/979)
  const cleanDigits = trimmed.replace(/[-\s]/g, "");
  if (
    /^\d{8,12}$/.test(cleanDigits) &&
    !cleanDigits.startsWith("978") &&
    !cleanDigits.startsWith("979")
  ) {
    return true;
  }

  // 3. Format QR Code JSON dari kartu digital: {"no_anggota":...} atau {"nisn":...}
  if (
    trimmed.startsWith("{") &&
    (trimmed.includes("no_anggota") || trimmed.includes("nisn") || trimmed.includes("id"))
  ) {
    return true;
  }

  // 4. Format URL kartu digital: .../kartu?id=...
  if (trimmed.includes("/kartu") || trimmed.includes("?id=")) {
    return true;
  }

  // 5. Prefix kartu umum: ANG-, SIS-, GUR-, MBR-
  if (/^(ANG|SIS|GUR|MBR)[-_]?\d+/i.test(trimmed)) {
    return true;
  }

  return false;
}

// Audio Chime untuk scanner latar belakang
function playAttendanceChime(type: "SUCCESS" | "DUPLICATE") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "SUCCESS") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1); // A4
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {}
}

export default function BackgroundAttendanceScanner() {
  const pathname = usePathname();
  const [toast, setToast] = useState<{
    type: "SUCCESS" | "DUPLICATE" | "ERROR";
    title: string;
    description: string;
  } | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

  const showToast = useCallback(
    (type: "SUCCESS" | "DUPLICATE" | "ERROR", title: string, description: string) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ type, title, description });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 5000);
    },
    []
  );

  const processAttendance = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim();
      if (!code || isProcessingRef.current) return;

      const now = Date.now();
      // Debounce 2.5 detik per kode yang sama
      if (lastScanRef.current.code === code && now - lastScanRef.current.time < 2500) {
        return;
      }
      lastScanRef.current = { code, time: now };
      isProcessingRef.current = true;

      try {
        const res = await createKunjunganByScan(code, "Membaca Buku");

        if (res.ok && res.kunjungan) {
          const v = res.kunjungan;
          playAttendanceChime("SUCCESS");
          showToast(
            "SUCCESS",
            `Presensi Berhasil: ${v.nama}`,
            `${v.kelas ? `Kelas ${v.kelas} • ` : ""}Antrean #${v.antreanKe || 1} • Baru saja absen`
          );

          // Broadcast ke tab Kiosk (/kiosk) agar layar Kiosk ikut terupdate seketika
          try {
            const bc = new BroadcastChannel("perpus_kiosk_scan");
            bc.postMessage({ type: "NEW_SCAN", visitor: v });
            bc.close();
          } catch {}

          speak(`Selamat datang ${v.nama}. Presensi kunjungan berhasil dicatat.`);
        } else if ((res as any).isDuplicate) {
          const pengunjung = (res as any).pengunjung;
          playAttendanceChime("DUPLICATE");
          showToast(
            "DUPLICATE",
            `Sudah Presensi: ${pengunjung?.nama || "Pengunjung"}`,
            res.pesan || "Sudah tercatat presensi sebelumnya."
          );
          speak(`${pengunjung?.nama || "Pengunjung"} sudah tercatat berkunjung.`);
        } else {
          showToast("ERROR", "Presensi Gagal", res.pesan || "Kode kartu tidak dikenali.");
        }
      } catch (err: any) {
        console.error("Background attendance error:", err);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [showToast]
  );

  useEffect(() => {
    // Layar khusus /kiosk sudah memiliki scanner visual layar penuh tersendiri
    if (pathname === "/kiosk") return;

    let buffer = "";
    let keyTimes: number[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          (target as any).isContentEditable);

      const now = Date.now();

      // Reset buffer jika jeda antar tombol > 250ms (artinya ketik manual keyboard biasa, bukan mesin scanner)
      if (keyTimes.length > 0 && now - keyTimes[keyTimes.length - 1] > 250) {
        buffer = "";
        keyTimes = [];
      }

      if (e.key === "Enter") {
        const totalDuration = keyTimes.length > 1 ? now - keyTimes[0] : 0;
        const cleanBuffer = buffer.trim();

        // Jika bukan input dan ada karakter dari scanner: SELALU cegah Enter default
        // agar browser TIDAK PERNAH mengklik link "Kembali" / "Dashboard" yang sedang terfokus
        if (!isInput && cleanBuffer.length >= 2) {
          e.preventDefault();
          e.stopPropagation();
        }

        if (cleanBuffer.length >= 2) {
          // 1. KASUS BUKU / ISBN:
          // Jika kode ini berawalan 978/979 (ISBN buku):
          // JANGAN proses sebagai presensi!
          if (isBookBarcodeOrIsbn(cleanBuffer)) {
            // Jika di luar input, tetap cegah Enter agar tidak memicu link kembali
            if (!isInput) {
              e.preventDefault();
              e.stopPropagation();
            }
            buffer = "";
            keyTimes = [];
            return;
          }

          // 2. KASUS KARTU ANGGOTA / PENGUNJUNG:
          // Kode apapun selain ISBN adalah KARTU PENGUNJUNG!
          // SELALU cegah form submit, reload, atau navigasi mundur
          e.preventDefault();
          e.stopPropagation();

          // Jika admin sedang fokus di input (misal lagi ngetik judul/deskripsi buku):
          // Bersihkan teks kartu yang sempat masuk ke input agar formulir tidak terkotori
          if (isInput) {
            const inputEl = target as HTMLInputElement | HTMLTextAreaElement;
            try {
              const curVal = inputEl.value || "";
              let cleanedVal = curVal;
              const idx = curVal.toLowerCase().lastIndexOf(cleanBuffer.toLowerCase());
              if (idx !== -1) {
                cleanedVal = curVal.slice(0, idx) + curVal.slice(idx + cleanBuffer.length);
              } else if (curVal === cleanBuffer) {
                cleanedVal = "";
              }

              const proto =
                inputEl.tagName === "INPUT"
                  ? window.HTMLInputElement.prototype
                  : window.HTMLTextAreaElement.prototype;
              const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
              if (setter) {
                setter.call(inputEl, cleanedVal);
              } else {
                inputEl.value = cleanedVal;
              }
              inputEl.dispatchEvent(new Event("input", { bubbles: true }));
            } catch (err) {
              console.error("Gagal membersihkan input:", err);
            }
          }

          const codeToProcess = cleanBuffer;
          buffer = "";
          keyTimes = [];

          // Proses presensi anggota di latar belakang secara hening tanpa pindah halaman!
          processAttendance(codeToProcess);
          return;
        }

        buffer = "";
        keyTimes = [];
      } else if (e.key.length === 1) {
        buffer += e.key;
        keyTimes.push(now);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [pathname, processAttendance]);

  if (!toast) return null;

  return (
    <aside
      aria-label="Notifikasi Presensi Latar Belakang"
      className="fixed bottom-5 right-5 z-[9999] max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div
        className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start gap-3.5 transition-all ${
          toast.type === "SUCCESS"
            ? "bg-slate-900/95 border-emerald-500/40 text-white shadow-emerald-500/10"
            : toast.type === "DUPLICATE"
            ? "bg-slate-900/95 border-amber-500/40 text-white shadow-amber-500/10"
            : "bg-slate-900/95 border-rose-500/40 text-white shadow-rose-500/10"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            toast.type === "SUCCESS"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : toast.type === "DUPLICATE"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
          }`}
        >
          {toast.type === "SUCCESS" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : toast.type === "DUPLICATE" ? (
            <UserCheck className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                toast.type === "SUCCESS"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : toast.type === "DUPLICATE"
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-rose-500/20 text-rose-300"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Presensi Otomatis
            </span>
          </div>
          <h4 className="text-xs font-bold truncate text-slate-100">{toast.title}</h4>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
            {toast.description}
          </p>
        </div>

        <button
          onClick={() => setToast(null)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
