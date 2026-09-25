import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

(async () => {
  const buku = await p.buku.findMany({
    select: { id: true, judul: true, penulis: true, tipe_buku: true, klasifikasi: true },
  });
  console.log(JSON.stringify(buku, null, 2));
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
