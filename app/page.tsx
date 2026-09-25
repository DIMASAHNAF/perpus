import { prisma } from "@/lib/prisma";
import KatalogBukuClient from "@/components/katalog/KatalogBukuClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const buku = await prisma.buku.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      eksemplar: {
        where: { rakId: { not: null } },
        select: { rak: { select: { nama: true } } },
        take: 1,
      },
    },
  });

  const data = buku.map((b) => ({
    ...b,
    rakNama: b.eksemplar[0]?.rak?.nama ?? null,
  }));

  return <KatalogBukuClient initialBuku={data} />;
}

