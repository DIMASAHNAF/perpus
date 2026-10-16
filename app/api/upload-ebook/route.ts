import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Akses ditolak" }, { status: 401 });
    }

    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang dipilih" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    // Validasi ketat ekstensi dan tipe MIME
    if (ext !== ".pdf" || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Format tidak didukung. Hanya file PDF yang diperbolehkan." }, { status: 400 });
    }

    // Validasi ukuran file (maksimal 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file terlalu besar (maksimal 50MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validasi Magic Bytes PDF: dimulai dengan %PDF- (0x25 0x50 0x44 0x46 0x2D)
    if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return NextResponse.json(
        { error: "Isi file tidak valid sebagai format dokumen PDF yang sah." },
        { status: 400 }
      );
    }

    // Pastikan folder uploads/ebooks ada
    const uploadDir = path.join(process.cwd(), "public", "uploads", "ebooks");
    await mkdir(uploadDir, { recursive: true });

    // Generate nama file unik & aman dari path traversal
    const randomHex = crypto.randomBytes(12).toString("hex");
    const uniqueFileName = `${Date.now()}_${randomHex}.pdf`;
    const filePath = path.join(uploadDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/ebooks/${uniqueFileName}`;

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      fileName: file.name,
      fileSize: file.size 
    });
  } catch (error: any) {
    console.error("Ebook upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah file PDF: " + (error?.message || "Unknown error") }, { status: 500 });
  }
}
