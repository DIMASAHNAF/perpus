"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export type UbahPasswordState = {
  ok: boolean;
  message: string;
};

export async function ubahPasswordAdmin(formData: {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<UbahPasswordState> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      ok: false,
      message: "Sesi telah berakhir. Silakan login kembali.",
    };
  }

  const { currentPassword, newPassword, confirmPassword } = formData;

  if (!newPassword || !confirmPassword) {
    return {
      ok: false,
      message: "Kolom password baru dan konfirmasi wajib diisi.",
    };
  }

  if (newPassword.length < 6) {
    return {
      ok: false,
      message: "Password baru minimal 6 karakter.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      ok: false,
      message: "Konfirmasi password baru tidak cocok.",
    };
  }

  // Cari admin berdasarkan session (id atau username/email)
  const username = session.user.email || "";
  const adminId = (session.user as any)?.id;

  let admin = await prisma.admin.findFirst({
    where: {
      OR: [
        ...(adminId ? [{ id: adminId }] : []),
        ...(username ? [{ username }] : []),
      ],
    },
  });

  // Fallback jika tidak ditemukan spesifik, ambil admin yang sesuai username "admin" atau yang pertama
  if (!admin) {
    admin = await prisma.admin.findFirst({
      where: { username: "admin" },
    });
  }
  if (!admin) {
    admin = await prisma.admin.findFirst({
      orderBy: { createdAt: "asc" },
    });
  }

  if (!admin) {
    return {
      ok: false,
      message: "Akun petugas tidak ditemukan di database.",
    };
  }

  // Hash password baru dengan bcrypt
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update password di database
  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      password: hashedNewPassword,
    },
  });

  revalidatePath("/admin");

  return {
    ok: true,
    message: "Password berhasil diperbarui! Silakan gunakan password baru untuk login berikutnya.",
  };
}
