// authOptions.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma) as any,

  // ✅ เปิด debug + logger
  debug: true,
  logger: {
    error(code, meta) { console.error("[next-auth][error]", code, meta); },
    warn(code) { console.warn("[next-auth][warn]", code); },
    debug(code, meta) { console.log("[next-auth][debug]", code, meta); },
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email:    { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        console.log("[Auth] Attempt login:", { email, hasPassword: !!password });

        try {
          if (!email || !password) {
            console.warn("[Auth] Missing email or password");
            return null;
          }

          const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: { id: true, email: true, name: true, role: true, passwordHash: true, image: true },
          });

          if (!user) {
            console.warn("[Auth] No user found for:", email);
            return null;
          }
          if (!user.passwordHash) {
            console.warn("[Auth] User has no passwordHash:", user.email);
            return null;
          }

          const ok = await bcrypt.compare(password, user.passwordHash);
          console.log("[Auth] Compare bcrypt:", { ok, inputLen: password.length, hashLen: user.passwordHash.length });

          if (!ok) {
            console.warn("[Auth] Invalid password for:", email);
            return null;
          }

          console.log("[Auth] SUCCESS login:", email);
          return { id: String(user.id), email: user.email, name: user.name, role: user.role, image: user.image } as any;
        } catch (err) {
          // ✅ ดัก Prisma/Runtime error ที่อาจทำให้ 401 แบบเงียบ ๆ
          console.error("[Auth] authorize() threw:", err);
          return null;
        }
      },
    }),

    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        })]
      : []),

    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? [AzureADProvider({
          clientId: process.env.AZURE_AD_CLIENT_ID!,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
          tenantId: process.env.AZURE_AD_TENANT_ID ?? "common",
        })]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id ?? token.sub;
        (token as any).role = (user as any).role ?? (token as any).role ?? "USER";
        console.log("[Auth] jwt set:", { id: (token as any).id, role: (token as any).role });
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role ?? "USER";
        console.log("[Auth] session:", { email: session.user.email, id: (token as any).id, role: (token as any).role });
      }
      return session;
    },
  },

  pages: { signIn: "/admin/login" },
};