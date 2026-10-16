"use server";

import { prisma } from "@/lib/prisma";
import { buildCallNumber } from "@/lib/label";
import { requireAdminSession } from "@/lib/security";

export type ItemLabelBuku = {
  id: string; // eksemplar id
  kode: string; // barcode 8 digit e.g. "00000001"
  status: string;
  rakNama: string;
  bukuId: string;
  judul: string;
  penulis: string;
  kategori: string;
  klasifikasi: string;
  isReferensi: boolean;
  coverUrl: string | null;
  callNumber: string;
  authorCode: string;
  titleCode: string;
  copyNumber: number;
};

export async function getEksemplarForLabels(params?: {
  search?: string;
  kategori?: string;
  rakId?: string;
  limit?: number;
}) {
  await requireAdminSession();
  const search = params?.search?.trim() || "";
  const kategori = params?.kategori || "";
  const rakId = params?.rakId || "";
  const limit = params?.limit || 300;

  const whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { kode: { contains: search, mode: "insensitive" } },
      { buku: { judul: { contains: search, mode: "insensitive" } } },
      { buku: { penulis: { contains: search, mode: "insensitive" } } },
      { buku: { klasifikasi: { contains: search, mode: "insensitive" } } },
      { buku: { kode_buku: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (kategori && kategori !== "ALL") {
    whereClause.buku = {
      ...(whereClause.buku || {}),
      kategori: kategori,
    };
  }

  if (rakId && rakId !== "ALL") {
    whereClause.rakId = rakId;
  }

  const eksemplarList = await prisma.eksemplar.findMany({
    where: whereClause,
    take: limit,
    orderBy: [
      { buku: { judul: "asc" } },
      { kode: "asc" },
    ],
    include: {
      buku: true,
      rak: true,
    },
  });

  // Hitung nomor copy (c.1, c.2) per buku
  const copyMap = new Map<string, number>();

  const items: ItemLabelBuku[] = eksemplarList.map((eks) => {
    const currentCopy = (copyMap.get(eks.bukuId) || 0) + 1;
    copyMap.set(eks.bukuId, currentCopy);

    const callNumber = buildCallNumber({
      klasifikasi: eks.buku.klasifikasi,
      penulis: eks.buku.penulis,
      judul: eks.buku.judul,
      isReferensi: eks.buku.is_referensi,
    });

    const cleanAuthor = (eks.buku.penulis || "")
      .trim()
      .split(/\s+/)[0]
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase()
      .slice(0, 3) || "NN";

    const cleanTitle = (eks.buku.judul || "")
      .trim()
      .split(/\s+/)[0]
      .replace(/[^A-Za-z]/g, "")
      .toLowerCase()
      .slice(0, 1) || "b";

    return {
      id: eks.id,
      kode: eks.kode,
      status: eks.status,
      rakNama: eks.rak?.nama || "Rak Umum",
      bukuId: eks.bukuId,
      judul: eks.buku.judul,
      penulis: eks.buku.penulis,
      kategori: eks.buku.kategori || "Umum",
      klasifikasi: eks.buku.klasifikasi || "000",
      isReferensi: eks.buku.is_referensi,
      coverUrl: eks.buku.cover_url,
      callNumber,
      authorCode: cleanAuthor,
      titleCode: cleanTitle,
      copyNumber: currentCopy,
    };
  });

  return items;
}

export async function getLabelFilterOptions() {
  const [kategoriList, rakList, totalEksemplar, totalBuku] = await Promise.all([
    prisma.buku.findMany({
      where: { kategori: { not: null } },
      distinct: ["kategori"],
      select: { kategori: true },
    }),
    prisma.rak.findMany({
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, nomor: true },
    }),
    prisma.eksemplar.count(),
    prisma.buku.count(),
  ]);

  const categories = kategoriList
    .map((k) => k.kategori)
    .filter((k): k is string => Boolean(k))
    .sort();

  return {
    categories,
    raks: rakList,
    totalEksemplar,
    totalBuku,
  };
}
