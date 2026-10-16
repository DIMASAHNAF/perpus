"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findRakIdForKlasifikasi } from "@/lib/rak";
import { requireAdminSession } from "@/lib/security";

export async function createBuku(formData: FormData) {
  await requireAdminSession();
  const tipe_buku = formData.get("tipe_buku") as string;
  let kode_buku = (formData.get("kode_buku") as string)?.trim() || null;
  const isbn = (formData.get("isbn") as string)?.trim() || null;

  // Jika kode_buku kosong tapi isbn diisi, otomatis jadikan isbn sebagai kode_buku
  if (!kode_buku && isbn) {
    kode_buku = isbn;
  }

  const judul = (formData.get("judul") as string)?.trim();
  if (!judul) {
    throw new Error("Judul buku wajib diisi");
  }

  const penulis = (formData.get("penulis") as string)?.trim() || "Penulis Tidak Diketahui";
  const kategori = (formData.get("kategori") as string)?.trim() || null;
  const tahun_ajaran = (formData.get("tahun_ajaran") as string)?.trim() || null;
  const cover_url = (formData.get("cover_url") as string)?.trim() || null;
  const stok_total = Math.max(1, parseInt(formData.get("stok_total") as string) || 1);
  const klasifikasiRaw = (formData.get("klasifikasi") as string)?.trim() || "";

  // Awalan R = Koleksi Referensi (hanya baca di tempat)
  const is_referensi = /^R\s/i.test(klasifikasiRaw);
  // Simpan klasifikasi tanpa awalan R, mis. "R 370.1" -> "370.1"
  const klasifikasi = klasifikasiRaw.replace(/^R\s+/i, "") || null;

  const file_url = (formData.get("file_url") as string)?.trim() || null;
  const is_ebook_form = formData.get("is_ebook") === "on" || formData.get("is_ebook") === "true";
  const is_ebook = is_ebook_form || Boolean(file_url);

  // Jika kode_buku ada, cek apakah sudah digunakan oleh buku lain (toleran strip / spasi)
  if (kode_buku) {
    const cleanKode = kode_buku.replace(/[-\s]/g, "");
    const existing = await prisma.$queryRaw<Array<{ id: string; judul: string }>>`
      SELECT id, judul FROM "Buku"
      WHERE REPLACE(REPLACE(COALESCE(kode_buku, ''), '-', ''), ' ', '') = ${cleanKode}
         OR kode_buku = ${kode_buku}
      LIMIT 1
    `;
    if (existing && existing.length > 0) {
      throw new Error(
        `Kode Buku / ISBN "${kode_buku}" sudah terdaftar pada buku "${existing[0].judul}". Silakan gunakan kode lain atau perbarui stok buku yang sudah ada.`
      );
    }
  }

  const rakId = await findRakIdForKlasifikasi(klasifikasi);

  await prisma.$transaction(async (tx) => {
    const newBuku = await tx.buku.create({
      data: {
        tipe_buku: (tipe_buku as any) || "BIASA",
        kode_buku: kode_buku || null,
        judul,
        penulis,
        kategori,
        tahun_ajaran,
        cover_url,
        file_url,
        is_ebook,
        stok_total,
        stok_tersedia: stok_total,
        klasifikasi,
        is_referensi,
      },
    });

    // Otomatis generate eksemplar awal sebanyak stok_total
    const last = await tx.eksemplar.findFirst({
      orderBy: { kode: "desc" },
      select: { kode: true },
    });
    let kodeNum = last ? parseInt(last.kode, 10) : 0;

    const rows = [];
    for (let i = 0; i < stok_total; i++) {
      kodeNum += 1;
      rows.push({
        kode: kodeNum.toString().padStart(8, "0"),
        bukuId: newBuku.id,
        rakId,
        tipe_koleksi: newBuku.tipe_buku === "MAPEL" ? "Textbook" : "Reference",
        status: "TERSEDIA" as const,
      });
    }

    if (rows.length > 0) {
      await tx.eksemplar.createMany({ data: rows });
    }
  });

  revalidatePath("/admin/buku");
  revalidatePath("/");
  redirect("/admin/buku");
}

