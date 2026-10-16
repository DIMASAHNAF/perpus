import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowLeftRight, 
  FileText
} from "lucide-react";
import FormPeminjaman from "@/components/admin/FormPeminjaman";
import DaftarTransaksiTable from "@/components/admin/DaftarTransaksiTable";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function TransaksiPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [siswaList, bukuBiasaList, bukuMapelList, transaksiList] = await Promise.all([
    prisma.siswa.findMany({
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, nisn: true, kelas: true },
    }),
    prisma.buku.findMany({
      where: { stok_tersedia: { gt: 0 }, tipe_buku: "BIASA" },
      orderBy: { judul: "asc" },
      select: { id: true, judul: true, penulis: true, stok_tersedia: true, kode_buku: true },
    }),
    prisma.buku.findMany({
      where: { stok_tersedia: { gt: 0 }, tipe_buku: "MAPEL" },
      orderBy: { judul: "asc" },
      select: { id: true, judul: true, penulis: true, stok_tersedia: true, kode_buku: true, kategori: true, tahun_ajaran: true },
    }),
    prisma.transaksi.findMany({
      include: { 
        siswa: { select: { id: true, nama: true, nisn: true, kelas: true } }, 
        buku: { select: { id: true, judul: true, penulis: true, kode_buku: true, tipe_buku: true } },
        anggota: { 
          select: { 
            id: true, 
            nama: true, 
            nisn: true, 
            jenis: true, 
            no_anggota: true, 
            telepon: true, 
            kelasRef: { select: { nama_kelas: true } } 
          } 
        },
        eksemplar: { 
          select: { 
            id: true, 
            kode: true, 
            buku: { select: { id: true, judul: true, penulis: true, kode_buku: true, tipe_buku: true } } 
          } 
        },
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
  ]);

  const normalizedTransaksiList = transaksiList.map((t) => {
    const namaSiswa = t.siswa?.nama || t.anggota?.nama || "Peminjam";
    const nisnSiswa = t.siswa?.nisn || t.anggota?.nisn || t.anggota?.no_anggota || "-";
    const kelasSiswa = t.siswa?.kelas || t.anggota?.kelasRef?.nama_kelas || (t.anggota?.jenis === "GURU" ? "GURU" : t.anggota?.jenis === "STAF" ? "STAF" : "-");
    const teleponSiswa = t.anggota?.telepon || null;
    
    const judulBuku = t.buku?.judul || t.eksemplar?.buku?.judul || "Buku Perpustakaan";
    const penulisBuku = t.buku?.penulis || t.eksemplar?.buku?.penulis || "-";
    const kodeBuku = t.eksemplar?.kode || t.buku?.kode_buku || null;
    const tipeBuku = (t.buku?.tipe_buku || t.eksemplar?.buku?.tipe_buku || t.tipe_buku || "BIASA") as "BIASA" | "MAPEL";

    return {
      id: t.id,
      siswaId: t.siswaId || t.anggotaId || null,
      bukuId: t.bukuId || t.eksemplar?.buku?.id || null,
      tgl_pinjam: t.tgl_pinjam.toISOString(),
      batas_kembali: t.batas_kembali.toISOString(),
      tgl_dikembalikan: t.tgl_dikembalikan ? t.tgl_dikembalikan.toISOString() : null,
      status: t.status as "DIPINJAM" | "SELESAI",
      denda: t.denda,
      groupId: t.groupId,
      siswa: {
        id: t.siswa?.id || t.anggota?.id || "unknown",
        nama: namaSiswa,
        nisn: nisnSiswa,
        kelas: kelasSiswa,
        telepon: teleponSiswa,
      },
      buku: {
        id: t.buku?.id || t.eksemplar?.buku?.id || "unknown",
        judul: judulBuku,
        penulis: penulisBuku,
        tipe_buku: tipeBuku,
        kode_buku: kodeBuku,
      },
    };
  });


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 selection:bg-emerald-500 selection:text-white relative overflow-x-hidden font-sans transition-colors duration-300">
      {/* Background Glowing Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-600/15 blur-[120px] animate-blob" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-[130px] animate-blob [animation-delay:-6s]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[140px] animate-blob [animation-delay:-12s]" />
      </div>

      {/* Top Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-stone-200/80 dark:border-slate-800 sticky top-0 z-20 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link 
                href="/admin" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-stone-300/80 dark:border-slate-700/80 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <span className="text-stone-300 dark:text-slate-700 hidden sm:inline">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src="/assets/logo.png"
                  alt="Logo SMK Negeri 1 Beringin"
                  className="w-7 h-7 object-contain rounded-lg bg-white/60 dark:bg-white/10 border border-stone-200 dark:border-white/20 p-0.5 shrink-0 hidden xs:block"
                />
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-base font-bold text-stone-900 dark:text-white leading-tight truncate">
                    Sistem Transaksi
                  </h1>
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-slate-400 hidden sm:block truncate">
                    Kelola sirkulasi buku &amp; denda
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <ThemeToggle />
              <Link
                href="/admin/laporan"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-stone-300/80 dark:border-slate-700/80 transition-all shadow-xs shrink-0"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Laporan</span>
              </Link>
              <div className="text-[11px] text-emerald-400 bg-emerald-500/15 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-emerald-500/30 font-semibold shrink-0 hidden xs:block">
                Admin
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 print:p-0 print:m-0">
        {/* Form Peminjaman Baru dengan Custom Hari */}
        <div className="print:hidden">
          <FormPeminjaman siswaList={siswaList} bukuBiasaList={bukuBiasaList} bukuMapelList={bukuMapelList} />
        </div>

        {/* Tabel Daftar & Riwayat Transaksi */}
        <div>
          <DaftarTransaksiTable transaksiList={normalizedTransaksiList} />
        </div>
      </div>
    </div>
  );
}
