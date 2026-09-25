import { prisma } from "./prisma";

/**
 * Generate kode eksemplar 8-digit sequential
 * Format: 00000001, 00000002, dst
 */
export async function generateKodeEksemplar(): Promise<string> {
  const lastEksemplar = await prisma.eksemplar.findFirst({
    orderBy: { kode: "desc" },
    select: { kode: true },
  });

  if (!lastEksemplar) {
    return "00000001";
  }

  const lastNumber = parseInt(lastEksemplar.kode, 10);
  const nextNumber = lastNumber + 1;
  return nextNumber.toString().padStart(8, "0");
}

/**
 * Generate nomor anggota sequential
 * Format: A0001, A0002, dst
 */
export async function generateNoAnggota(): Promise<string> {
  const lastAnggota = await prisma.anggota.findFirst({
    orderBy: { no_anggota: "desc" },
    select: { no_anggota: true },
  });

  if (!lastAnggota) {
    return "A0001";
  }

  const lastNumber = parseInt(lastAnggota.no_anggota.slice(1), 10);
  const nextNumber = lastNumber + 1;
  return `A${nextNumber.toString().padStart(4, "0")}`;
}