export async function updateBuku(id: string, formData: FormData) {
  await requireAdminSession();
  const tipe_buku = formData.get("tipe_buku") as string;
  let kode_buku = (formData.get("kode_buku") as string)?.trim() || null;
  const isbn = (formData.get("isbn") as string)?.trim() || null;

  if (!kode_buku && isbn) {
    kode_buku = isbn;
  }

  const judul = (formData.get("judul") as string)?.trim();
  if (!judul) {
    throw new Error("Judul buku wajib diisi");
  }

  const penulis = (formData.get("penulis") as string)?.trim() || "Penulis Tidak Diketahui";
  const kategori = (formData.get("kategori") as string)?.trim() || null;
  const tahun_ajaran = (formData.get("tahun_ajaran") as string)?.trim() || null;
  const cover_url = (formData.get("cover_url") as string)?.trim() || null;
  const stok_total = Math.max(1, parseInt(formData.get("stok_total") as string) || 1);
  const klasifikasiRaw = (formData.get("klasifikasi") as string)?.trim() || "";

  const is_referensi = /^R\s/i.test(klasifikasiRaw);
  const klasifikasi = klasifikasiRaw.replace(/^R\s+/i, "") || null;

  const file_url = (formData.get("file_url") as string)?.trim() || null;
  const is_ebook_form = formData.get("is_ebook") === "on" || formData.get("is_ebook") === "true";
  const is_ebook = is_ebook_form || Boolean(file_url);

  const buku = await prisma.buku.findUnique({ where: { id } });
  if (!buku) throw new Error("Buku tidak ditemukan");

  // Jika kode_buku diubah, cek apakah sudah digunakan oleh buku LAIN
  if (kode_buku) {
    const cleanKode = kode_buku.replace(/[-\s]/g, "");
    const existing = await prisma.$queryRaw<Array<{ id: string; judul: string }>>`
      SELECT id, judul FROM "Buku"
      WHERE (REPLACE(REPLACE(COALESCE(kode_buku, ''), '-', ''), ' ', '') = ${cleanKode}
         OR kode_buku = ${kode_buku})
        AND id != ${id}
      LIMIT 1
    `;
    if (existing && existing.length > 0) {
      throw new Error(
        `Kode Buku / ISBN "${kode_buku}" sudah digunakan oleh buku "${existing[0].judul}".`
      );
    }
  }

  const selisih = stok_total - buku.stok_total;

  await prisma.buku.update({
    where: { id },
    data: {
      tipe_buku: (tipe_buku as any) || "BIASA",
      kode_buku: kode_buku || null,
      judul,
      penulis,
      kategori,
      tahun_ajaran,
      cover_url,
      file_url,
      is_ebook,
      stok_total,
      stok_tersedia: Math.max(0, buku.stok_tersedia + selisih),
      klasifikasi,
      is_referensi,
    },
  });

  revalidatePath("/admin/buku");
  revalidatePath("/");
  redirect("/admin/buku");
}

export async function deleteBuku(id: string) {
  await requireAdminSession();
  const activeTx = await prisma.transaksi.findFirst({
    where: {
      status: "DIPINJAM",
      OR: [
        { bukuId: id },
        { eksemplar: { bukuId: id } },
      ],
    },
  });

  if (activeTx) {
    throw new Error("Buku tidak dapat dihapus karena masih ada eksemplar yang sedang dipinjam aktif.");
  }

  await prisma.$transaction(async (tx) => {
    const eksemplars = await tx.eksemplar.findMany({
      where: { bukuId: id },
      select: { id: true },
    });
    const eksIds = eksemplars.map((e) => e.id);

    if (eksIds.length > 0) {
      await tx.stockOpnameItem.deleteMany({
        where: { eksemplarId: { in: eksIds } },
      });
      await tx.transaksi.deleteMany({
        where: { eksemplarId: { in: eksIds } },
      });
    }
    await tx.transaksi.deleteMany({
      where: { bukuId: id },
    });

    await tx.buku.delete({ where: { id } });
  });

  revalidatePath("/admin/buku");
  revalidatePath("/admin/buku/cetak-label");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteMultipleBuku(ids: string[], force: boolean = false) {
  await requireAdminSession();
  if (!ids || ids.length === 0) return { count: 0 };

  if (!force) {
    const activeTx = await prisma.transaksi.findFirst({
      where: {
        status: "DIPINJAM",
        OR: [
          { bukuId: { in: ids } },
          { eksemplar: { bukuId: { in: ids } } },
        ],
      },
      include: {
        buku: { select: { judul: true } },
      },
    });

    if (activeTx) {
      throw new Error(
        `Buku "${activeTx.buku?.judul || "terkait"}" sedang dipinjam aktif. Selesaikan peminjaman terlebih dahulu atau aktifkan opsi 'Paksa Hapus'.`
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    const eksemplars = await tx.eksemplar.findMany({
      where: { bukuId: { in: ids } },
      select: { id: true },
    });
    const eksIds = eksemplars.map((e) => e.id);

    if (eksIds.length > 0) {
      await tx.stockOpnameItem.deleteMany({
        where: { eksemplarId: { in: eksIds } },
      });
      await tx.transaksi.deleteMany({
        where: { eksemplarId: { in: eksIds } },
      });
    }
    await tx.transaksi.deleteMany({
      where: { bukuId: { in: ids } },
    });

    await tx.buku.deleteMany({
      where: { id: { in: ids } },
    });
  });

  revalidatePath("/admin/buku");
  revalidatePath("/admin/buku/cetak-label");
  revalidatePath("/admin");
  revalidatePath("/");

  return { count: ids.length };
}

export async function deleteAllBuku(force: boolean = false) {
  await requireAdminSession();
  if (!force) {
    const activeTx = await prisma.transaksi.findFirst({
      where: { status: "DIPINJAM" },
      include: {
        buku: { select: { judul: true } },
      },
    });

    if (activeTx) {
      throw new Error(
        `Masih ada buku "${activeTx.buku?.judul || "terkait"}" yang sedang dipinjam aktif. Selesaikan peminjaman terlebih dahulu atau aktifkan opsi 'Paksa Hapus'.`
      );
    }
  }

  const count = await prisma.buku.count();

  await prisma.$transaction(async (tx) => {
    await tx.stockOpnameItem.deleteMany({});
    await tx.transaksi.deleteMany({});
    await tx.buku.deleteMany({});
  });

  revalidatePath("/admin/buku");
  revalidatePath("/admin/buku/cetak-label");
  revalidatePath("/admin");
  revalidatePath("/");

  return { count };
}
