import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Hasil kunjungan lapangan: Rak 1-8 (klasifikasi DDC) + Lemari Referensi 2 terpisah
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

async function main() {
  console.log("🌱 Seeding master rak & klasifikasi...");

  for (const rak of RAK_DATA) {
    await prisma.rak.upsert({
      where: { nomor: rak.nomor },
      update: {
        nama: rak.nama,
        klasifikasi_min: rak.klasifikasi_min,
        klasifikasi_max: rak.klasifikasi_max,
      },
      create: rak,
    });
  }

  console.log(`✅ Berhasil seed ${RAK_DATA.length} rak`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
