import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const authConfig = {
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          const { email, password } = credentialsSchema.parse(credentials);
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user || !user.password || !user.isActive) {
            return null;
          }

          const passwordMatch = await compare(password, user.password);
          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const userId = typeof user?.id === "string" ? user.id : token.id;

      if (userId) {
        token.id = userId;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { role: true, isActive: true },
        });

        if (!dbUser || !dbUser.isActive) {
          return { ...token, invalid: true };
        }

        token.role = dbUser.role as "OWNER" | "STAFF" | "ACCOUNTANT";
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = String(token.id ?? session.user.id ?? "");
      session.user.role = (token.role as "OWNER" | "STAFF" | "ACCOUNTANT") ?? "STAFF";
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
