import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hitungDenda } from "@/lib/utils";
import { generateTerlambatMessage, sendViaWhatsAppGateway, formatNomorWhatsApp } from "@/lib/whatsapp";
import { timingSafeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/wa-terlambat
 * Endpoint Cron Otomatis untuk mengirim notifikasi WhatsApp keterlambatan buku.
 * Dapat dipanggil secara otomatis oleh Cron Job (aaPanel, Linux crontab, Vercel Cron, atau EasyCron).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const secretKey = searchParams.get("key") || authHeader?.replace("Bearer ", "");

    // Validasi token rahasia wajib disetel di .env dan cocok
    const expectedSecret = process.env.CRON_SECRET;
    if (!expectedSecret || !timingSafeCompare(secretKey, expectedSecret)) {
      return NextResponse.json(
        { error: "Akses ditolak. Secret key tidak valid atau CRON_SECRET belum disetel." },
        { status: 401 }
      );
    }

    const now = new Date();

    // 1. Cari semua transaksi yang statusnya DIPINJAM dan sudah melewati batas_kembali
    const overdueTransactions = await prisma.transaksi.findMany({
      where: {
        status: "DIPINJAM",
        batas_kembali: { lt: now },
      },
      include: {
        siswa: { select: { nama: true, kelas: true, nisn: true } },
        anggota: {
          select: {
            nama: true,
            telepon: true,
            nisn: true,
            jenis: true,
            kelasRef: { select: { nama_kelas: true } },
          },
        },
        buku: { select: { judul: true, kode_buku: true } },
        eksemplar: {
          select: {
            kode: true,
            buku: { select: { judul: true, kode_buku: true } },
          },
        },
      },
      orderBy: { batas_kembali: "asc" },
    });

    if (overdueTransactions.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "Tidak ada peminjam yang terlambat saat ini.",
        totalOverdue: 0,
        sentCount: 0,
        skippedCount: 0,
        failedCount: 0,
      });
    }

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const logs: Array<{ id: string; nama: string; telepon: string | null; status: string; detail?: string }> = [];

    for (const t of overdueTransactions) {
      const nama = t.anggota?.nama || t.siswa?.nama || "Peminjam";
      const kelas =
        t.siswa?.kelas ||
        t.anggota?.kelasRef?.nama_kelas ||
        (t.anggota?.jenis === "GURU" ? "GURU" : t.anggota?.jenis === "STAF" ? "STAF" : null);
      const rawTelepon = t.anggota?.telepon;
      const cleanPhone = formatNomorWhatsApp(rawTelepon);
      const judul = t.buku?.judul || t.eksemplar?.buku?.judul || "Buku Perpustakaan";

      const hariTerlambat = Math.max(
        1,
        Math.floor((now.getTime() - new Date(t.batas_kembali).getTime()) / (1000 * 60 * 60 * 24))
      );
      const denda = hitungDenda(t.batas_kembali, now);

      if (!cleanPhone) {
        skippedCount++;
        logs.push({
          id: t.id,
          nama,
          telepon: null,
          status: "SKIPPED",
          detail: "Nomor WhatsApp tidak terdaftar di data anggota.",
        });
        continue;
      }

      const message = generateTerlambatMessage({
        nama,
        kelas,
        judul_buku: judul,
        batas_kembali: new Date(t.batas_kembali).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        hari_terlambat: hariTerlambat,
        denda,
      });

      // Kirim via WA Gateway (Fonnte / API gateway yang dikonfigurasi)
      const res = await sendViaWhatsAppGateway(cleanPhone, message);

      if (res.ok) {
        sentCount++;
        logs.push({
          id: t.id,
          nama,
          telepon: cleanPhone,
          status: "SENT",
          detail: res.message,
        });
      } else {
        failedCount++;
        logs.push({
          id: t.id,
          nama,
          telepon: cleanPhone,
          status: "FAILED",
          detail: res.message,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      totalOverdue: overdueTransactions.length,
      sentCount,
      skippedCount,
      failedCount,
      logs,
    });
  } catch (error: any) {
    console.error("Cron WA Terlambat Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
