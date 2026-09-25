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

async function main() {
  console.log("🌱 Seeding kelas SMK...");

  for (const kelas of KELAS_DATA) {
    await prisma.kelas.upsert({
      where: { nama_kelas: kelas.nama_kelas },
      update: {},
      create: kelas,
    });
  }

  console.log(`✅ Berhasil seed ${KELAS_DATA.length} kelas SMK`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
