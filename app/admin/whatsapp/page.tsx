import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Sparkles, Send } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { WhatsAppCenterClient } from "@/components/admin/WhatsAppCenterClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pusat Notifikasi & Pengingat WhatsApp - Perpustakaan SMKN 1 Beringin",
  description: "Kirim pengingat jatuh tempo, tagihan denda, dan bukti peminjaman buku perpustakaan via WhatsApp.",
};

export default async function WhatsAppPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Query all active and recent transactions
  const transaksiList = await prisma.transaksi.findMany({
    where: {
      status: "DIPINJAM",
    },
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
          kelasRef: { select: { nama_kelas: true } },
        },
      },
      eksemplar: {
        select: {
          id: true,
          kode: true,
          buku: { select: { id: true, judul: true, penulis: true, kode_buku: true, tipe_buku: true } },
        },
      },
    },
    orderBy: { batas_kembali: "asc" },
  });

  const formattedPinjaman = transaksiList.map((t) => ({
    id: t.id,
    nama: t.anggota?.nama || t.siswa?.nama || "Peminjam",
    kelas: t.siswa?.kelas || t.anggota?.kelasRef?.nama_kelas || (t.anggota?.jenis === "GURU" ? "GURU" : t.anggota?.jenis === "STAF" ? "STAF" : null),
    nisn: t.siswa?.nisn || t.anggota?.nisn || null,
    telepon: t.anggota?.telepon || null,
    no_anggota: t.anggota?.no_anggota || null,
    judul_buku: t.buku?.judul || t.eksemplar?.buku?.judul || "Buku Perpustakaan",
    kode_eksemplar: t.eksemplar?.kode || t.buku?.kode_buku || null,
    tgl_pinjam: t.tgl_pinjam.toISOString(),
    batas_kembali: t.batas_kembali.toISOString(),
    status: t.status as "DIPINJAM" | "SELESAI",
    denda: t.denda,
  }));

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Background Glowing Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-600/15 blur-[120px] animate-blob" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-[130px] animate-blob [animation-delay:-6s]" />
      </div>

      {/* Top Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-stone-200/80 dark:border-slate-800 sticky top-0 z-20 shadow-xs">
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
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-base font-bold text-stone-900 dark:text-white leading-tight truncate">
                    Pusat Notifikasi WhatsApp
                  </h1>
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-slate-400 hidden sm:block truncate">
                    Broadcast pengingat jatuh tempo &amp; tagihan denda
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <WhatsAppCenterClient pinjamanList={formattedPinjaman} />
      </div>
    </div>
  );
}
