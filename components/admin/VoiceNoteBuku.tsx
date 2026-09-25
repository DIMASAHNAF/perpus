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

/**
 * Voice Note untuk input buku: pustakawan ngomong sekali,
 * sistem routing ke field form berdasarkan keyword.
 *
 * Contoh: "Judul IPA Terpadu Kelas X. Penulis Tim Edukatif.
 *          Kategori IPA. Klasifikasi 500. Tahun 2024/2025. Selesai."
 *
 * Field form tidak ter-reset karena VoiceInput uncontrolled
 * dan kita tulis langsung ke DOM (querySelector by name).
 */
export function VoiceNoteBuku() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [lastField, setLastField] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const buffers = useRef<FieldMap>({});
  const finalText = useRef("");

  const writeField = (name: string, value: string) => {
    const el = document.querySelector<
      HTMLInputElement | HTMLSelectElement
    >(`input[name="${name}"], select[name="${name}"]`);
    if (!el) return false;
    const v = value.replace(/\s+/g, " ").trim();
    if (el instanceof HTMLSelectElement) {
      const match = Array.from(el.options).find((o) =>
        v.toLowerCase().includes(o.value.toLowerCase())
      );
      if (match) el.value = match.value;
      return true;
    }
    if (name === "stok_total") {
      const num = parseInt(v.replace(/\D/g, ""), 10);
      if (!isNaN(num)) el.value = String(num);
      return true;
    }
    el.value = v;
    return true;
  };

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

    const rec = new SR();
    rec.lang = "id-ID";
    rec.continuous = true;
    rec.interimResults = true;

    finalText.current = "";

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText.current += r[0].transcript;
        else interim += r[0].transcript;
      }

      const full = (finalText.current + " " + interim).toLowerCase();

      // Routing sederhana: kumpulkan kata ke buffer, flush ke field
      // saat ketemu keyword field berikutnya.
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

    rec.onend = () => {
      setListening(false);
    };
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening]);

  if (!supported) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
          <AudioLines className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800">
            Voice Note — Dikte Input Buku
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
            Bicara sekali, sistem isi form otomatis. Sebut nama field dulu:{" "}
            <strong>judul</strong>, <strong>penulis</strong>,{" "}
            <strong>kategori</strong>, <strong>klasifikasi</strong>,{" "}
            <strong>tahun</strong>. Akhiri dengan <strong>selesai</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={start}
          title={listening ? "Berhenti merekam" : "Mulai dikte (id-ID)"}
          className={`shrink-0 h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all ${
            listening
              ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {listening ? (
            <>
              <MicOff className="w-4 h-4" /> Berhenti
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" /> Dikte
            </>
          )}
        </button>
      </div>

      {transcript && (
        <div className="bg-white/80 rounded-lg border border-emerald-100 px-3 py-2">
          <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">
            Transkrip {listening && <Loader2 className="w-3 h-3 inline animate-spin" />}
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">{transcript}</p>
          {lastField && (
            <p className="text-[10px] text-slate-500 mt-1.5">
              Field terakhir diisi: <strong>{lastField}</strong>. Periksa hasil sebelum simpan.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
