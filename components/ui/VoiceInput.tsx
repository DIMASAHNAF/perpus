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
  className?: string;
  /** dikte panjang (true) atau satu kalimat (false) */
  continuous?: boolean;
}

/**
 * Web Speech API (webkitSpeechRecognition) — Chrome/Edge only.
 * Bahasa id-ID. Uncontrolled: isi langsung DOM biar bisa ditimpa
 * komponen lain (mis. VoiceNoteBuku) tanpa di-reset React.
 * Firefox/Safari: tombol mic disabled, user ketik manual.
 */
export function VoiceInput({
  name,
  label,
  placeholder,
  required,
  defaultValue = "",
  value,
  className,
  continuous = true,
}: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const elRef = useRef<HTMLInputElement>(null);
  const finalRef = useRef(defaultValue ? `${defaultValue} ` : "");

  // Update eksternal (mis. prefill ISBN) — tulis langsung ke DOM
  // agar tidak bentrok dengan hasil dikte yang sudah ada.
  useEffect(() => {
    if (value === undefined || !elRef.current) return;
    if (value !== elRef.current.value) {
      elRef.current.value = value;
      finalRef.current = value ? `${value.trim()} ` : "";
    }
  }, [value]);

  const start = useCallback(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SR) {
      setSupported(false);
      return;
    }

    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }

    const el = elRef.current;
    if (el) finalRef.current = el.value ? `${el.value.trim()} ` : "";

    const rec = new SR();
    rec.lang = "id-ID";
    rec.continuous = continuous;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (el) el.value = (finalRef.current + interim).replace(/\s+/g, " ").trim();
    };

    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, continuous]);

  return (
    <div className={className}>
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <input
          ref={elRef}
          name={name}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className="flex-1 h-10 border border-slate-300 rounded-lg px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
        <button
          type="button"
          onClick={start}
          disabled={!supported}
          title={
            !supported
              ? "Voice input tidak didukung di browser ini"
              : listening
                ? "Berhenti merekam"
                : "Rekam suara (id-ID)"
          }
          className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            listening
              ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200"
              : supported
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
