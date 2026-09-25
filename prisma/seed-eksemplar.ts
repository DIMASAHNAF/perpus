import { PrismaClient } from "@prisma/client";
import { generateKodeEksemplar } from "../lib/generators";
import { findRakIdForKlasifikasi } from "../lib/rak";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding eksemplar dari buku existing...");

  const buku = await prisma.buku.findMany();

  if (buku.length === 0) {
    console.log("⚠️  Tidak ada buku. Jalankan seed buku dulu.");
    return;
  }

  // Ambil counter sekali, hemat query (generateKodeEksemplar baca last row tiap loop)
  let kodeNum = 0;
  const last = await prisma.eksemplar.findFirst({
    orderBy: { kode: "desc" },
    select: { kode: true },
  });
  if (last) kodeNum = parseInt(last.kode, 10);

  let totalEksemplar = 0;

  for (const b of buku) {
    const rakId = await findRakIdForKlasifikasi(b.klasifikasi);

    const data = [];
    for (let i = 0; i < b.stok_total; i++) {
      kodeNum += 1;
      data.push({
        kode: kodeNum.toString().padStart(8, "0"),
        bukuId: b.id,
        rakId,
        tipe_koleksi: b.tipe_buku === "MAPEL" ? "Textbook" : "Reference",
        status: "TERSEDIA" as const,
      });
    }

    if (data.length) {
      await prisma.eksemplar.createMany({ data });
      totalEksemplar += data.length;
    }
  }

  console.log(`✅ ${totalEksemplar} eksemplar dibuat dari ${buku.length} buku`);
  console.log("✅ Seeding eksemplar selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
