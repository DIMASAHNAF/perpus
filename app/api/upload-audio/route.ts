import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

    // Validasi ekstensi dan tipe MIME audio
    const validExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];
    const ext = path.extname(file.name).toLowerCase();
    const isAudioType = file.type.startsWith("audio/") || validExtensions.includes(ext);

    if (!isAudioType || !validExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "Format file tidak valid. Hanya file audio (MP3, WAV, OGG, M4A, AAC) yang diperbolehkan." },
        { status: 400 }
      );
    }

    // Batasi ukuran maksimal 20MB
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file audio terlalu besar (maksimal 20MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const audioDir = path.join(process.cwd(), "public", "audio");
    await mkdir(audioDir, { recursive: true });

    const targetFile = path.join(audioDir, "dua_lipa.mp3");
    await writeFile(targetFile, buffer);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      size: file.size,
      message: "File audio berhasil di-upload ke public/audio/dua_lipa.mp3",
    });
  } catch (error: any) {
    console.error("Audio upload error:", error);
    return NextResponse.json(
      { error: "Gagal mengunggah audio: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
