import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { checkRateLimit } from "@/lib/security";

export const authOptions: NextAuthOptions = {
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username dan password harus diisi");
        }

        const username = credentials.username.trim();

        // Perlindungan terhadap Brute-Force: Maksimal 5 percobaan gagal per 5 menit
        const rateCheck = checkRateLimit(`login:${username.toLowerCase()}`, 5, 5 * 60 * 1000);
        if (!rateCheck.allowed) {
          throw new Error(
            `Terlalu banyak percobaan login yang gagal. Akun dibatasi sementara. Silakan coba lagi dalam ${rateCheck.retryAfterSeconds} detik.`
          );
        }

        const admin = await prisma.admin.findUnique({
          where: { username },
        });

        if (!admin) {
          throw new Error("Username atau password salah");
        }

        let isPasswordValid = false;
        try {
          isPasswordValid = await bcrypt.compare(
            credentials.password,
            admin.password
          );
        } catch {
          isPasswordValid = false;
        }

        // Fallback jika password di database masih tersimpan dalam format teks biasa (plain text)
        if (!isPasswordValid && admin.password === credentials.password) {
          isPasswordValid = true;
          // Otomatis update ke bcrypt hash di background
          const newHashed = await bcrypt.hash(credentials.password, 10);
          await prisma.admin.update({
            where: { id: admin.id },
            data: { password: newHashed },
          });
        }

        if (!isPasswordValid) {
          throw new Error("Username atau password salah");
        }

        return {
          id: admin.id,
          name: admin.nama,
          email: admin.username,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // Sesi aktif maksimal 12 jam
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; name?: string | null; email?: string | null }).id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
