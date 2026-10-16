import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "perpus-motion.mp4");

  if (!fs.existsSync(filePath)) {
    // Fallback to out/perpus-motion.mp4 if public not copied yet
    const outPath = path.join(process.cwd(), "out", "perpus-motion.mp4");
    if (!fs.existsSync(outPath)) {
      return new NextResponse("Video belum selesai dirender", { status: 404 });
    }
    const videoBuffer = fs.readFileSync(outPath);
    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="Motion-Graphic-Perpustakaan-SMKN1-Beringin.mp4"',
        "Content-Length": videoBuffer.length.toString(),
      },
    });
  }

  const videoBuffer = fs.readFileSync(filePath);
  return new NextResponse(videoBuffer, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": 'attachment; filename="Motion-Graphic-Perpustakaan-SMKN1-Beringin.mp4"',
      "Content-Length": videoBuffer.length.toString(),
    },
  });
}
