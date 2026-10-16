"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, AudioLines, Loader2 } from "lucide-react";

type FieldMap = Record<string, string>;

const KEYWORDS: FieldMap = {
  judul: "judul",
  penulis: "penulis",
  pengarang: "penulis",
  penulisnya: "penulis",
  kategori: "kategori",
  mata_pelajaran: "kategori",
  mapel: "kategori",
  klasifikasi: "klasifikasi",
  ddc: "klasifikasi",
  isbn: "isbn",
  tahun_ajaran: "tahun_ajaran",
  tahun: "tahun_ajaran",
  cover: "cover_url",
  sampul: "cover_url",
  stok: "stok_total",
  jumlah: "stok_total",
  kode: "kode_buku",
  selesai: "__selesai__",
  berhenti: "__selesai__",
};

const FIELD_LABELS: FieldMap = {
  judul: "Judul",
  penulis: "Penulis",
  kategori: "Kategori",
  klasifikasi: "Klasifikasi",
  isbn: "ISBN",
  tahun_ajaran: "Tahun ajaran",
  cover_url: "Cover",
  stok_total: "Stok",
  kode_buku: "Kode buku",
};

export function VoiceNoteBuku() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [lastField, setLastField] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const finalText = useRef("");

  const writeField = (name: string, value: string) => {
    const el = document.querySelector<HTMLInputElement | HTMLSelectElement>(
      `input[name="${name}"], select[name="${name}"]`
    );
    if (!el) return false;
    const v = value.replace(/\s+/g, " ").trim();
    if (el instanceof HTMLSelectElement) {
      const match = Array.from(el.options).find((o) =>
        v.toLowerCase().includes(o.value.toLowerCase())
      );
      if (match) {
        el.value = match.value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return true;
    }
    if (name === "stok_total") {
      const num = parseInt(v.replace(/\D/g, ""), 10);
      if (!isNaN(num)) {
        el.value = String(num);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return true;
    }
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  };

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setListening(false);
    try {
      if (recRef.current) {
        recRef.current.onend = null;
        recRef.current.onerror = null;
        recRef.current.stop();
      }
    } catch {}
  }, []);

  const start = useCallback(async () => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SR) {
      setSupported(false);
      alert(
        "Browser Anda belum mendukung Web Speech Recognition. Disarankan menggunakan Google Chrome atau Microsoft Edge untuk fitur dikte suara."
      );
      return;
    }

    if (listening || isListeningRef.current) {
      stopListening();
      return;
    }

    // Minta izin mikrofon eksplisit jika belum diizinkan
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let needsPrompt = true;
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const status = await navigator.permissions.query({ name: "microphone" as any });
            if (status.state === "granted") {
              needsPrompt = false;
            }
          } catch {}
        }
        if (needsPrompt) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    } catch (permErr: any) {
      console.warn("Microphone permission denied:", permErr);
      alert(
        "Akses mikrofon ditolak atau tidak tersedia. Mohon izinkan akses mikrofon di browser Anda (ikon gembok di samping link web)."
      );
      return;
    }

    try {
      const rec = new SR();
      rec.lang = "id-ID";
      rec.continuous = true;
      rec.interimResults = true;

      finalText.current = "";

      rec.onstart = () => {
        setListening(true);
        isListeningRef.current = true;
      };

      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText.current += r[0].transcript;
          else interim += r[0].transcript;
        }

        const full = (finalText.current + " " + interim).toLowerCase();

        // Routing kata kunci ke field form
        const tokens = full.split(/\s+/).filter(Boolean);
        const out: FieldMap = {};
        let cur = "judul";
        let buf: string[] = [];

        const flush = () => {
          const v = buf.join(" ").trim();
          if (!v) return;
          out[cur] = out[cur] ? `${out[cur]} ${v}` : v;
          buf = [];
        };

        for (const raw of tokens) {
          const t = raw.replace(/[^\w]/g, "");
          const target = KEYWORDS[t];
          if (target === "__selesai__") {
            flush();
            stopListening();
            break;
          }
          if (target && target !== cur) {
            flush();
            cur = target;
          } else {
            buf.push(raw);
          }
        }
        flush();

        for (const [field, val] of Object.entries(out)) {
          if (writeField(field, val)) setLastField(FIELD_LABELS[field] || field);
        }

        setTranscript((finalText.current + " " + interim).trim());
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e?.error);
        if (e?.error === "no-speech") return;
        if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
          stopListening();
          alert("Izin mikrofon tidak aktif atau diblokir. Mohon berikan izin mikrofon pada browser Anda.");
          return;
        }
      };

      rec.onend = () => {
        if (isListeningRef.current) {
          try {
            rec.start();
          } catch {
            setTimeout(() => {
              if (isListeningRef.current) {
                try {
                  rec.start();
                } catch {}
              }
            }, 300);
          }
        } else {
          setListening(false);
        }
      };

      recRef.current = rec;
      rec.start();
      setListening(true);
      isListeningRef.current = true;
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      stopListening();
      alert("Gagal mengaktifkan mikrofon: " + (err?.message || "Silakan coba lagi"));
    }
  }, [listening, stopListening]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center">
          <AudioLines className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-white">
            Voice Note — Dikte Input Buku (Bahasa Indonesia)
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
            Bicara sekali, sistem isi form otomatis. Sebut nama field:{" "}
            <strong className="text-blue-600 dark:text-blue-400">judul</strong>,{" "}
            <strong className="text-blue-600 dark:text-blue-400">penulis</strong>,{" "}
            <strong className="text-blue-600 dark:text-blue-400">kategori</strong>,{" "}
            <strong className="text-blue-600 dark:text-blue-400">klasifikasi</strong>,{" "}
            <strong className="text-blue-600 dark:text-blue-400">tahun</strong>. Akhiri dengan{" "}
            <strong className="text-blue-600 dark:text-blue-400">selesai</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={start}
          title={listening ? "Berhenti merekam" : "Mulai dikte (id-ID)"}
          className={`shrink-0 h-10 px-4 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer touch-manipulation ${
            listening
              ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30 ring-4 ring-rose-500/30"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 active:scale-95"
          }`}
        >
          {listening ? (
            <>
              <MicOff className="w-4 h-4 text-white" /> Berhenti
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" /> Dikte
            </>
          )}
        </button>
      </div>

      {transcript && (
        <div className="bg-white dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            Transkrip Suara {listening && <Loader2 className="w-3 h-3 inline animate-spin" />}
          </p>
          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono">{transcript}</p>
          {lastField && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
              Field terakhir diisi: <strong className="text-blue-600 dark:text-blue-400">{lastField}</strong>. Periksa hasil sebelum simpan.
            </p>
          )}
        </div>
      )}

      {!supported && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-2.5">
          ⚠️ Browser ini belum mendukung Web Speech Recognition. Gunakan Google Chrome atau Microsoft Edge untuk fitur dikte suara.
        </p>
      )}
    </div>
  );
}
