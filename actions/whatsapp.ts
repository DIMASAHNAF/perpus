"use server";

import { prisma } from "@/lib/prisma";
import { hitungDenda } from "@/lib/utils";
import { requireAdminSession } from "@/lib/security";
import {
  formatNomorWhatsApp,
  generatePinjamMessage,
  generatePengingatMessage,
  generateTerlambatMessage,
  generateKembaliMessage,
  createWhatsAppWebUrl,
  sendViaWhatsAppGateway,
  WhatsAppPayloadPinjam,
  WhatsAppPayloadPengingat,
  WhatsAppPayloadTerlambat,
  WhatsAppPayloadKembali,
} from "@/lib/whatsapp";

/**
 * Ambil daftar peminjam terlambat lengkap dengan info kontak siswa/anggota
 */
export async function getDaftarPeminjamTerlambat() {
  await requireAdminSession();
  const now = new Date();

  const transaksiList = await prisma.transaksi.findMany({
    where: {
      status: "DIPINJAM",
      batas_kembali: { lt: now },
    },
    include: {
      siswa: true,
      buku: true,
      anggota: true,
      eksemplar: true,
    },
    orderBy: { batas_kembali: "asc" },
  });

  return transaksiList.map((t) => {
    const hariTerlambat = Math.max(
      1,
      Math.floor((now.getTime() - new Date(t.batas_kembali).getTime()) / (1000 * 60 * 60 * 24))
    );
    const denda = hitungDenda(t.batas_kembali, now);

    const nama = t.anggota?.nama || t.siswa?.nama || "Peminjam";
    const kelas = t.siswa?.kelas || (t.anggota?.jenis === "GURU" ? "GURU" : t.anggota?.jenis === "STAF" ? "STAF" : null);
    const telepon = t.anggota?.telepon || null;
    const nisn = t.siswa?.nisn || t.anggota?.nisn || null;
    const no_anggota = t.anggota?.no_anggota || null;
    const judul = t.buku?.judul || "Buku Perpustakaan";
    const kode = t.eksemplar?.kode || t.buku?.kode_buku || "";

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

    const waUrl = telepon ? createWhatsAppWebUrl(telepon, message) : null;

    return {
      id: t.id,
      nama,
      kelas,
      nisn,
      no_anggota,
      telepon,
      judul,
      kode,
      tgl_pinjam: new Date(t.tgl_pinjam).toISOString(),
      batas_kembali: new Date(t.batas_kembali).toISOString(),
      hariTerlambat,
      denda,
      defaultMessage: message,
      waUrl,
    };
  });
}

/**
 * Kirim pesan notifikasi WhatsApp via Gateway API
 */
export async function kirimWhatsAppAction(
  targetPhone: string,
  message: string
): Promise<{ ok: boolean; message: string; response?: any }> {
  await requireAdminSession();
  return await sendViaWhatsAppGateway(targetPhone, message);
}

/**
 * Batch broadcast pengingat terlambat ke semua siswa terlambat yang memiliki nomor telepon
 */
export async function broadcastPengingatTerlambatAction(transaksiIds?: string[]) {
  await requireAdminSession();
  const list = await getDaftarPeminjamTerlambat();
  const targetList = transaksiIds && transaksiIds.length > 0
    ? list.filter((item) => transaksiIds.includes(item.id))
    : list;

  const validTargets = targetList.filter((item) => !!item.telepon);

  if (validTargets.length === 0) {
    return {
      ok: false,
      message: "Tidak ada data peminjam terlambat yang memiliki nomor WhatsApp terdaftar.",
      totalSent: 0,
      totalSuccess: 0,
    };
  }

  let successCount = 0;
  let failCount = 0;

  for (const item of validTargets) {
    if (item.telepon) {
      const res = await sendViaWhatsAppGateway(item.telepon, item.defaultMessage);
      if (res.ok) successCount++;
      else failCount++;
    }
  }

  return {
    ok: successCount > 0,
    message: `Berhasil mengirim ke ${successCount} nomor. Gagal: ${failCount}.`,
    totalSent: validTargets.length,
    totalSuccess: successCount,
  };
}
