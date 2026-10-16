"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/security";

export type StockOpnameSummary = {
  total: number;
  terpindai: number;
  belumTerpindai: number;
  sesuai: number;
  salahRak: number;
  rusak: number;
  anomaliDipinjam: number;
  persentase: number;
};

/**
 * Buat sesi Stock Opname baru.
 * Otomatis mengambil snapshot seluruh eksemplar (atau per rak tertentu).
 */
export async function createStockOpnameSession(data: {
  nama_sesi: string;
  petugas?: string;
  rakId?: string | null;
  catatan?: string;
}) {
  await requireAdminSession();
  if (!data.nama_sesi || !data.nama_sesi.trim()) {
    throw new Error("Nama sesi Stock Opname wajib diisi");
  }

  const rakId = data.rakId && data.rakId.trim() !== "" ? data.rakId : null;

  // Ambil daftar eksemplar snapshot
  const eksemplarList = await prisma.eksemplar.findMany({
    where: rakId ? { rakId } : undefined,
    select: {
      id: true,
      status: true,
      rakId: true,
    },
  });

  if (eksemplarList.length === 0) {
    throw new Error(
      rakId
        ? "Tidak ada eksemplar terdaftar pada rak yang dipilih"
        : "Belum ada eksemplar buku di database untuk diaudit"
    );
  }

  // Buat Sesi & Batch Items dalam 1 transaksi
  const sesi = await prisma.$transaction(async (tx) => {
    const newSesi = await tx.stockOpname.create({
      data: {
        nama_sesi: data.nama_sesi.trim(),
        petugas: data.petugas?.trim() || "Petugas Perpustakaan",
        rakId: rakId,
        catatan: data.catatan?.trim() || null,
        status: "BERJALAN",
      },
    });

    const itemsData = eksemplarList.map((eks) => ({
      stockOpnameId: newSesi.id,
      eksemplarId: eks.id,
      status_sistem: eks.status,
      rakId_sistem: eks.rakId,
      is_terpindai: false,
    }));

    // Chunk createMany jika data sangat banyak
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < itemsData.length; i += CHUNK_SIZE) {
      await tx.stockOpnameItem.createMany({
        data: itemsData.slice(i, i + CHUNK_SIZE),
      });
    }

    return newSesi;
  });

  revalidatePath("/admin/stock-opname");
  revalidatePath("/admin");

  return { ok: true, id: sesi.id, totalItems: eksemplarList.length };
}

/**
 * Ambil daftar seluruh sesi Stock Opname beserta metrik ringkas.
 */
export async function getStockOpnameList() {
  await requireAdminSession();
  const sessions = await prisma.stockOpname.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rakRef: { select: { id: true, nama: true, nomor: true } },
      _count: {
        select: { items: true },
      },
    },
  });

  // Hitung stats untuk setiap sesi
  const results = await Promise.all(
    sessions.map(async (sesi) => {
      const items = await prisma.stockOpnameItem.findMany({
        where: { stockOpnameId: sesi.id },
        select: {
          is_terpindai: true,
          status_sistem: true,
          status_fisik: true,
          rakId_sistem: true,
          rakId_fisik: true,
        },
      });

      const total = items.length;
      const terpindai = items.filter((i) => i.is_terpindai).length;
      const belumTerpindai = total - terpindai;
      const rusak = items.filter((i) => i.status_fisik === "RUSAK").length;
      
      const salahRak = items.filter(
        (i) =>
          i.is_terpindai &&
          i.rakId_fisik &&
          i.rakId_sistem &&
          i.rakId_fisik !== i.rakId_sistem
      ).length;

      const anomaliDipinjam = items.filter(
        (i) => i.is_terpindai && i.status_sistem === "DIPINJAM"
      ).length;

      const sesuai = items.filter(
        (i) =>
          i.is_terpindai &&
          i.status_sistem === "TERSEDIA" &&
          (!i.rakId_fisik || i.rakId_fisik === i.rakId_sistem) &&
          (i.status_fisik === "BAIK" || !i.status_fisik)
      ).length;

      const persentase = total > 0 ? Math.round((terpindai / total) * 100) : 0;

      return {
        ...sesi,
        summary: {
          total,
          terpindai,
          belumTerpindai,
          sesuai,
          salahRak,
          rusak,
          anomaliDipinjam,
          persentase,
        },
      };
    })
  );

  return results;
}

/**
 * Ambil detail lengkap 1 sesi Stock Opname beserta item-item auditnya.
 */
