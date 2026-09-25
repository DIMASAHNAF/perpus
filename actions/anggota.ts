"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateNoAnggota } from "@/lib/generators";

/**
 * CRUD Anggota (SISWA / GURU / STAF). no_anggota auto-generate sequential.
 * createdAt dipakai sebagai "tanggal menjadi anggota" — realtime tampil di UI.
 */

export async function createAnggota(formData: FormData) {
  const nama = (formData.get("nama") as string)?.trim();
  const jenis = (formData.get("jenis") as string) || "SISWA";
  const nisn = (formData.get("nisn") as string)?.trim() || null;
  const telepon = (formData.get("telepon") as string)?.trim() || null;
  const alamat = (formData.get("alamat") as string)?.trim() || null;
  const kelasId = (formData.get("kelasId") as string) || null;

  if (!nama) throw new Error("Nama wajib diisi");

  // SISWA wajib NISN & unik
  if (jenis === "SISWA") {
    if (!nisn) throw new Error("NISN wajib untuk anggota siswa");
    const dup = await prisma.anggota.findFirst({ where: { nisn } });
    if (dup) throw new Error(`NISN ${nisn} sudah terdaftar sebagai ${dup.nama}`);
  }

  const no_anggota = await generateNoAnggota();

  await prisma.anggota.create({
    data: {
      no_anggota,
      nama,
      jenis: jenis as any,
      nisn: jenis === "SISWA" ? nisn : null,
      kelasId: jenis === "SISWA" ? kelasId : null,
      telepon: jenis !== "SISWA" ? telepon : null,
      alamat: jenis !== "SISWA" ? alamat : null,
      status_aktif: true,
    },
  });

  revalidatePath("/admin/anggota");
  redirect("/admin/anggota");
}

export async function updateAnggota(id: string, formData: FormData) {
  const nama = (formData.get("nama") as string)?.trim();
  const jenis = (formData.get("jenis") as string) || "SISWA";
  const nisn = (formData.get("nisn") as string)?.trim() || null;
  const telepon = (formData.get("telepon") as string)?.trim() || null;
  const alamat = (formData.get("alamat") as string)?.trim() || null;
  const kelasId = (formData.get("kelasId") as string) || null;
  const status_aktif = formData.get("status_aktif") === "on";

  if (!nama) throw new Error("Nama wajib diisi");

  const existing = await prisma.anggota.findUnique({ where: { id } });
  if (!existing) throw new Error("Anggota tidak ditemukan");

  if (jenis === "SISWA" && nisn) {
    const dup = await prisma.anggota.findFirst({
      where: { nisn, NOT: { id } },
    });
    if (dup) throw new Error(`NISN ${nisn} dipakai oleh ${dup.nama}`);
  }

  await prisma.anggota.update({
    where: { id },
    data: {
      nama,
      jenis: jenis as any,
      nisn: jenis === "SISWA" ? nisn : null,
      kelasId: jenis === "SISWA" ? kelasId : null,
      telepon: jenis !== "SISWA" ? telepon : null,
      alamat: jenis !== "SISWA" ? alamat : null,
      status_aktif,
    },
  });

  revalidatePath("/admin/anggota");
  redirect("/admin/anggota");
}

export async function deleteAnggota(id: string) {
  const aktif = await prisma.transaksi.findFirst({
    where: { anggotaId: id, status: "DIPINJAM" },
  });
  if (aktif) {
    throw new Error("Tidak bisa hapus: masih ada buku dipinjam");
  }

  await prisma.anggota.delete({ where: { id } });
  revalidatePath("/admin/anggota");
}

export async function toggleStatusAnggota(id: string, aktif: boolean) {
  await prisma.anggota.update({
    where: { id },
    data: { status_aktif: aktif },
  });
  revalidatePath("/admin/anggota");
}
