"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSiswa(formData: FormData) {
  const nisn = formData.get("nisn") as string;
  const nama = formData.get("nama") as string;
  const kelas = formData.get("kelas") as string;

  await prisma.siswa.create({
    data: { nisn, nama, kelas },
  });

  revalidatePath("/admin/siswa");
  redirect("/admin/siswa");
}

export async function updateSiswa(id: string, formData: FormData) {
  const nisn = formData.get("nisn") as string;
  const nama = formData.get("nama") as string;
  const kelas = formData.get("kelas") as string;

  await prisma.siswa.update({
    where: { id },
    data: { nisn, nama, kelas },
  });

  revalidatePath("/admin/siswa");
  redirect("/admin/siswa");
}

export async function deleteSiswa(id: string) {
  await prisma.siswa.delete({ where: { id } });
  revalidatePath("/admin/siswa");
}
