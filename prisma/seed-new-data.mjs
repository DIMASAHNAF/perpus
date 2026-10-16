import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KELAS_DATA = [
  // Tingkat X
  { tingkat: "X", jurusan: "BUSANA", nomor: 1, nama_kelas: "X BUSANA 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "BUSANA", nomor: 2, nama_kelas: "X BUSANA 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "KECANTIKAN", nomor: 1, nama_kelas: "X KECANTIKAN", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "KULINER", nomor: 1, nama_kelas: "X KULINER 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "KULINER", nomor: 2, nama_kelas: "X KULINER 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "PERHOTELAN", nomor: 1, nama_kelas: "X PERHOTELAN 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "PERHOTELAN", nomor: 2, nama_kelas: "X PERHOTELAN 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "PPLG", nomor: 1, nama_kelas: "X PPLG 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "PPLG", nomor: 2, nama_kelas: "X PPLG 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "PPLG", nomor: 3, nama_kelas: "X PPLG 3", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "TJKT", nomor: 1, nama_kelas: "X TJKT 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "TJKT", nomor: 2, nama_kelas: "X TJKT 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "TJKT", nomor: 3, nama_kelas: "X TJKT 3", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "X", jurusan: "ULW", nomor: 1, nama_kelas: "X ULW", wali_kelas: "Asron Batubara, S.Pd., M.Si" },

  // Tingkat XI
  { tingkat: "XI", jurusan: "BUSANA", nomor: 1, nama_kelas: "XI BUSANA 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "BUSANA", nomor: 2, nama_kelas: "XI BUSANA 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "KECANTIKAN", nomor: 1, nama_kelas: "XI KECANTIKAN", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "KULINER", nomor: 1, nama_kelas: "XI KULINER 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "KULINER", nomor: 2, nama_kelas: "XI KULINER 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "PERHOTELAN", nomor: 1, nama_kelas: "XI PERHOTELAN 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "PERHOTELAN", nomor: 2, nama_kelas: "XI PERHOTELAN 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "PPLG", nomor: 1, nama_kelas: "XI PPLG 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "PPLG", nomor: 2, nama_kelas: "XI PPLG 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "PPLG", nomor: 3, nama_kelas: "XI PPLG 3", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "TJKT", nomor: 1, nama_kelas: "XI TJKT 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "TJKT", nomor: 2, nama_kelas: "XI TJKT 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "TJKT", nomor: 3, nama_kelas: "XI TJKT 3", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "ULW", nomor: 1, nama_kelas: "XI ULW", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XI", jurusan: "ULP", nomor: 1, nama_kelas: "XI ULP", wali_kelas: "Asron Batubara, S.Pd., M.Si" },

  // Tingkat XII
  { tingkat: "XII", jurusan: "BUSANA", nomor: 1, nama_kelas: "XII BUSANA 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "BUSANA", nomor: 2, nama_kelas: "XII BUSANA 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "KECANTIKAN", nomor: 1, nama_kelas: "XII KECANTIKAN", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "KULINER", nomor: 1, nama_kelas: "XII KULINER 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "KULINER", nomor: 2, nama_kelas: "XII KULINER 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "PERHOTELAN", nomor: 1, nama_kelas: "XII PERHOTELAN 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "PERHOTELAN", nomor: 2, nama_kelas: "XII PERHOTELAN 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "PPLG", nomor: 1, nama_kelas: "XII PPLG 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "PPLG", nomor: 2, nama_kelas: "XII PPLG 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "PPLG", nomor: 3, nama_kelas: "XII PPLG 3", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "TJKT", nomor: 1, nama_kelas: "XII TJKT 1", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "TJKT", nomor: 2, nama_kelas: "XII TJKT 2", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "TJKT", nomor: 3, nama_kelas: "XII TJKT 3", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
  { tingkat: "XII", jurusan: "ULP", nomor: 1, nama_kelas: "XII ULP", wali_kelas: "Asron Batubara, S.Pd., M.Si" },
];

function parseKlasifikasi(klasifikasi) {
  if (!klasifikasi) return null;
  const cleaned = klasifikasi.trim().split(".")[0];
  const num = parseInt(cleaned, 10);
  return Number.isNaN(num) ? null : num;
}

async function findRakIdForKlasifikasi(klasifikasi, rakList) {
  const num = parseKlasifikasi(klasifikasi);
  if (num === null) return null;
  const found = rakList.find((r) => num >= r.klasifikasi_min && num <= r.klasifikasi_max);
  return found?.id ?? null;
}

async function main() {
  console.log("🚀 Memulai penambahan 5 data baru Anggota dan 5 data baru Buku...");

  // 1. Pastikan data Kelas tersedia
  const kelasCount = await prisma.kelas.count();
  if (kelasCount === 0) {
    console.log("🌱 Menyiapkan data kelas...");
    for (const k of KELAS_DATA) {
      await prisma.kelas.upsert({
        where: { nama_kelas: k.nama_kelas },
        update: {},
        create: k,
      });
    }
    console.log("✅ Data kelas siap.");
  }

  const kelasMap = {};
  const allClasses = await prisma.kelas.findMany();
  for (const c of allClasses) {
    kelasMap[c.nama_kelas] = c.id;
  }

  const rakList = await prisma.rak.findMany({ orderBy: { nomor: "asc" } });

  // 2. Buat 5 Data Anggota Baru
  console.log("\n👤 Membuat 5 data baru Anggota...");

  const dataAnggotaInput = [
    {
      nama: "Muhammad Rizky Pratama",
      jenis: "SISWA",
      nisn: "0071234501",
      namaKelas: "X PPLG 1",
      telepon: null,
      alamat: "Dusun II Desa Beringin, Kec. Beringin",
    },
    {
      nama: "Siti Nurhaliza Zahra",
      jenis: "SISWA",
      nisn: "0062345602",
      namaKelas: "XI TJKT 2",
      telepon: null,
      alamat: "Jl. Mesjid No. 18, Beringin",
    },
    {
      nama: "Budi Santoso Wibowo",
      jenis: "SISWA",
      nisn: "0053456703",
      namaKelas: "XII BUSANA 1",
      telepon: null,
      alamat: "Jl. Sultan Serdang Gg. Kenanga No. 5",
    },
    {
      nama: "Dra. Hj. Nurhasanah, M.Pd.",
      jenis: "GURU",
      nisn: null,
      namaKelas: null,
      telepon: "081234567890",
      alamat: "Jl. Pendidikan No. 12, Beringin, Deli Serdang",
    },
    {
      nama: "Bambang Haryanto, S.Kom.",
      jenis: "STAF",
      nisn: null,
      namaKelas: null,
      telepon: "082198765432",
      alamat: "Komplek Guru SMKN 1 Beringin Blok B-3",
    },
  ];

  const createdAnggotaList = [];

  for (const item of dataAnggotaInput) {
    // Generate nomor anggota sequential berikutnya
    const lastAnggota = await prisma.anggota.findFirst({
      orderBy: { no_anggota: "desc" },
      select: { no_anggota: true },
    });

    let nextNoAnggota = "A0001";
    if (lastAnggota && lastAnggota.no_anggota) {
      const lastNum = parseInt(lastAnggota.no_anggota.slice(1), 10);
      nextNoAnggota = `A${(lastNum + 1).toString().padStart(4, "0")}`;
    }

    const kelasId = item.namaKelas ? (kelasMap[item.namaKelas] || null) : null;

    const anggota = await prisma.anggota.create({
      data: {
        no_anggota: nextNoAnggota,
        nama: item.nama,
        jenis: item.jenis,
        nisn: item.nisn,
        kelasId: kelasId,
        telepon: item.telepon,
        alamat: item.alamat,
        status_aktif: true,
      },
      include: {
        kelasRef: true,
      },
    });

    // Jika SISWA, sync juga ke tabel Siswa agar sinkron di semua halaman
    if (item.jenis === "SISWA" && item.nisn) {
      await prisma.siswa.upsert({
        where: { nisn: item.nisn },
        update: {
          nama: item.nama,
          kelas: item.namaKelas || "",
          kelasId: kelasId,
        },
        create: {
          nisn: item.nisn,
          nama: item.nama,
          kelas: item.namaKelas || "",
          kelasId: kelasId,
        },
      });
    }

    createdAnggotaList.push(anggota);
    console.log(`  ✓ [${anggota.no_anggota}] ${anggota.nama} (${anggota.jenis})`);
  }

  // 3. Buat 5 Data Buku Baru
  console.log("\n📚 Membuat 5 data baru Buku...");

  const dataBukuInput = [
    {
      judul: "Laskar Pelangi",
      penulis: "Andrea Hirata",
      kategori: "Fiksi & Sastra",
      klasifikasi: "813.01",
      tipe_buku: "BIASA",
      kode_buku: "978-979-3062-79-2",
      cover_url: "https://images.tokopedia.net/img/cache/700/product-1/2020/8/26/108761443/108761443_5e5d5c7e-6f5e-4f5f-8f5e-6f5e6f5e6f5e_700_700.jpg",
      stok_total: 3,
      is_referensi: false,
    },
    {
      judul: "Atomic Habits: Perubahan Kecil yang Memberikan Hasil Luar Biasa",
      penulis: "James Clear",
      kategori: "Pengembangan Diri",
      klasifikasi: "158.1",
      tipe_buku: "BIASA",
      kode_buku: "978-602-0633-93-0",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020633930.jpg",
      stok_total: 4,
      is_referensi: false,
    },
    {
      judul: "Dasar-Dasar Pengembangan Perangkat Lunak dan Gim (PPLG) Kelas X",
      penulis: "Wahyu Purnomo, S.Kom. & Tim",
      kategori: "Teknologi Informasi & Kejuruan",
      klasifikasi: "005.1",
      tipe_buku: "MAPEL",
      tahun_ajaran: "2024/2025",
      kode_buku: "978-623-1941-28-2",
      cover_url: "https://buku.kemdikbud.go.id/assets/images/logo-kemdikbud.png",
      stok_total: 8,
      is_referensi: false,
    },
    {
      judul: "Teknik Jaringan Komputer dan Telekomunikasi (TJKT) Kelas XI",
      penulis: "Iwan Sofana",
      kategori: "Jaringan & Telekomunikasi",
      klasifikasi: "004.6",
      tipe_buku: "MAPEL",
      tahun_ajaran: "2024/2025",
      kode_buku: "978-602-6232-45-8",
      cover_url: "https://images.tokopedia.net/img/cache/700/VqbcmM/2021/11/17/8cb76135-188b-49aa-9d2d-d558b38334be.jpg",
      stok_total: 6,
      is_referensi: false,
    },
    {
      judul: "Filosofi Kopi: Kumpulan Cerita dan Prosa Satu Dekade",
      penulis: "Dee Lestari",
      kategori: "Fiksi & Antologi",
      klasifikasi: "813.08",
      tipe_buku: "BIASA",
      kode_buku: "978-979-1227-21-6",
      cover_url: "https://cdn.gramedia.com/uploads/items/9786020822532_Filosofi-Kopi.jpg",
      stok_total: 3,
      is_referensi: false,
    },
  ];

  const createdBukuList = [];

  // Ambil counter eksemplar terakhir
  const lastEksemplar = await prisma.eksemplar.findFirst({
    orderBy: { kode: "desc" },
    select: { kode: true },
  });
  let nextKodeNum = lastEksemplar ? parseInt(lastEksemplar.kode, 10) : 0;

  for (const b of dataBukuInput) {
    const rakId = await findRakIdForKlasifikasi(b.klasifikasi, rakList);

    const buku = await prisma.buku.create({
      data: {
        judul: b.judul,
        penulis: b.penulis,
        kategori: b.kategori,
        klasifikasi: b.klasifikasi,
        tipe_buku: b.tipe_buku,
        tahun_ajaran: b.tahun_ajaran || null,
        kode_buku: b.kode_buku,
        cover_url: b.cover_url,
        stok_total: b.stok_total,
        stok_tersedia: b.stok_total,
        is_referensi: b.is_referensi,
      },
    });

    // Buat eksemplar fisik sesuai stok_total
    const eksemplarRows = [];
    for (let i = 0; i < b.stok_total; i++) {
      nextKodeNum += 1;
      eksemplarRows.push({
        kode: nextKodeNum.toString().padStart(8, "0"),
        bukuId: buku.id,
        rakId: rakId,
        tipe_koleksi: b.tipe_buku === "MAPEL" ? "Textbook" : "Reference",
        status: "TERSEDIA",
      });
    }

    await prisma.eksemplar.createMany({
      data: eksemplarRows,
    });

    createdBukuList.push({
      ...buku,
      eksemplarCount: eksemplarRows.length,
      sampleKode: eksemplarRows[0]?.kode,
    });

    console.log(`  ✓ "${buku.judul}" (${buku.penulis}) - ${eksemplarRows.length} eksemplar (kode ${eksemplarRows[0]?.kode} s/d ${eksemplarRows[eksemplarRows.length - 1]?.kode})`);
  }

  console.log("\n🎉 Sukses menambahkan 5 data Anggota dan 5 data Buku beserta Eksemplar!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
