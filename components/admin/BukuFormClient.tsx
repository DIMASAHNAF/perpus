"use client";

import { useState, useEffect } from "react";
import { IsbnFetcher } from "@/components/admin/IsbnFetcher";
import { VoiceNoteBuku } from "@/components/admin/VoiceNoteBuku";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { EbookUploadField } from "@/components/admin/EbookUploadField";
import { CoverUploadField } from "@/components/admin/CoverUploadField";
import { Save, BookOpen, User, Tag, Layers, Bookmark } from "lucide-react";
import Link from "next/link";

type Prefill = {
  judul: string;
  penulis: string;
  cover_url: string | null;
  kategori?: string | null;
  klasifikasi?: string | null;
};

export function BukuFormClient({
  createBuku,
  mataPelajaran,
  today,
  initialIsbn,
}: {
  createBuku: (formData: FormData) => Promise<void>;
  mataPelajaran: string[];
  today: string;
  initialIsbn?: string;
}) {
  const [prefill, setPrefill] = useState<Prefill | null>(null);

  useEffect(() => {
    if (initialIsbn) {
      const formIsbn = document.querySelector<HTMLInputElement>('input[name="isbn"]');
      if (formIsbn) {
        formIsbn.value = initialIsbn;
        formIsbn.dispatchEvent(new Event("input", { bubbles: true }));
      }
      const formKode = document.querySelector<HTMLInputElement>('input[name="kode_buku"]');
      if (formKode && !formKode.value) {
        formKode.value = initialIsbn;
        formKode.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  }, [initialIsbn]);

  const handlePrefill = (data: Prefill) => {
    setPrefill(data);

    // Langsung sinkronkan ke elemen DOM untuk jaminan instan 100%
    setTimeout(() => {
      const formJudul = document.querySelector<HTMLInputElement>('input[name="judul"]');
      if (formJudul && data.judul) {
        formJudul.value = data.judul;
        formJudul.dispatchEvent(new Event("input", { bubbles: true }));
      }

      const formPenulis = document.querySelector<HTMLInputElement>('input[name="penulis"]');
      if (formPenulis && data.penulis) {
        formPenulis.value = data.penulis;
        formPenulis.dispatchEvent(new Event("input", { bubbles: true }));
      }

      const formKategori = document.querySelector<HTMLSelectElement>('select[name="kategori"]');
      if (formKategori && data.kategori) {
        formKategori.value = data.kategori;
        formKategori.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const formKlasifikasi = document.querySelector<HTMLInputElement>('input[name="klasifikasi"]');
      if (formKlasifikasi && data.klasifikasi) {
        formKlasifikasi.value = data.klasifikasi;
      }

      const formCover = document.querySelector<HTMLInputElement>('input[name="cover_url"]');
      if (formCover && data.cover_url) {
        formCover.value = data.cover_url;
      }
    }, 50);
  };

  return (
    <form action={createBuku} className="space-y-6">
      <IsbnFetcher onFetch={handlePrefill} />
      <VoiceNoteBuku />

      {/* Tipe Buku */}
      <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Jenis &amp; Tipe Buku</label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all shadow-xs">
            <input
              type="radio"
              name="tipe_buku"
              value="BIASA"
              defaultChecked
              className="w-4 h-4 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">Buku Biasa / Umum</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Peminjaman individual, durasi fleksibel
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all shadow-xs">
            <input
              type="radio"
              name="tipe_buku"
              value="MAPEL"
              className="w-4 h-4 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">Buku Mapel / LKS</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Paket per kelas, ganti per tahun ajaran
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Kode Buku (Unik)
          </label>
          <input
            name="kode_buku"
            defaultValue={initialIsbn || ""}
            placeholder="Contoh: 001, B-IPA-01, LKS-IPA-2024"
            className="w-full h-11 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono shadow-xs"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Kode unik identifikasi buku (opsional)
          </p>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            ISBN
          </label>
          <input
            name="isbn"
            defaultValue={initialIsbn || ""}
            inputMode="numeric"
            placeholder="9786021234567 (opsional)"
            className="w-full h-11 font-mono border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-xs"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Nomor Standar Buku Internasional
          </p>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Judul Buku *
        </label>
        <VoiceInput
          name="judul"
          required
          placeholder="Masukkan judul buku..."
          prefillValue={prefill?.judul}
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Penulis / Pengarang *
        </label>
        <VoiceInput
          name="penulis"
          required
          placeholder="Nama penulis atau penyusun..."
          prefillValue={prefill?.penulis}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Kategori / Mata Pelajaran
          </label>
          <select
            name="kategori"
            defaultValue={prefill?.kategori || ""}
            className="w-full h-11 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-xs"
          >
            <option value="">-- Pilih Kategori --</option>
            {mataPelajaran.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Klasifikasi / DDC
          </label>
          <input
            name="klasifikasi"
            placeholder="Contoh: 500 (Sains), 004 (Komputer)"
            className="w-full h-11 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono shadow-xs"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Jumlah Stok Eksemplar *
          </label>
          <input
            name="stok_total"
            type="number"
            min="1"
            defaultValue="1"
            required
            className="w-full h-11 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono shadow-xs"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tahun Ajaran / Terbit
          </label>
          <input
            name="tahun_ajaran"
            placeholder="Contoh: 2024/2025"
            className="w-full h-11 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Foto Sampul / Cover Upload */}
      <CoverUploadField initialCoverUrl={prefill?.cover_url} />

      {/* E-Book PDF Upload */}
      <EbookUploadField />

      <div className="flex items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
        <button
          type="submit"
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Save className="w-4 h-4" />
          Simpan Buku
        </button>
        <Link
          href="/admin/buku"
          className="h-11 px-5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-sm font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 flex items-center transition-all cursor-pointer shadow-xs"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
