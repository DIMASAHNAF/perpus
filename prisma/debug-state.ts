import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

(async () => {
  const totalEks = await p.eksemplar.count();
  const eksNullRak = await p.eksemplar.count({ where: { rakId: null } });
  const bukuWithKlas = await p.buku.count({ where: { NOT: { klasifikasi: null } } });
  const totalBuku = await p.buku.count();
  const rakCount = await p.rak.count();

  console.log("eksemplar total:", totalEks);
  console.log("eksemplar rakId NULL:", eksNullRak);
  console.log("buku total:", totalBuku);
  console.log("buku dengan klasifikasi:", bukuWithKlas);
  console.log("rak terdaftar:", rakCount);

  const sample = await p.buku.findMany({ take: 5, select: { judul: true, klasifikasi: true, tipe_buku: true } });
  console.log("sample buku:", JSON.stringify(sample, null, 2));

  const sampleEks = await p.eksemplar.findMany({ take: 3, include: { buku: { select: { klasifikasi: true } } } });
  console.log("sample eksemplar:", JSON.stringify(sampleEks.map(e => ({ kode: e.kode, rakId: e.rakId, klas: e.buku.klasifikasi })), null, 2));
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
