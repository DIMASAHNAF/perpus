import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const username = args[0] || process.env.ADMIN_USERNAME || "admin2";
  const password = args[1] || process.env.ADMIN_PASSWORD || "admin123";
  const nama = args[2] || process.env.ADMIN_NAMA || "Admin Perpustakaan 2";

  console.log(`Menyiapkan akun admin: ${username} (${nama})...`);

  const existing = await prisma.admin.findUnique({
    where: { username },
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  if (existing) {
    const updated = await prisma.admin.update({
      where: { username },
      data: {
        nama,
        password: hashedPassword,
      },
    });
    console.log(`✅ Akun admin '${username}' berhasil diperbarui.`);
    console.log(updated);
  } else {
    const created = await prisma.admin.create({
      data: {
        username,
        nama,
        password: hashedPassword,
      },
    });
    console.log(`✅ Akun admin '${username}' berhasil dibuat.`);
    console.log(created);
  }
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
