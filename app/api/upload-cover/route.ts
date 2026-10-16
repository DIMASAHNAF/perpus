import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Validasi Magic Bytes untuk memastikan file benar-benar gambar
function isValidImageSignature(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 8) return false;
  // JPEG / JPG
  if (ext === ".jpg" || ext === ".jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  // PNG
  if (ext === ".png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  // GIF
  if (ext === ".gif") {
    return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  }
  // WEBP (RIFF....WEBP)
  if (ext === ".webp") {
    return (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    );
  }
  // AVIF (ftypavif)
  if (ext === ".avif") {
    return buffer.subarray(4, 12).toString("ascii").includes("ftyp");
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Akses ditolak" }, { status: 401 });
    }

    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file gambar yang dipilih" }, { status: 400 });
    }

    // Validasi ekstensi dan tipe MIME (SVG dilarang untuk mencegah Stored XSS)
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    const fileExt = path.extname(file.name).toLowerCase();

    if (!validExtensions.includes(fileExt) || !validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap upload gambar raster aman (JPG, PNG, WEBP, atau GIF)." },
        { status: 400 }
      );
    }

    // Validasi ukuran file (maksimal 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran gambar terlalu besar (maksimal 10MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validasi Magic Bytes konten file asli
    if (!isValidImageSignature(buffer, fileExt)) {
      return NextResponse.json(
        { error: "File tidak valid atau rusak (isi file tidak sesuai dengan ekstensi gambar)." },
        { status: 400 }
      );
    }

    // Pastikan folder public/uploads/covers ada
    const uploadDir = path.join(process.cwd(), "public", "uploads", "covers");
    await mkdir(uploadDir, { recursive: true });

    // Generate nama file acak kriptografis yang aman dari path traversal
    const randomHex = crypto.randomBytes(12).toString("hex");
    const uniqueFileName = `${Date.now()}_${randomHex}${fileExt}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/covers/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: imageUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error("Cover upload error:", error);
    return NextResponse.json(
      { error: "Gagal mengunggah gambar sampul: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
