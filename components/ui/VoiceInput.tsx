"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  name: string;
  label?: ReactNode;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  /** update eksternal (mis. prefill ISBN) — tulis ke DOM */
  value?: string;
  prefillValue?: string;
  className?: string;
  /** dikte panjang (true) atau satu kalimat (false) */
  continuous?: boolean;
}

/**
 * Universal Voice Input Component:
 * - Mendukung Web Speech API (Chrome, Edge, Safari, Android)
 * - Meminta izin mikrofon eksplisit via getUserMedia
 * - Auto-restart saat jeda bicara selama user belum menekan tombol stop
 * - Memicu event input & change native agar terbaca sempurna oleh form
 */
export function VoiceInput({
  name,
  label,
  placeholder,
  required,
  defaultValue = "",
  value,
  prefillValue,
  className,
  continuous = true,
}: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const elRef = useRef<HTMLInputElement>(null);
  const finalRef = useRef(defaultValue ? `${defaultValue} ` : "");

  const effectiveValue = value !== undefined ? value : prefillValue;

  useEffect(() => {
    if (effectiveValue === undefined || !elRef.current) return;
    if (effectiveValue !== elRef.current.value) {
      elRef.current.value = effectiveValue;
      finalRef.current = effectiveValue ? `${effectiveValue.trim()} ` : "";
    }
  }, [effectiveValue]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setListening(false);
    setStatusText(null);
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
      alert(
        "Browser Anda belum mendukung Web Speech Recognition. Silakan gunakan Google Chrome atau Microsoft Edge untuk fitur voice note suara."
      );
      return;
    }

    if (listening || isListeningRef.current) {
      stopListening();
      return;
    }

    // 1. Minta izin akses mikrofon secara eksplisit jika belum diizinkan
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
        "Akses mikrofon tidak diizinkan. Mohon izinkan akses mikrofon di browser Anda (klik ikon gembok/setelan di samping alamat web)."
      );
      return;
    }

    const el = elRef.current;
    if (el) finalRef.current = el.value ? `${el.value.trim()} ` : "";

    try {
      const rec = new SR();
      rec.lang = "id-ID";
      rec.continuous = continuous;
      rec.interimResults = true;

      rec.onstart = () => {
        setListening(true);
        isListeningRef.current = true;
        setStatusText("Mendengarkan...");
      };

      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalRef.current += r[0].transcript;
          else interim += r[0].transcript;
        }
        if (el) {
          const combined = (finalRef.current + interim).replace(/\s+/g, " ").trim();
          el.value = combined;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
        setStatusText("Merekam suara...");
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e?.error);
        if (e?.error === "no-speech") {
          // Hening sejenak, biarkan tetap aktif
          return;
        }
        if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
          stopListening();
          alert(
            "Izin mikrofon tidak aktif atau diblokir. Mohon berikan izin mikrofon pada browser Anda."
          );
          return;
        }
        if (e?.error === "network") {
          setStatusText("Koneksi pengenalan suara terputus...");
          return;
        }
      };

      rec.onend = () => {
        // Jika pengguna belum klik tombol stop, lanjutkan mendengarkan secara otomatis
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
          setStatusText(null);
        }
      };

      recRef.current = rec;
      rec.start();
      setListening(true);
      isListeningRef.current = true;
      setStatusText("Bicara sekarang...");
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      stopListening();
      alert("Gagal mengaktifkan mikrofon: " + (err?.message || "Silakan coba lagi"));
    }
  }, [listening, continuous, stopListening]);

  return (
    <div className={className}>
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex gap-2">
        <input
          ref={elRef}
          name={name}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className="flex-1 h-11 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-xs"
        />
        <button
          type="button"
          onClick={start}
          title={
            listening
              ? "Klik untuk berhenti merekam suara"
              : "Klik untuk merekam suara (Bahasa Indonesia)"
          }
          className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer touch-manipulation shadow-xs ${
            listening
              ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-500/40"
          }`}
        >
          {listening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
        </button>

        {listening && statusText && (
          <div className="absolute -bottom-5 left-1 flex items-center gap-1.5 text-[10px] font-bold text-rose-500 dark:text-rose-400 animate-pulse z-10 bg-white dark:bg-slate-900 px-2 py-0.5 rounded shadow-xs border border-rose-200 dark:border-rose-900">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>{statusText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
