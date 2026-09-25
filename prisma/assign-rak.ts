import { PrismaClient } from "@prisma/client";
import fs from "fs";

/**
 * Assign rakId ke eksemplar existing dari klasifikasi DDC buku.
 * Lokasi_rak lama sudah didrop, pakai klasifikasi buku (yang baru ditambah).
 */
const prisma = new PrismaClient();

const RAK_DATA = [
  { nomor: 1, nama: "Rak 1", klasifikasi_min: 0, klasifikasi_max: 99 },
  { nomor: 2, nama: "Rak 2", klasifikasi_min: 100, klasifikasi_max: 199 },
  { nomor: 3, nama: "Rak 3", klasifikasi_min: 200, klasifikasi_max: 299 },
  { nomor: 4, nama: "Rak 4", klasifikasi_min: 300, klasifikasi_max: 399 },
  { nomor: 5, nama: "Rak 5", klasifikasi_min: 400, klasifikasi_max: 499 },
  { nomor: 6, nama: "Rak 6", klasifikasi_min: 500, klasifikasi_max: 599 },
  { nomor: 7, nama: "Rak 7", klasifikasi_min: 600, klasifikasi_max: 699 },
  { nomor: 8, nama: "Rak 8", klasifikasi_min: 700, klasifikasi_max: 799 },
  { nomor: 9, nama: "Lemari Referensi 2", klasifikasi_min: 800, klasifikasi_max: 999 },
];

function parseKlasifikasi(k?: string | null): number | null {
  if (!k) return null;
  const n = parseInt(k.trim().split(".")[0], 10);
  return Number.isNaN(n) ? null : n;
}

async function main() {
  console.log("🌱 Seeding 9 rak...");
  for (const rak of RAK_DATA) {
    await prisma.rak.upsert({
      where: { nomor: rak.nomor },
      update: { nama: rak.nama, klasifikasi_min: rak.klasifikasi_min, klasifikasi_max: rak.klasifikasi_max },
      create: rak,
    });
  }
  console.log("   ✅ 9 rak terdaftar");

  console.log("\n🔗 Assign rakId ke eksemplar existing...");
  const eks = await prisma.eksemplar.findMany({
    where: { rakId: null },
    include: { buku: { select: { klasifikasi: true } } },
  });

  let updated = 0;
  for (const e of eks) {
    const num = parseKlasifikasi(e.buku.klasifikasi);
    if (num === null) continue;
    const rak = RAK_DATA.find((r) => num >= r.klasifikasi_min && num <= r.klasifikasi_max);
    if (!rak) continue;

    const dbRak = await prisma.rak.findUnique({ where: { nomor: rak.nomor } });
    if (!dbRak) continue;

    await prisma.eksemplar.update({ where: { id: e.id }, data: { rakId: dbRak.id } });
    updated++;
  }
  console.log(`   ✅ ${updated} eksemplar dapat rakId`);

  // Backup lama hanya untuk referensi; tidak dipakai lagi karena lokasi_rak berisi teks bebas
  if (fs.existsSync("prisma/backup-lokasi-rak.json")) {
    console.log("   ℹ️  Backup lama tetap di prisma/backup-lokasi-rak.json (teks bebas, tidak terpetakan)");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
