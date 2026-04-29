import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    signIn({ profile }) {
      const email = profile?.email ?? "";
      return email.endsWith("@metalbear.com");
    },
    session({ session, token }) {
      return session;
    },
    jwt({ token, profile }) {
      if (profile) token.email = profile.email;
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
