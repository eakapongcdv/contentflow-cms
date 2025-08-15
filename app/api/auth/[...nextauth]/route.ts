import NextAuth from "next-auth";
import { authOptions } from "./auth-options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
// ห้าม export อื่น เช่น authOptions
