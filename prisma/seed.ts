import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Hapus data lama
  await prisma.transaksi.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.buku.deleteMany();

  // Hash password untuk admin
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Buat admin default
  const admin = await prisma.admin.create({
    data: {
      username: "admin",
      password: hashedPassword,
      nama: "Administrator",
    },
  });
  console.log("✅ Admin created:", admin.username);

  // Buat 10 siswa
  const siswaData = [
    { nisn: "1234567891", nama: "Ahmad Fauzi", kelas: "X-1" },
    { nisn: "1234567892", nama: "Siti Nurhaliza", kelas: "X-2" },
    { nisn: "1234567893", nama: "Budi Santoso", kelas: "XI-1" },
    { nisn: "1234567894", nama: "Dewi Lestari", kelas: "XI-2" },
    { nisn: "1234567895", nama: "Rudi Hermawan", kelas: "XII-1" },
    { nisn: "1234567896", nama: "Maya Sari", kelas: "XII-2" },
    { nisn: "1234567897", nama: "Andi Wijaya", kelas: "X-3" },
    { nisn: "1234567898", nama: "Rina Wati", kelas: "XI-3" },
    { nisn: "1234567899", nama: "Agus Salim", kelas: "XII-3" },
    { nisn: "1234567900", nama: "Linda Kurniawan", kelas: "X-4" },
  ];

  for (const data of siswaData) {
    await prisma.siswa.create({ data });
  }
  console.log("✅ 10 siswa created");

  // Buat 15 buku
  const bukuData = [
    {
      judul: "Laskar Pelangi",
      penulis: "Andrea Hirata",
      cover_url: "https://images.tokopedia.net/img/cache/700/product-1/2020/8/26/108761443/108761443_5e5d5c7e-6f5e-4f5f-8f5e-6f5e6f5e6f5e_700_700.jpg",
      stok_total: 3,
      stok_tersedia: 3,
    },
    {
      judul: "Bumi Manusia",
      penulis: "Pramoedya Ananta Toer",
      cover_url: "https://cdn.gramedia.com/uploads/items/9789799731241_Bumi-Manusia.jpg",
      stok_total: 2,
      stok_tersedia: 2,
    },
    {
      judul: "Ayat-Ayat Cinta",
      penulis: "Habiburrahman El Shirazy",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020331935_Ayat-Ayat-Cinta.jpg",
      stok_total: 4,
      stok_tersedia: 4,
    },
    {
      judul: "Negeri 5 Menara",
      penulis: "Ahmad Fuadi",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020822532_Negeri-5-Menara.jpg",
      stok_total: 3,
      stok_tersedia: 3,
    },
    {
      judul: "Sang Pemimpi",
      penulis: "Andrea Hirata",
      cover_url: "https://cdn.gramedia.com/uploads/items/9789793062792_Sang-Pemimpi.jpg",
      stok_total: 2,
      stok_tersedia: 2,
    },
    {
      judul: "Perahu Kertas",
      penulis: "Dee Lestari",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020822532_Perahu-Kertas.jpg",
      stok_total: 3,
      stok_tersedia: 3,
    },
    {
      judul: "Hujan",
      penulis: "Tere Liye",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020822532_Hujan.jpg",
      stok_total: 5,
      stok_tersedia: 5,
    },
    {
      judul: "Pulang",
      penulis: "Tere Liye",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020822532_Pulang.jpg",
      stok_total: 4,
      stok_tersedia: 4,
    },
    {
      judul: "Filosofi Kopi",
      penulis: "Dewi Lestari",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020822532_Filosofi-Kopi.jpg",
      stok_total: 3,
      stok_tersedia: 3,
    },
    {
      judul: "Dilan 1990",
      penulis: "Pidi Baiq",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020822532_Dilan-1990.jpg",
      stok_total: 6,
      stok_tersedia: 6,
    },
    {
      judul: "Rindu",
      penulis: "Tere Liye",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020822532_Rindu.jpg",
      stok_total: 4,
      stok_tersedia: 4,
    },
    {
      judul: "Sebuah Seni untuk Bersikap Bodo Amat",
      penulis: "Mark Manson",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786024526986.jpg",
      stok_total: 5,
      stok_tersedia: 5,
    },
    {
      judul: "Atomic Habits",
      penulis: "James Clear",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020633930.jpg",
      stok_total: 7,
      stok_tersedia: 7,
    },
    {
      judul: "Berani Tidak Disukai",
      penulis: "Ichiro Kishimi",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786024553043.jpg",
      stok_total: 4,
      stok_tersedia: 4,
    },
    {
      judul: "Man's Search for Meaning",
      penulis: "Viktor E. Frankl",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786024815325.jpg",
      stok_total: 3,
      stok_tersedia: 3,
    },
  ];

  for (const data of bukuData) {
    await prisma.buku.create({ data });
  }
  console.log("✅ 15 buku created");

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
