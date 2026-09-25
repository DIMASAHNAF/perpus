"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBuku(formData: FormData) {
  const tipe_buku = formData.get("tipe_buku") as string;
  const kode_buku = formData.get("kode_buku") as string;
  const judul = formData.get("judul") as string;
  const penulis = formData.get("penulis") as string;
  const kategori = formData.get("kategori") as string;
  const tahun_ajaran = formData.get("tahun_ajaran") as string;
  const cover_url = formData.get("cover_url") as string;
  const stok_total = parseInt(formData.get("stok_total") as string);
  const klasifikasiRaw = (formData.get("klasifikasi") as string)?.trim() || "";

  // Awalan R = Koleksi Referensi (hanya baca di tempat)
  const is_referensi = /^R\s/i.test(klasifikasiRaw);
  // Simpan klasifikasi tanpa awalan R, mis. "R 370.1" -> "370.1"
  const klasifikasi = klasifikasiRaw.replace(/^R\s+/i, "");

  await prisma.buku.create({
    data: {
      tipe_buku: (tipe_buku as any) || "BIASA",
      kode_buku: kode_buku || null,
      judul,
      penulis,
      kategori: kategori || null,
      tahun_ajaran: tahun_ajaran || null,
      cover_url: cover_url || null,
      stok_total,
      stok_tersedia: stok_total,
      klasifikasi: klasifikasi || null,
      is_referensi,
    },
  });

  revalidatePath("/admin/buku");
  revalidatePath("/");
  redirect("/admin/buku");
}

export async function updateBuku(id: string, formData: FormData) {
  const tipe_buku = formData.get("tipe_buku") as string;
  const kode_buku = formData.get("kode_buku") as string;
  const judul = formData.get("judul") as string;
  const penulis = formData.get("penulis") as string;
  const kategori = formData.get("kategori") as string;
  const tahun_ajaran = formData.get("tahun_ajaran") as string;
  const cover_url = formData.get("cover_url") as string;
  const stok_total = parseInt(formData.get("stok_total") as string);
  const klasifikasiRaw = (formData.get("klasifikasi") as string)?.trim() || "";

  const is_referensi = /^R\s/i.test(klasifikasiRaw);
  const klasifikasi = klasifikasiRaw.replace(/^R\s+/i, "");

  const buku = await prisma.buku.findUnique({ where: { id } });
  if (!buku) throw new Error("Buku tidak ditemukan");

  const selisih = stok_total - buku.stok_total;

  await prisma.buku.update({
    where: { id },
    data: {
      tipe_buku: (tipe_buku as any) || "BIASA",
      kode_buku: kode_buku || null,
      judul,
      penulis,
      kategori: kategori || null,
      tahun_ajaran: tahun_ajaran || null,
      cover_url: cover_url || null,
      stok_total,
      stok_tersedia: buku.stok_tersedia + selisih,
      klasifikasi: klasifikasi || null,
      is_referensi,
    },
  });

  revalidatePath("/admin/buku");
  revalidatePath("/");
  redirect("/admin/buku");
}

export async function deleteBuku(id: string) {
  await prisma.buku.delete({ where: { id } });
  revalidatePath("/admin/buku");
  revalidatePath("/");
}


