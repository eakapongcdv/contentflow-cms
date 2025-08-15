// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // ใช้ JWT
  session: { strategy: "jwt" },

  // ใช้ Prisma adapter (แม้ใช้ JWT ก็ใช้ร่วมกันได้)
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        // ดึง field ที่ต้องใช้ให้ชัดเจน (รวม passwordHash)
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordHash: true,
          },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // object นี้จะถูกส่งเข้า jwt callback เป็น 'user'
        return { id: user.id, email: user.email, name: user.name, role: user.role } as any;
      },
    }),
  ],

  callbacks: {
    // ใส่ id และ role ลงใน JWT ทุกครั้งที่มี user (ตอนล็อกอิน)
    async jwt({ token, user }) {
      if (user) {
        // NextAuth ใส่ user.id มาให้แล้ว แต่ระบุชัดเจนไว้ด้วย
        (token as any).id = (user as any).id;
        (token as any).role = (user as any).role ?? (token as any).role ?? "USER";
      }
      // กันกรณีเคยมี sub อย่างเดียว: map sub -> id ถ้า id ยังไม่มี
      if (!(token as any).id && token.sub) {
        (token as any).id = token.sub;
      }
      if (!(token as any).role) {
        (token as any).role = "USER";
      }
      return token;
    },

    // ใส่ id และ role ลงที่ session สำหรับฝั่ง client/server components
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role ?? "USER";
      }
      return session;
    },
  },

  pages: {
    signIn: "/admin/login",
  },

  // ตั้งใน .env
  // NEXTAUTH_SECRET=...
  // NEXTAUTH_URL=...
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
