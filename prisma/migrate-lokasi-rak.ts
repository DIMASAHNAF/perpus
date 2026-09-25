import { PrismaClient } from "@prisma/client";
import fs from "fs";

/**
 * Backup Eksemplar.lokasi_rak sebelum prisma db push mendrop kolomnya.
 * Run BEFORE: npx prisma db push --accept-data-loss
 */
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Backup lokasi_rak...");

  const rows = await prisma.$queryRaw<
    { id: string; kode: string; bukuId: string; lokasi_rak: string | null }[]
  >`SELECT id, kode, "bukuId", "lokasi_rak" FROM "Eksemplar" WHERE "lokasi_rak" IS NOT NULL`;

  fs.writeFileSync("prisma/backup-lokasi-rak.json", JSON.stringify(rows, null, 2));
  console.log(`   ✅ ${rows.length} rows -> prisma/backup-lokasi-rak.json`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
