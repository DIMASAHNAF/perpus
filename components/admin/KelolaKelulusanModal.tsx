"use client";

import { useState } from "react";
import {
  GraduationCap,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  BookX,
  Sparkles,
  Info,
} from "lucide-react";
import { getInfoKelas12, hapusSiswaKelas12Permanen } from "@/actions/anggota";
import { useRouter } from "next/navigation";

export function KelolaKelulusanModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [info, setInfo] = useState<{
    totalSiswa: number;
    totalKelas: number;
    namaKelas: string[];
    totalPeminjamAktif: number;
    peminjamAktif: { nama: string; no_anggota: string; judulBuku: string }[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();

  const handleOpen = async () => {
    setIsOpen(true);
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setConfirmText("");
    try {
      const res = await getInfoKelas12();
      setInfo(res);
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal memuat info kelas 12.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "HAPUS") {
      alert("Ketik 'HAPUS' pada kolom konfirmasi untuk melanjutkan.");
      return;
    }

    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await hapusSiswaKelas12Permanen();
      if (res.ok) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 1500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat menghapus data siswa.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Tombol Pemicu Modal */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/20 hover:border-rose-500/30 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs shrink-0"
        title="Hapus permanen siswa kelas 12 yang telah tamat/lulus"
      >
        <GraduationCap className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        <span className="hidden xs:inline">Kelulusan Kelas 12</span>
        <span className="xs:hidden">Tamat</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => !deleting && setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                    Kelulusan / Siswa Tamat
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Hapus permanen seluruh data siswa Kelas XII (12) yang telah lulus
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Konten Loading */}
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-stone-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-rose-600 dark:text-rose-400" />
                <p className="text-xs font-semibold">Memeriksa data siswa Kelas 12 &amp; pinjaman buku...</p>
              </div>
            ) : info ? (
              <div className="space-y-4">
                {/* Ringkasan Data Siswa Kelas 12 */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 block">
                      Total Siswa Kelas 12
                    </span>
                    <span className="text-xl font-black text-stone-900 dark:text-white">
                      {info.totalSiswa} Siswa
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 block">
                      Tanggungan Buku Aktif
                    </span>
                    <span
                      className={`text-xl font-black ${
                        info.totalPeminjamAktif > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {info.totalPeminjamAktif > 0
                        ? `${info.totalPeminjamAktif} Belum Kembali`
                        : "Bebas Pustaka (0)"}
                    </span>
                  </div>
                </div>

                {/* Info Kelas yang Terdeteksi */}
                {info.namaKelas.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-stone-700 dark:text-slate-300 block">
                      Barisan Kelas 12 Terdaftar ({info.namaKelas.length} Kelas):
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto p-2 rounded-xl bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 text-[11px] text-stone-600 dark:text-slate-300">
                      {info.namaKelas.map((k) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-slate-800 font-mono text-[10px]"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Peringatan Jika Masih Ada Buku Belum Kembali */}
                {info.totalPeminjamAktif > 0 ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                    <div className="flex items-start gap-2">
                      <BookX className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          Tidak Dapat Dihapus Langsung
                        </h4>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                          Ada <strong>{info.totalPeminjamAktif} buku</strong> yang masih dipinjam oleh siswa
                          kelas 12. Harap minta siswa mengembalikan buku tersebut terlebih dahulu melalui menu Sirkulasi.
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1 max-h-28 overflow-y-auto text-[11px] bg-white/70 dark:bg-slate-900/70 p-2 rounded-lg border border-amber-500/20">
                      {info.peminjamAktif.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-stone-700 dark:text-slate-300">
                          <span className="font-semibold truncate">
                            {t.nama} ({t.no_anggota})
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-slate-400 truncate max-w-[150px]">
                            {t.judulBuku}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : info.totalSiswa === 0 ? (
                  <div className="p-4 rounded-2xl bg-stone-100 dark:bg-slate-800 text-center space-y-1">
                    <p className="text-xs font-bold text-stone-700 dark:text-slate-300">
                      Tidak Ada Siswa Kelas 12
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400">
                      Seluruh siswa kelas 12 sudah bersih atau belum didaftarkan di sistem.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Bebas Tanggungan Perpustakaan
                      </h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Semua siswa kelas 12 telah mengembalikan pinjaman buku dan siap dihapus permanen.
                      </p>
                    </div>
                  </div>
                )}

                {/* Pesan Kesalahan / Sukses */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Konfirmasi Ketik */}
                {info.totalSiswa > 0 && info.totalPeminjamAktif === 0 && (
                  <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-slate-800">
                    <label className="text-xs font-bold text-stone-700 dark:text-slate-300 block">
                      Konfirmasi Penghapusan Permanen:
                    </label>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400">
                      Ketik kata <span className="font-mono font-bold text-rose-600 dark:text-rose-400">HAPUS</span> di bawah ini untuk mengonfirmasi:
                    </p>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Ketik HAPUS"
                      disabled={deleting}
                      className="w-full h-10 px-3.5 bg-stone-50 dark:bg-slate-950/70 border border-stone-300 dark:border-slate-800 rounded-xl text-xs font-bold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>
                )}

                {/* Tombol Aksi */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-stone-300 dark:border-slate-700"
                  >
                    Batal
                  </button>

                  {info.totalSiswa > 0 && (
                    <button
                      type="button"
                      disabled={
                        deleting ||
                        info.totalPeminjamAktif > 0 ||
                        confirmText.trim().toUpperCase() !== "HAPUS"
                      }
                      onClick={handleExecuteDelete}
                      className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menghapus...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Hapus Permanen Kelas 12</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
