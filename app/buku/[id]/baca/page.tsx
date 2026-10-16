import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EbookReaderClient } from "@/components/ebook/EbookReaderClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const buku = await prisma.buku.findUnique({
    where: { id },
    select: { judul: true, penulis: true },
  });

  if (!buku) return { title: "Buku Tidak Ditemukan" };

  return {
    title: `Baca E-Book: ${buku.judul} - Perpustakaan Digital SMK Negeri 1 Beringin`,
    description: `Baca buku digital "${buku.judul}" karya ${buku.penulis} secara online di Perpustakaan Digital SMK Negeri 1 Beringin.`,
  };
}

export default async function BacaEbookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buku = await prisma.buku.findUnique({
    where: { id },
    select: {
      id: true,
      judul: true,
      penulis: true,
      cover_url: true,
      file_url: true,
      kategori: true,
      klasifikasi: true,
      tipe_buku: true,
      kode_buku: true,
    },
  });

  if (!buku) notFound();

  return <EbookReaderClient buku={buku} />;
}