export async function getStockOpnameDetail(id: string) {
  await requireAdminSession();
  const sesi = await prisma.stockOpname.findUnique({
    where: { id },
    include: {
      rakRef: true,
      items: {
        orderBy: [{ is_terpindai: "desc" }, { waktu_scan: "desc" }, { createdAt: "asc" }],
        include: {
          eksemplar: {
            include: {
              buku: {
                select: {
                  id: true,
                  judul: true,
                  penulis: true,
                  kode_buku: true,
                  cover_url: true,
                  klasifikasi: true,
                  kategori: true,
                  tipe_buku: true,
                },
              },
              rak: {
                select: {
                  id: true,
                  nama: true,
                  nomor: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!sesi) return null;

  // Daftar rak untuk opsi dropdown
  const allRaks = await prisma.rak.findMany({
    orderBy: { nomor: "asc" },
  });

  // Kalkulasi statistik
  const total = sesi.items.length;
  const terpindai = sesi.items.filter((i) => i.is_terpindai).length;
  const belumTerpindai = total - terpindai;
  const rusak = sesi.items.filter((i) => i.status_fisik === "RUSAK").length;
  
  const salahRak = sesi.items.filter(
    (i) =>
      i.is_terpindai &&
      i.rakId_fisik &&
      i.rakId_sistem &&
      i.rakId_fisik !== i.rakId_sistem
  ).length;

  const anomaliDipinjam = sesi.items.filter(
    (i) => i.is_terpindai && i.status_sistem === "DIPINJAM"
  ).length;

  const sesuai = sesi.items.filter(
    (i) =>
      i.is_terpindai &&
      i.status_sistem === "TERSEDIA" &&
      (!i.rakId_fisik || i.rakId_fisik === i.rakId_sistem) &&
      (i.status_fisik === "BAIK" || !i.status_fisik)
  ).length;

  const persentase = total > 0 ? Math.round((terpindai / total) * 100) : 0;

  const summary: StockOpnameSummary = {
    total,
    terpindai,
    belumTerpindai,
    sesuai,
    salahRak,
    rusak,
    anomaliDipinjam,
    persentase,
  };

  return {
    sesi,
    summary,
    allRaks,
  };
}

/**
 * Scan barcode eksemplar pada sesi audit.
 * Mendukung scan kode eksemplar 8 digit (mis. 00001234) atau kode buku.
 */
export async function scanEksemplarOpname(data: {
  stockOpnameId: string;
  barcode: string;
  status_fisik?: "BAIK" | "RUSAK" | "HILANG";
  rakId_fisik?: string | null;
  catatan?: string;
}) {
  await requireAdminSession();
  const barcode = data.barcode.trim().replace(/[-\s]/g, "");
  if (!barcode) {
    return { ok: false, sound: "error" as const, pesan: "Barcode tidak boleh kosong" };
  }

  const sesi = await prisma.stockOpname.findUnique({
    where: { id: data.stockOpnameId },
  });

  if (!sesi) {
    return { ok: false, sound: "error" as const, pesan: "Sesi Stock Opname tidak ditemukan" };
  }

  if (sesi.status !== "BERJALAN") {
    return {
      ok: false,
      sound: "error" as const,
      pesan: `Sesi ini sudah ${sesi.status.toLowerCase()} dan tidak dapat dipindai lagi`,
    };
  }

  // Format 8-digit padding jika berupa angka sequential
  const padCode = /^\d{1,8}$/.test(barcode) ? barcode.padStart(8, "0") : barcode;

  // Cari eksemplar berdasarkan kode 8 digit, atau cari dari kode buku
  let eksemplar = await prisma.eksemplar.findFirst({
    where: {
      OR: [
        { kode: barcode },
        { kode: padCode },
        { buku: { kode_buku: barcode } },
      ],
    },
    include: {
      buku: true,
      rak: true,
    },
  });

  if (!eksemplar) {
    return {
      ok: false,
      sound: "error" as const,
      pesan: `Eksemplar dengan kode/barcode "${barcode}" tidak terdaftar di perpustakaan`,
    };
  }

  // Cek apakah item sudah ada di dalam sesi audit ini
  let item = await prisma.stockOpnameItem.findUnique({
    where: {
      stockOpnameId_eksemplarId: {
        stockOpnameId: data.stockOpnameId,
        eksemplarId: eksemplar.id,
      },
    },
  });

  const rakFisikId = data.rakId_fisik || sesi.rakId || eksemplar.rakId;
  const statusFisik = data.status_fisik || "BAIK";

  // Jika item belum ada di sesi (misal sesi filter per Rak 1, tapi buku ini fisik ada di Rak 1 padahal data sistem di Rak 2)
  if (!item) {
    item = await prisma.stockOpnameItem.create({
      data: {
        stockOpnameId: data.stockOpnameId,
        eksemplarId: eksemplar.id,
        status_sistem: eksemplar.status,
        rakId_sistem: eksemplar.rakId,
        is_terpindai: true,
        status_fisik: statusFisik,
        rakId_fisik: rakFisikId,
        waktu_scan: new Date(),
        catatan: data.catatan?.trim() || "Buku ditemukan dari luar cakupan rak awal",
      },
    });
  } else {
    // Update item yang sudah ada
    item = await prisma.stockOpnameItem.update({
      where: { id: item.id },
      data: {
        is_terpindai: true,
        status_fisik: statusFisik,
        rakId_fisik: rakFisikId,
        waktu_scan: new Date(),
        catatan: data.catatan?.trim() || item.catatan,
      },
    });
  }

  // Analisis hasil scan
  const isSalahRak =
    rakFisikId &&
    item.rakId_sistem &&
    rakFisikId !== item.rakId_sistem;

  const isDipinjamWarning = item.status_sistem === "DIPINJAM";
  const isRusak = statusFisik === "RUSAK";

  let soundType: "success" | "warning" | "error" = "success";
  let statusBadge = "SESUAI";
  let pesanDetail = `Buku "${eksemplar.buku.judul}" (${eksemplar.kode}) berhasil diverifikasi`;

  if (isDipinjamWarning) {
    soundType = "warning";
    statusBadge = "ANOMALI_DIPINJAM";
    pesanDetail = `PERINGATAN: Buku "${eksemplar.buku.judul}" di sistem berstatus DIPINJAM tapi ditemukan di rak fisik!`;
  } else if (isSalahRak) {
    soundType = "warning";
    statusBadge = "SALAH_RAK";
    pesanDetail = `Buku "${eksemplar.buku.judul}" berada di rak yang berbeda dari database.`;
  } else if (isRusak) {
    soundType = "warning";
    statusBadge = "RUSAK";
    pesanDetail = `Buku "${eksemplar.buku.judul}" dicatat dalam kondisi RUSAK.`;
  }

  revalidatePath(`/admin/stock-opname/${data.stockOpnameId}`);

  return {
    ok: true,
    sound: soundType,
    statusBadge,
    pesan: pesanDetail,
    item: {
      id: item.id,
      eksemplarId: eksemplar.id,
      kode: eksemplar.kode,
      judul: eksemplar.buku.judul,
      penulis: eksemplar.buku.penulis,
      cover_url: eksemplar.buku.cover_url,
      rakSistem: eksemplar.rak?.nama ?? "Belum ditentukan",
      statusSistem: item.status_sistem,
      isSalahRak,
      isDipinjamWarning,
      isRusak,
      waktuScan: new Date().toLocaleTimeString("id-ID"),
    },
  };
}

/**
 * Update manual item hasil audit (ubah kondisi / pindah rak / catatan).
 */
export async function manualUpdateOpnameItem(data: {
  itemId: string;
  is_terpindai?: boolean;
  status_fisik?: "BAIK" | "RUSAK" | "HILANG" | null;
  rakId_fisik?: string | null;
  catatan?: string | null;
}) {
  await requireAdminSession();
  const item = await prisma.stockOpnameItem.update({
    where: { id: data.itemId },
    data: {
      ...(data.is_terpindai !== undefined && { is_terpindai: data.is_terpindai }),
      ...(data.status_fisik !== undefined && { status_fisik: data.status_fisik }),
      ...(data.rakId_fisik !== undefined && { rakId_fisik: data.rakId_fisik }),
      ...(data.catatan !== undefined && { catatan: data.catatan }),
      waktu_scan: data.is_terpindai ? new Date() : null,
    },
  });

  revalidatePath(`/admin/stock-opname/${item.stockOpnameId}`);
  return { ok: true, item };
}

/**
 * Cepat perbarui lokasi rak eksemplar langsung di Master Database saat salah rak.
 */
export async function quickFixRakEksemplar(data: {
  eksemplarId?: string;
  newRakId: string;
  stockOpnameId?: string;
  itemId?: string;
}) {
  await requireAdminSession();
  try {
    let targetEksemplarId = data.eksemplarId;

    // Jika itemId disertakan, pastikan kita bisa ambil eksemplarId dari item jika targetEksemplarId belum valid
    if (data.itemId) {
      const opnameItem = await prisma.stockOpnameItem.findUnique({
        where: { id: data.itemId },
        select: { eksemplarId: true },
      });
      if (opnameItem?.eksemplarId) {
        targetEksemplarId = opnameItem.eksemplarId;
      }
    }

    if (!targetEksemplarId) {
      return { ok: false, error: "ID Eksemplar tidak ditemukan" };
    }

    // Pastikan eksemplar ada sebelum update
    const existingEksemplar = await prisma.eksemplar.findUnique({
      where: { id: targetEksemplarId },
    });

    if (!existingEksemplar) {
      return { ok: false, error: "Data eksemplar tidak ditemukan di database" };
    }

    await prisma.eksemplar.update({
      where: { id: targetEksemplarId },
      data: { rakId: data.newRakId },
    });

    if (data.itemId) {
      await prisma.stockOpnameItem.update({
        where: { id: data.itemId },
        data: {
          rakId_fisik: data.newRakId,
          rakId_sistem: data.newRakId,
        },
      });
    }

    if (data.stockOpnameId) {
      revalidatePath(`/admin/stock-opname/${data.stockOpnameId}`);
    }
    revalidatePath("/admin/buku");

    return { ok: true, pesan: "Lokasi rak eksemplar berhasil diperbarui" };
  } catch (error: any) {
    console.error("quickFixRakEksemplar error:", error);
    return { ok: false, error: error?.message || "Gagal memperbarui rak eksemplar" };
  }
}

/**
 * Selesaikan Sesi Stock Opname & Opsi Rekonsiliasi Master Database Otomatis.
 */
export async function selesaikanStockOpname(data: {
  stockOpnameId: string;
  sinkronDatabase: boolean;
}) {
  await requireAdminSession();
  const sesi = await prisma.stockOpname.findUnique({
    where: { id: data.stockOpnameId },
    include: {
      items: {
        include: {
          eksemplar: true,
        },
      },
    },
  });

  if (!sesi) throw new Error("Sesi Stock Opname tidak ditemukan");
  if (sesi.status !== "BERJALAN") throw new Error("Sesi ini sudah ditutup");

  await prisma.$transaction(async (tx) => {
    // Update status sesi
    await tx.stockOpname.update({
      where: { id: data.stockOpnameId },
      data: {
        status: "SELESAI",
        tanggal_selesai: new Date(),
      },
    });

    // Jika admin memilih untuk rekonsiliasi data master otomatis
    if (data.sinkronDatabase) {
      for (const item of sesi.items) {
        // 1. Eksemplar tidak ditemukan dan sebelumnya status TERSEDIA -> update ke HILANG
        if (!item.is_terpindai && item.status_sistem === "TERSEDIA") {
          await tx.eksemplar.update({
            where: { id: item.eksemplarId },
            data: { status: "HILANG" },
          });

          await tx.buku.update({
            where: { id: item.eksemplar.bukuId },
            data: { stok_tersedia: { decrement: 1 } },
          });
        }

        // 2. Eksemplar dilaporkan RUSAK fisik
        if (item.status_fisik === "RUSAK" && item.status_sistem !== "RUSAK") {
          await tx.eksemplar.update({
            where: { id: item.eksemplarId },
            data: { status: "RUSAK" },
          });

          if (item.status_sistem === "TERSEDIA") {
            await tx.buku.update({
              where: { id: item.eksemplar.bukuId },
              data: { stok_tersedia: { decrement: 1 } },
            });
          }
        }

        // 3. Eksemplar salah rak -> sinkronkan ke rak fisik
        if (
          item.is_terpindai &&
          item.rakId_fisik &&
          item.rakId_sistem &&
          item.rakId_fisik !== item.rakId_sistem
        ) {
          await tx.eksemplar.update({
            where: { id: item.eksemplarId },
            data: { rakId: item.rakId_fisik },
          });
        }
      }
    }
  });

  revalidatePath(`/admin/stock-opname/${data.stockOpnameId}`);
  revalidatePath("/admin/stock-opname");
  revalidatePath("/admin/buku");
  revalidatePath("/admin");

  return {
    ok: true,
    pesan: data.sinkronDatabase
      ? "Sesi Stock Opname berhasil diselesaikan dan Master Database telah direkonsiliasi otomatis."
      : "Sesi Stock Opname berhasil diselesaikan (arsip laporan tersimpan).",
  };
}

/**
 * Batalkan sesi Stock Opname.
 */
export async function batalkanStockOpname(stockOpnameId: string) {
  await requireAdminSession();
  await prisma.stockOpname.update({
    where: { id: stockOpnameId },
    data: { status: "DIBATALKAN", tanggal_selesai: new Date() },
  });

  revalidatePath(`/admin/stock-opname/${stockOpnameId}`);
  revalidatePath("/admin/stock-opname");
  revalidatePath("/admin");

  return { ok: true, pesan: "Sesi Stock Opname telah dibatalkan" };
}

/**
 * Hapus sesi Stock Opname.
 */
export async function deleteStockOpnameSession(stockOpnameId: string) {
  await requireAdminSession();
  await prisma.stockOpname.delete({
    where: { id: stockOpnameId },
  });

  revalidatePath("/admin/stock-opname");
  revalidatePath("/admin");

  return { ok: true, pesan: "Sesi Stock Opname berhasil dihapus" };
}
