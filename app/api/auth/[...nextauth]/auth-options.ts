import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  // ใช้ Prisma adapter ได้ แม้ session เป็น JWT
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email:    { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        // ดึงเฉพาะฟิลด์ที่ใช้ + passwordHash
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, role: true, passwordHash: true, image: true },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // จะถูกส่งไป jwt callback เป็น user
        return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image } as any;
      },
    }),
    // ===== Google (เพิ่มเมื่อมี ENV ครบ) =====
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          allowDangerousEmailAccountLinking: false,
        })]
      : []),
    // ===== Microsoft Azure AD/Entra (เพิ่มเมื่อมี ENV ครบ) =====
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? [AzureADProvider({
          clientId: process.env.AZURE_AD_CLIENT_ID!,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
          tenantId: process.env.AZURE_AD_TENANT_ID ?? "common",
          allowDangerousEmailAccountLinking: false,
        })]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // ใส่ id/role ตอนล็อกอิน
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).role = (user as any).role ?? (token as any).role ?? "USER";
      }
      // กันกรณีมีแค่ sub
      if (!(token as any).id && token.sub) (token as any).id = token.sub;
      if (!(token as any).role) (token as any).role = "USER";
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role ?? "USER";
      }
      return session;
    },
  },

  pages: {
    // หน้า login ของคุณคือ /app/admin/page.tsx → /admin
    signIn: "/admin",
  },
  // ต้องมีใน .env:
  // NEXTAUTH_SECRET=...
  // NEXTAUTH_URL=...
};
