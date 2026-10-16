import { PrismaClient } from "@prisma/client";

/**
 * Isi klasifikasi DDC untuk 15 buku existing, lalu assign rakId ke eksemplar.
 * DDC ranges: 000-099 Rak1, 100-199 Rak2, 200-299 Rak3, 300-399 Rak4,
 *             400-499 Rak5, 500-599 Rak6, 600-699 Rak7, 700-799 Rak8, 800-999 Lemari Referensi 2
 */
const prisma = new PrismaClient();

// DDC nomor untuk judul existing. Indonesia novel/fiksi -> 899.221 (sastra Indonesia)
const KLASIFIKASI: { judul: string; klasifikasi: string }[] = [
  { judul: "Laskar Pelangi", klasifikasi: "899.221" },
  { judul: "Bumi Manusia", klasifikasi: "899.221" },
  { judul: "Ayat-Ayat Cinta", klasifikasi: "899.221" },
  { judul: "Negeri 5 Menara", klasifikasi: "899.221" },
  { judul: "Sang Pemimpi", klasifikasi: "899.221" },
  { judul: "Perahu Kertas", klasifikasi: "899.221" },
  { judul: "Hujan", klasifikasi: "899.221" },
  { judul: "Pulang", klasifikasi: "899.221" },
  { judul: "Filosofi Kopi", klasifikasi: "899.221" },
  { judul: "Dilan 1990", klasifikasi: "899.221" },
  { judul: "Rindu", klasifikasi: "899.221" },
  { judul: "Sebuah Seni untuk Bersikap apatis", klasifikasi: "158" },   // self-help
  { judul: "Atomic Habits", klasifikasi: "158" },
  { judul: "Berani Tidak Disukai", klasifikasi: "158.1" },
  { judul: "Man's Search for Meaning", klasifikasi: "150.1" },            // psikologi eksistensial
];

function parseKlasifikasi(k?: string | null): number | null {
  if (!k) return null;
  const n = parseInt(k.trim().split(".")[0], 10);
  return Number.isNaN(n) ? null : n;
}

async function main() {
  console.log("📚 Update klasifikasi DDC...\n");

  for (const item of KLASIFIKASI) {
    const buku = await prisma.buku.findFirst({ where: { judul: item.judul } });
    if (!buku) {
      console.log(`   ⚠️  tidak ketemu: ${item.judul}`);
      continue;
    }
    await prisma.buku.update({ where: { id: buku.id }, data: { klasifikasi: item.klasifikasi } });
    console.log(`   ✅ ${item.judul} -> ${item.klasifikasi}`);
  }

  console.log("\n🔗 Assign rakId ke eksemplar existing...\n");

  const rakList = await prisma.rak.findMany();
  const eks = await prisma.eksemplar.findMany({
    where: { rakId: null },
    include: { buku: { select: { klasifikasi: true, judul: true } } },
  });

  let updated = 0;
  for (const e of eks) {
    const num = parseKlasifikasi(e.buku.klasifikasi);
    if (num === null) continue;
    const rak = rakList.find( (r) => num >= r.klasifikasi_min && num <= r.klasifikasi_max);
    if (!rak) continue;

    
    await prisma.eksemplar.update({ where: { id: e.id }, data: { rakId: rak.id } });
    updated++;
    console.log(`   ${e.kode} -> ${rak.nama} (${e.buku.klasifikasi})`);
  }

  console.log(`\n✅ ${updated} eksemplar dapat rakId`);

  const stats = {
    bukuDenganKlas: await prisma.buku.count({ where: { NOT: { klasifikasi: null } } }),
    bukuTotal: await prisma.buku.count(),
    eksDenganRak: await prisma.eksemplar.count({ where: { NOT: { rakId: null } } }),
    eksTotal: await prisma.eksemplar.count(),
    rakTotal: await prisma.rak.count(),
  };
  console.log("\n📊 Final state:", JSON.stringify(stats, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
