"use client";

import { useState } from "react";
import { IsbnFetcher } from "@/components/admin/IsbnFetcher";
import { VoiceNoteBuku } from "@/components/admin/VoiceNoteBuku";
import { VoiceInput } from "@/components/ui/VoiceInput";

type Prefill = {
  judul: string;
  penulis: string;
  cover_url: string | null;
  kategori?: string | null;
};

/**
 * Wrapper client untuk form tambah buku:
 * - IsbnFetcher prefill judul/penulis/cover
 * - VoiceInput untuk judul/penulis
 * - Submit tetap ke server action createBuku
 */
export function BukuFormClient({
  createBuku,
  mataPelajaran,
  today,
}: {
  createBuku: (formData: FormData) => Promise<void>;
  mataPelajaran: string[];
  today: string;
}) {
  const [prefill, setPrefill] = useState<Prefill | null>(null);

  return (
    <form action={createBuku} className="space-y-5">
      <IsbnFetcher onFetch={setPrefill} />
      <VoiceNoteBuku />

      {/* Tipe Buku */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <label className="text-xs font-bold text-slate-800">Jenis Buku</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipe_buku"
              value="BIASA"
              defaultChecked
              className="cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-700">Buku Biasa</span>
            <span className="text-xs text-slate-500">
              (Peminjaman individual, durasi fleksibel)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipe_buku"
              value="MAPEL"
              className="cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-700">
              Buku Mapel / LKS
            </span>
            <span className="text-xs text-slate-500">
              (Paket per kelas, ganti per tahun ajaran)
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
          Kode Buku (Unik)
        </label>
        <input
          name="kode_buku"
          placeholder="Contoh: 001, B-IPA-01, LKS-IPA-2024"
          className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Kode unik untuk identifikasi buku (opsional, tapi disarankan)
        </p>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
          ISBN
        </label>
        <input
          name="isbn"
          inputMode="numeric"
          placeholder="9786021234567 (opsional)"
          className="w-full h-10 font-mono border border-slate-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
      </div>

      <VoiceInput
        name="judul"
        label="Judul Buku (bisa bicara)"
        required
        value={prefill?.judul ?? ""}
        placeholder="Contoh: IPA Terpadu Kelas X, LKS Matematika Kelas XI"
      />

      <VoiceInput
        name="penulis"
        label="Nama Penulis / Pengarang (bisa bicara)"
        required
        value={prefill?.penulis ?? ""}
        placeholder="Contoh: Tim Pengembang, Kementerian Pendidikan"
      />

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
          Kategori / Mata Pelajaran
        </label>
        <select
          name="kategori"
          defaultValue={prefill?.kategori ?? ""}
          className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
        >
          <option value="">-- Pilih Mata Pelajaran --</option>
          {mataPelajaran.map((mp) => (
            <option key={mp} value={mp}>
              {mp}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400 mt-1">
          Pilih kategori mata pelajaran atau jenis buku
        </p>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
          Nomor Klasifikasi DDC
        </label>
        <input
          name="klasifikasi"
          defaultValue=""
          placeholder="Contoh: 808.81, 370.1, R 370.1 (R = referensi)"
          className="w-full h-10 font-mono border border-slate-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Penentu lokasi rak: 000-099 → Rak 1 … 800+ → Lemari Referensi. Awalan{" "}
          <strong>R</strong> = koleksi referensi (hanya baca di tempat)
        </p>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
          Tahun Ajaran (Untuk Buku Mapel/LKS)
        </label>
        <input
          name="tahun_ajaran"
          placeholder="Contoh: 2024/2025, 2025/2026"
          className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
          URL Sampul / Cover
        </label>
        <input
          name="cover_url"
          type="url"
          defaultValue={prefill?.cover_url ?? ""}
          placeholder="https://books.google.com/…"
          className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Terisi otomatis dari ISBN. Bisa diubah manual.
        </p>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
          Jumlah Stok Awal
        </label>
        <input
          name="stok_total"
          type="number"
          min="1"
          required
          defaultValue="1"
          className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          className="h-10 px-5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2 transition-colors"
        >
          Simpan Buku
        </button>
        <a
          href="/admin/buku"
          className="h-10 px-5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 flex items-center transition-colors"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
