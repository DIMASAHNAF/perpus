"use client";

import { useState, useTransition } from "react";
import { User, BookOpen, Calendar, Clock, Sparkles, AlertCircle, Check, BookMarked, Package, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createTransaksi } from "@/actions/transaksi";
import { formatDate } from "@/lib/utils";

type SiswaItem = {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
};

type BukuBiasaItem = {
  id: string;
  judul: string;
  penulis: string;
  stok_tersedia: number;
  kode_buku: string | null;
};

type BukuMapelItem = {
  id: string;
  judul: string;
  penulis: string;
  stok_tersedia: number;
  kode_buku: string | null;
  kategori: string | null;
  tahun_ajaran: string | null;
};

interface FormPeminjamanProps {
  siswaList: SiswaItem[];
  bukuBiasaList: BukuBiasaItem[];
  bukuMapelList: BukuMapelItem[];
}

type TabType = "BIASA" | "MAPEL";

export default function FormPeminjaman({ siswaList, bukuBiasaList, bukuMapelList }: FormPeminjamanProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>("BIASA");

  // BIASA state
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [selectedBukuIds, setSelectedBukuIds] = useState<string[]>([]);
  const [durasiPreset, setDurasiPreset] = useState<"3" | "7" | "14" | "30" | "custom_days" | "custom_date">("7");
  const [customDays, setCustomDays] = useState<number>(7);
  const [customDate, setCustomDate] = useState<string>("");

  // MAPEL state
  const [selectedSiswaMapel, setSelectedSiswaMapel] = useState("");
  const [selectedBukuMapelIds, setSelectedBukuMapelIds] = useState<string[]>([]);
  const [batasKembaliMapel, setBatasKembaliMapel] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Kalkulasi tanggal kembali Buku Biasa ---
  const today = new Date();
  const calculatedDueDate = (() => {
    if (durasiPreset === "custom_date" && customDate) {
      const d = new Date(customDate);
      return isNaN(d.getTime()) ? today : d;
    }
    const d = new Date();
    const days = durasiPreset === "custom_days" ? (customDays || 1) : parseInt(durasiPreset, 10);
    d.setDate(d.getDate() + (days || 7));
    return d;
  })();

  const totalHari = (() => {
    if (durasiPreset === "custom_date" && customDate) {
      const d = new Date(customDate);
      const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff);
    }
    return durasiPreset === "custom_days" ? (customDays || 1) : parseInt(durasiPreset, 10);
  })();

  // --- Default batas kembali mapel = akhir tahun ajaran (30 Juni) ---
  const defaultBatasMapel = (() => {
    const now = new Date();
    const tahunDepan = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    return `${tahunDepan}-06-30`;
  })();

  const resetBiasa = () => {
    setSelectedSiswa("");
    setSelectedBukuIds([]);
    setDurasiPreset("7");
    setCustomDays(7);
    setCustomDate("");
  };

  const resetMapel = () => {
    setSelectedSiswaMapel("");
    setSelectedBukuMapelIds([]);
    setBatasKembaliMapel("");
  };

  const toggleBuku = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleSubmitBiasa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedSiswa) { setErrorMessage("Silakan pilih siswa peminjam."); return; }
    if (selectedBukuIds.length === 0) { setErrorMessage("Silakan pilih minimal 1 buku yang tersedia."); return; }

    const formData = new FormData();
    formData.append("siswaId", selectedSiswa);
    formData.append("gaya", "BIASA");
    selectedBukuIds.forEach((id) => formData.append("bukuIds", id));

    if (durasiPreset === "custom_date" && customDate) {
      formData.append("batasKembali", customDate);
    } else {
      const days = durasiPreset === "custom_days" ? customDays : parseInt(durasiPreset, 10);
      formData.append("durasiHari", String(days || 7));
    }

    startTransition(async () => {
      try {
        await createTransaksi(formData);
        setSuccessMessage(`Peminjaman buku biasa berhasil dicatat (${totalHari} hari)!`);
        resetBiasa();
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Gagal mencatat peminjaman");
      }
    });
  };

  const handleSubmitMapel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedSiswaMapel) { setErrorMessage("Silakan pilih siswa peminjam."); return; }
    if (selectedBukuMapelIds.length === 0) { setErrorMessage("Silakan pilih minimal 1 buku mapel/LKS."); return; }

    const formData = new FormData();
    formData.append("siswaId", selectedSiswaMapel);
    formData.append("gaya", "MAPEL");
    selectedBukuMapelIds.forEach((id) => formData.append("bukuIds", id));
    formData.append("batasKembali", batasKembaliMapel || defaultBatasMapel);

    startTransition(async () => {
      try {
        await createTransaksi(formData);
        const selectedCount = selectedBukuMapelIds.length;
        setSuccessMessage(`Peminjaman ${selectedCount} buku mapel berhasil dicatat!`);
        resetMapel();
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Gagal mencatat peminjaman");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => { setActiveTab("BIASA"); setErrorMessage(null); setSuccessMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "BIASA"
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Buku Biasa
          <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full ${
            activeTab === "BIASA" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            Individual
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("MAPEL"); setErrorMessage(null); setSuccessMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "MAPEL"
              ? "bg-violet-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BookMarked className="w-4 h-4" />
          Buku Mapel / LKS
          <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full ${
            activeTab === "MAPEL" ? "bg-violet-500 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            Paket
          </span>
        </button>
      </div>

      <div className="p-6">
        {/* Alert / Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ============================== */}
        {/* TAB BUKU BIASA (INDIVIDUAL)   */}
        {/* ============================== */}
        {activeTab === "BIASA" && (
          <form onSubmit={handleSubmitBiasa} className="space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Peminjaman Buku Biasa</h2>
                <p className="text-xs text-slate-500">
                  Peminjaman individual dengan durasi hari kustom
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Siswa Peminjam *
                </label>
                <select
                  value={selectedSiswa}
                  onChange={(e) => setSelectedSiswa(e.target.value)}
                  className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Nama Siswa --</option>
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.nisn}) - {s.kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  Buku Tersedia * (boleh lebih dari satu)
                </label>
                <div className="border border-slate-300 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {bukuBiasaList.length === 0 && (
                    <p className="p-3 text-xs text-slate-500">Tidak ada buku biasa tersedia.</p>
                  )}
                  {bukuBiasaList.map((b) => (
                    <label
                      key={b.id}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors ${
                        selectedBukuIds.includes(b.id)
                          ? "bg-emerald-50 text-emerald-900"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBukuIds.includes(b.id)}
                        onChange={() => toggleBuku(b.id, selectedBukuIds, setSelectedBukuIds)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="flex-1 truncate">
                        {b.judul}
                        {b.kode_buku ? <span className="text-slate-400 font-mono text-[10px]"> [{b.kode_buku}]</span> : ""}
                      </span>
                      <span className={`text-[10px] font-semibold shrink-0 ${
                        b.stok_tersedia > 0 ? "text-emerald-600" : "text-rose-500"
                      }`}>
                        Sisa {b.stok_tersedia}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedBukuIds.length > 0
                    ? `Terpilih: ${selectedBukuIds.length} buku`
                    : "Centang 1 atau lebih buku untuk dipinjam."}
                </p>
              </div>
            </div>

            {/* Custom Duration */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Durasi Peminjaman (Custom Hari)
                </label>
                <span className="text-[11px] text-slate-500">
                  Saat ini: <strong className="text-emerald-700">{totalHari} Hari</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "3", label: "3 Hari", desc: "Singkat" },
                  { id: "7", label: "7 Hari", desc: "Standar" },
                  { id: "14", label: "14 Hari", desc: "2 Minggu" },
                  { id: "30", label: "30 Hari", desc: "1 Bulan" },
                  { id: "custom_days", label: "Kustom Hari", desc: "Input Angka" },
                  { id: "custom_date", label: "Pilih Tanggal", desc: "Kalender" },
                ].map((preset) => {
                  const isActive = durasiPreset === preset.id;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => setDurasiPreset(preset.id as typeof durasiPreset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                        isActive
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-bold">{preset.label}</span>
                      <span className={`text-[10px] ml-1.5 opacity-80 ${isActive ? "text-emerald-100" : "text-slate-400"}`}>
                        ({preset.desc})
                      </span>
                    </button>
                  );
                })}
              </div>

              {durasiPreset === "custom_days" && (
                <div className="pt-2 flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      Jumlah Hari Peminjaman:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={customDays}
                        onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full h-9 border border-slate-300 rounded-lg px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Contoh: 5, 10, 21 hari..."
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">Hari</span>
                    </div>
                  </div>
                </div>
              )}

              {durasiPreset === "custom_date" && (
                <div className="pt-2 flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      Pilih Tanggal Batas Pengembalian:
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full h-9 border border-slate-300 rounded-lg px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Tanggal Pinjam: <strong>{formatDate(today)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <span>Jatuh Tempo: <strong>{formatDate(calculatedDueDate)}</strong> ({totalHari} Hari)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} className="h-10 px-6 cursor-pointer">
                <Sparkles className="w-4 h-4 mr-1.5" />
                {isPending ? "Menyimpan..." : "Catat Peminjaman Buku Biasa"}
              </Button>
            </div>
          </form>
        )}

        {/* ============================== */}
        {/* TAB BUKU MAPEL / LKS (PAKET)  */}
        {/* ============================== */}
        {activeTab === "MAPEL" && (
          <form onSubmit={handleSubmitMapel} className="space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <div className="p-2 bg-violet-100 text-violet-700 rounded-lg">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Peminjaman Buku Mapel / LKS</h2>
                <p className="text-xs text-slate-500">
                  Buku paket per kelas — berganti setiap tahun ajaran baru
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-2.5 p-3.5 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-800">
              <Package className="w-4 h-4 shrink-0 mt-0.5 text-violet-600" />
              <div>
                <p className="font-semibold mb-0.5">Peminjaman Paket Tahun Ajaran</p>
                <p className="text-violet-700 leading-relaxed">
                  Buku mapel/LKS dipinjam untuk 1 tahun ajaran penuh. Batas pengembalian default adalah akhir tahun ajaran (30 Juni). Buku dikembalikan dan diganti saat naik kelas / tahun ajaran baru.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <User className="w-3.5 h-3.5 text-violet-600" />
                  Siswa Peminjam *
                </label>
                <select
                  value={selectedSiswaMapel}
                  onChange={(e) => setSelectedSiswaMapel(e.target.value)}
                  className="w-full h-10 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Nama Siswa --</option>
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.nisn}) - {s.kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <BookMarked className="w-3.5 h-3.5 text-violet-600" />
                  Buku Mapel / LKS * (boleh lebih dari satu)
                </label>
                <div className="border border-slate-300 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {bukuMapelList.length === 0 && (
                    <p className="p-3 text-xs text-slate-500">Belum ada buku mapel/LKS terdaftar.</p>
                  )}
                  {bukuMapelList.map((b) => (
                    <label
                      key={b.id}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors ${
                        selectedBukuMapelIds.includes(b.id)
                          ? "bg-violet-50 text-violet-900"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBukuMapelIds.includes(b.id)}
                        onChange={() => toggleBuku(b.id, selectedBukuMapelIds, setSelectedBukuMapelIds)}
                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                      <span className="flex-1 truncate">
                        {b.judul}
                        {b.tahun_ajaran ? <span className="text-slate-400 text-[10px]"> ({b.tahun_ajaran})</span> : ""}
                        {b.kategori ? <span className="text-slate-400 text-[10px]"> — {b.kategori}</span> : ""}
                      </span>
                      <span className={`text-[10px] font-semibold shrink-0 ${
                        b.stok_tersedia > 0 ? "text-violet-600" : "text-rose-500"
                      }`}>
                        Sisa {b.stok_tersedia}
                      </span>
                    </label>
                  ))}
                </div>
                {bukuMapelList.length === 0 ? (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Belum ada buku mapel/LKS terdaftar. Tambah dulu di menu Koleksi Buku.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {selectedBukuMapelIds.length > 0
                      ? `Terpilih: ${selectedBukuMapelIds.length} buku`
                      : "Centang 1 atau lebih buku untuk dipinjam."}
                  </p>
                )}
              </div>
            </div>

            {/* Batas Kembali Mapel */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Calendar className="w-4 h-4 text-violet-600" />
                Batas Pengembalian (Akhir Tahun Ajaran)
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-xs">
                  <input
                    type="date"
                    value={batasKembaliMapel || defaultBatasMapel}
                    onChange={(e) => setBatasKembaliMapel(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-9 border border-slate-300 rounded-lg px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Default: 30 Juni (akhir tahun ajaran)
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                <span>Tanggal Pinjam: <strong>{formatDate(today)}</strong></span>
                <div className="font-medium text-violet-800 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-200">
                  Batas: <strong>{formatDate(new Date(batasKembaliMapel || defaultBatasMapel))}</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="h-10 px-6 cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Package className="w-4 h-4 mr-1.5" />
                {isPending ? "Menyimpan..." : "Catat Peminjaman Mapel/LKS"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
