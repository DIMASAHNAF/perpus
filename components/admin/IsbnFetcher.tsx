"use client";

import { useState } from "react";
import { Search, Loader2, BookOpen, CheckCircle2 } from "lucide-react";

interface IsbnFetcherProps {
  onFetch: (data: {
    judul: string;
    penulis: string;
    cover_url: string | null;
    kategori?: string | null;
  }) => void;
}

/**
 * Fetch metadata dari Google Books API (no API key, public endpoint).
 * Isi form judul/penulis/cover otomatis. User bisa edit hasilnya.
 */
export function IsbnFetcher({ onFetch }: IsbnFetcherProps) {
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const fetchIsbn = async () => {
    const clean = isbn.trim().replace(/[-\s]/g, "");
    if (!clean || clean.length < 10) {
      setOk(false);
      setMsg("ISBN minimal 10 digit");
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}`
      );
      const json = await res.json();

      if (!json.items || json.items.length === 0) {
        setOk(false);
        setMsg(`ISBN ${clean} tidak ditemukan di Google Books`);
        return;
      }

      const info = json.items[0].volumeInfo;
      const cover =
        info.imageLinks?.extraLarge ??
        info.imageLinks?.large ??
        info.imageLinks?.medium ??
        info.imageLinks?.thumbnail ??
        null;

      onFetch({
        judul: info.title ?? "",
        penulis: (info.authors ?? []).join(", "),
        cover_url: cover,
        kategori: (info.categories ?? [])[0] ?? null,
      });

      // sinkronkan ke field form name=isbn
      const formIsbn = document.querySelector<HTMLInputElement>(
        "input[name=\"isbn\"]"
      );
      if (formIsbn) formIsbn.value = clean;

      setOk(true);
      setMsg(info.title ? `Ditemukan: ${info.title}` : "Metadata ditemukan");
    } catch {
      setOk(false);
      setMsg("Gagal menghubungi Google Books API. Coba lagi atau isi manual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
        <Search className="w-3.5 h-3.5 text-emerald-600" />
        Auto-Fetch dari ISBN (opsional)
      </label>
      <div className="flex gap-2">
        <input
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              fetchIsbn();
            }
          }}
          placeholder="9786021234567"
          className="flex-1 h-10 font-mono tracking-wide border border-slate-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={fetchIsbn}
          disabled={loading}
          className="shrink-0 h-10 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <BookOpen className="w-3.5 h-3.5" />
          )}
          {loading ? "Mencari…" : "Cari"}
        </button>
      </div>
      {msg && (
        <p
          className={`text-[11px] flex items-center gap-1.5 ${
            ok ? "text-emerald-700" : "text-rose-600"
          }`}
        >
          {ok && <CheckCircle2 className="w-3.5 h-3.5" />}
          {msg}
        </p>
      )}
    </div>
  );
}
