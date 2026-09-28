import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

/**
 * Single-user auth: only AUTHORIZED_EMAIL may ever get a valid session.
 * There is no registration, no user table beyond this one implicit admin,
 * and no roles/permissions system — by design (see spec §2).
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: { prompt: 'select_account' },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Secure-next-auth.session-token`
          : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/access-denied',
  },
  callbacks: {
    /**
     * This is the actual access-control gate. Returning false here rejects the
     * sign-in outright — the user never gets a session/cookie at all.
     */
    async signIn({ user }) {
      const authorizedEmail = process.env.AUTHORIZED_EMAIL?.toLowerCase().trim();
      if (!authorizedEmail) {
        console.error('[auth] AUTHORIZED_EMAIL is not configured — rejecting all logins.');
        return false;
      }
      if (!user.email) return false;
      return user.email.toLowerCase().trim() === authorizedEmail;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string | null | undefined;
        session.user.image = token.picture as string | null | undefined;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

/** Server-side helper: is this the one authorized admin? */
export function isAuthorizedEmail(email?: string | null): boolean {
  const authorizedEmail = process.env.AUTHORIZED_EMAIL?.toLowerCase().trim();
  if (!authorizedEmail || !email) return false;
  return email.toLowerCase().trim() === authorizedEmail;
}
