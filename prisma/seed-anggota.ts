import { PrismaClient } from "@prisma/client";
import { generateNoAnggota } from "../lib/generators";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding anggota dari siswa existing...");

  const siswa = await prisma.siswa.findMany({
    include: { kelasRef: true },
  });

  if (siswa.length === 0) {
    console.log("⚠️  Tidak ada siswa untuk dimigrate. Buat sample anggota...");
    
    // Buat sample anggota kalau ga ada siswa
    const sampleAnggota = [
      { nama: "Ahmad Fauzi", jenis: "SISWA" as const, nisn: "1234567891" },
      { nama: "Siti Nurhaliza", jenis: "SISWA" as const, nisn: "1234567892" },
      { nama: "Pak Budi Santoso", jenis: "GURU" as const, telepon: "08123456789" },
      { nama: "Ibu Dewi Lestari", jenis: "GURU" as const, telepon: "08234567890" },
      { nama: "Pak Agus (Pustakawan)", jenis: "STAF" as const, telepon: "08345678901" },
    ];

    for (const data of sampleAnggota) {
      const no_anggota = await generateNoAnggota();
      await prisma.anggota.create({
        data: {
          no_anggota,
          nama: data.nama,
          jenis: data.jenis,
          nisn: data.nisn,
          telepon: data.telepon,
          status_aktif: true,
        },
      });
    }

    console.log(`✅ ${sampleAnggota.length} sample anggota created`);
    return;
  }

  // Migrate siswa ke anggota
  for (const s of siswa) {
    const no_anggota = await generateNoAnggota();
    
    await prisma.anggota.create({
      data: {
        no_anggota,
        nama: s.nama,
        jenis: "SISWA",
        nisn: s.nisn,
        kelasId: s.kelasId,
        status_aktif: true,
      },
    });
  }

  console.log(`✅ ${siswa.length} siswa dimigrate ke anggota`);
  
  // Tambah guru & staf sample
  const staffAnggota = [
    { nama: "Pak Budi Santoso", jenis: "GURU" as const, telepon: "08123456789" },
    { nama: "Ibu Dewi Lestari", jenis: "GURU" as const, telepon: "08234567890" },
    { nama: "Pak Agus (Pustakawan)", jenis: "STAF" as const, telepon: "08345678901" },
  ];

  for (const data of staffAnggota) {
    const no_anggota = await generateNoAnggota();
    await prisma.anggota.create({
      data: {
        no_anggota,
        nama: data.nama,
        jenis: data.jenis,
        telepon: data.telepon,
        status_aktif: true,
      },
    });
  }

  console.log(`✅ ${staffAnggota.length} guru/staf ditambahkan`);
  console.log("✅ Seeding anggota selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
